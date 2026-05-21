import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import asyncHandler from "../utils/asyncHandler.js";
import Certificate from "../models/Certificate.js";
import ApiError from "../utils/ApiError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../../../Frontend/public/images/sft_logo.png");
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export const downloadCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certId })
    .populate("student", "name email")
    .populate({ path: "course", select: "title teacher", populate: { path: "teacher", select: "name" } })
    .lean();

  if (!cert) throw new ApiError(404, "Certificate not found");
  if (req.user.role !== "admin" && cert.student._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="certificate-${cert.certificateId}.pdf"`);
  await buildCertificatePDF(cert, res);
});

export const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certId })
    .populate("student", "name")
    .populate({ path: "course", select: "title teacher", populate: { path: "teacher", select: "name" } })
    .lean();

  if (!cert) throw new ApiError(404, "Certificate not found");

  res.json({
    success: true,
    certificate: {
      certificateId: cert.certificateId,
      studentName: cert.student?.name,
      courseTitle: cert.course?.title,
      instructorName: cert.course?.teacher?.name,
      grade: cert.grade,
      issuedAt: cert.issuedAt,
    },
  });
});

async function buildCertificatePDF(cert, stream) {
  const studentName = cert.student?.name || "Student";
  const courseTitle = cert.course?.title || "Course";
  const instructorName = cert.course?.teacher?.name || "";
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const certId = cert.certificateId;
  const verifyUrl = `${CLIENT_URL}/certificate/verify/${certId}`;

  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    width: 160,
    margin: 1,
    color: { dark: "#0d1b2a", light: "#ffffff" },
  });

  const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
  doc.pipe(stream);

  const W = doc.page.width;   // 841.89
  const H = doc.page.height;  // 595.28

  // ── BACKGROUND (warm cream)
  doc.rect(0, 0, W, H).fill("#FFFDF6");

  // ── OUTER GOLD BORDER (3pt)
  doc.rect(14, 14, W - 28, H - 28)
    .lineWidth(3).strokeColor("#B8860B").stroke();

  // ── INNER THIN GOLD BORDER (0.8pt)
  doc.rect(22, 22, W - 44, H - 44)
    .lineWidth(0.8).strokeColor("#DAA520").stroke();

  // ── CORNER ORNAMENTS
  [[14, 14], [W - 20, 14], [14, H - 20], [W - 20, H - 20]].forEach(([x, y]) => {
    doc.rect(x, y, 6, 6).fill("#B8860B");
  });

  // ── NAVY HEADER BAND
  doc.rect(14, 14, W - 28, 78).fill("#0d1b2a");

  // ── LOGO
  let orgTextX = 40;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 32, 21, { width: 54, height: 54 });
      orgTextX = 97;
    }
  } catch { /* degrade gracefully */ }

  doc.fillColor("#D4A017").fontSize(15).font("Helvetica-Bold")
    .text("SFT LEARNING PLATFORM", orgTextX, 30, { lineBreak: false });
  doc.fillColor("#aab0bb").fontSize(9).font("Helvetica")
    .text("schoolfortraining.com  ·  Excellence in Online Education", orgTextX, 52, { lineBreak: false });
  doc.fillColor("#666d75").fontSize(8).font("Helvetica")
    .text("OFFICIAL CERTIFICATE", W - 222, 42, { width: 190, align: "right", lineBreak: false });

  // ── CERTIFICATE TITLE
  doc.fillColor("#0d1b2a").fontSize(28).font("Helvetica-Bold")
    .text("CERTIFICATE OF COMPLETION", 0, 108, { align: "center" });

  // ── TRIPLE DECORATIVE GOLD RULE
  const rY = 152;
  const rX1 = 100, rX2 = W - 100;
  doc.moveTo(rX1, rY - 2).lineTo(rX2, rY - 2).lineWidth(0.4).strokeColor("#DAA520").stroke();
  doc.moveTo(rX1, rY).lineTo(rX2, rY).lineWidth(1.5).strokeColor("#B8860B").stroke();
  doc.moveTo(rX1, rY + 2).lineTo(rX2, rY + 2).lineWidth(0.4).strokeColor("#DAA520").stroke();

  // ── CERTIFY TEXT
  doc.fillColor("#6b7280").fontSize(11).font("Helvetica")
    .text("This is to certify that", 0, 166, { align: "center" });

  // ── STUDENT NAME
  doc.fillColor("#111827").fontSize(36).font("Helvetica-Bold")
    .text(studentName, 60, 184, { align: "center", width: W - 120 });

  // ── NAME UNDERLINE
  doc.moveTo(220, 235).lineTo(W - 220, 235)
    .lineWidth(0.8).strokeColor("#DAA520").stroke();

  // ── HAS COMPLETED
  doc.fillColor("#6b7280").fontSize(11).font("Helvetica")
    .text("has successfully completed the course", 0, 244, { align: "center" });

  // ── COURSE TITLE
  doc.fillColor("#1e40af").fontSize(20).font("Helvetica-Bold")
    .text(courseTitle, 80, 262, { align: "center", width: W - 160 });

  // ── INSTRUCTOR
  if (instructorName) {
    doc.fillColor("#374151").fontSize(10).font("Helvetica")
      .text("Instructed by  ", 0, 299, { align: "center", continued: true })
      .font("Helvetica-Bold").text(instructorName);
  }

  // ── MID DIVIDER
  doc.moveTo(50, 324).lineTo(W - 50, 324)
    .lineWidth(0.5).strokeColor("#e5e7eb").stroke();

  // ── BOTTOM INFO SECTION
  const iY = 337;

  // Left — Date & Certificate ID
  doc.fillColor("#6b7280").fontSize(8).font("Helvetica-Bold")
    .text("DATE ISSUED", 62, iY);
  doc.fillColor("#111827").fontSize(11).font("Helvetica")
    .text(issuedDate, 62, iY + 14);
  doc.fillColor("#6b7280").fontSize(8).font("Helvetica-Bold")
    .text("CERTIFICATE ID", 62, iY + 38);
  doc.fillColor("#9ca3af").fontSize(8).font("Courier")
    .text(certId, 62, iY + 51, { width: 220 });

  // Center — Grade & Signature
  const cX = W / 2;
  doc.fillColor("#6b7280").fontSize(8).font("Helvetica-Bold")
    .text("GRADE", cX - 60, iY, { width: 120, align: "center" });
  const gradeColor = (cert.grade === "Pass" || cert.grade === "A" || cert.grade === "A+") ? "#16a34a" : "#1e40af";
  doc.fillColor(gradeColor).fontSize(16).font("Helvetica-Bold")
    .text(cert.grade || "Pass", cX - 60, iY + 13, { width: 120, align: "center" });

  const sigY = iY + 55;
  doc.moveTo(cX - 80, sigY).lineTo(cX + 80, sigY)
    .lineWidth(0.7).strokeColor("#374151").stroke();
  doc.fillColor("#374151").fontSize(9).font("Helvetica")
    .text(instructorName || "SFT Platform", cX - 80, sigY + 5, { width: 160, align: "center" });
  doc.fillColor("#9ca3af").fontSize(7).font("Helvetica")
    .text("AUTHORIZED SIGNATURE", cX - 80, sigY + 17, { width: 160, align: "center" });

  // Right — QR Code
  const qrX = W - 145;
  const qrY2 = iY - 5;
  doc.image(qrBuffer, qrX, qrY2, { width: 80, height: 80 });
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica")
    .text("Scan to verify", qrX, qrY2 + 83, { width: 80, align: "center" });

  // ── SECOND TRIPLE GOLD RULE
  const r2Y = 437;
  doc.moveTo(rX1, r2Y - 2).lineTo(rX2, r2Y - 2).lineWidth(0.4).strokeColor("#DAA520").stroke();
  doc.moveTo(rX1, r2Y).lineTo(rX2, r2Y).lineWidth(1.5).strokeColor("#B8860B").stroke();
  doc.moveTo(rX1, r2Y + 2).lineTo(rX2, r2Y + 2).lineWidth(0.4).strokeColor("#DAA520").stroke();

  // ── FOOTER NAVY BAND
  doc.rect(14, 445, W - 28, 50).fill("#0d1b2a");
  doc.fillColor("#aab0bb").fontSize(8).font("Helvetica")
    .text(`Verify this certificate at: ${verifyUrl}`, 30, 455, { align: "center", width: W - 60 });
  doc.fillColor("#666d75").fontSize(7).font("Helvetica")
    .text(
      `Certificate ID: ${certId}  ·  Issued by SFT Learning Platform  ·  ${issuedDate}`,
      30, 469, { align: "center", width: W - 60 }
    );

  // ── BOTTOM GOLD ACCENT
  doc.rect(14, 497, W - 28, 5).fill("#B8860B");

  doc.end();
}
