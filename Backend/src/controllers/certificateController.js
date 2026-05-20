import PDFDocument from "pdfkit";
import asyncHandler from "../utils/asyncHandler.js";
import Certificate from "../models/Certificate.js";
import ApiError from "../utils/ApiError.js";

export const downloadCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certId })
    .populate("student", "name email")
    .populate({ path: "course", select: "title teacher", populate: { path: "teacher", select: "name" } })
    .lean();

  if (!cert) throw new ApiError(404, "Certificate not found");

  // Only the certificate owner or admin can download
  if (
    req.user.role !== "admin" &&
    cert.student._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Access denied");
  }

  const studentName = cert.student?.name || "Student";
  const courseTitle = cert.course?.title || "Course";
  const instructorName = cert.course?.teacher?.name || "";
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const certId = cert.certificateId;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="certificate-${certId}.pdf"`);

  const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
  doc.pipe(res);

  const W = doc.page.width;   // 841.89
  const H = doc.page.height;  // 595.28

  // Background
  doc.rect(0, 0, W, H).fill("#ffffff");

  // Top accent bar
  doc.rect(0, 0, W, 8).fill("#1d4ed8");

  // Outer border
  doc.rect(20, 20, W - 40, H - 40)
    .lineWidth(1.5)
    .stroke("#e5e7eb");

  // Inner decorative border
  doc.rect(32, 32, W - 64, H - 64)
    .lineWidth(0.5)
    .stroke("#d1d5db");

  // Header region background
  doc.rect(20, 20, W - 40, 90).fill("#1e3a5f");

  // Organization name
  doc.fillColor("#93c5fd")
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("SFT LEARNING", 0, 40, { align: "center" });

  // Certificate title
  doc.fillColor("#ffffff")
    .fontSize(26)
    .font("Helvetica-Bold")
    .text("CERTIFICATE OF COMPLETION", 0, 62, { align: "center" });

  // Decorative horizontal rule
  const ruleY = 125;
  doc.moveTo(80, ruleY).lineTo(W - 80, ruleY).lineWidth(0.8).stroke("#d1fae5");

  // "This is to certify that"
  doc.fillColor("#6b7280").fontSize(12).font("Helvetica")
    .text("This is to certify that", 0, 148, { align: "center" });

  // Student name
  doc.fillColor("#111827").fontSize(38).font("Helvetica-Bold")
    .text(studentName, 60, 172, { align: "center", width: W - 120 });

  // "has successfully completed"
  doc.fillColor("#6b7280").fontSize(12).font("Helvetica")
    .text("has successfully completed", 0, 226, { align: "center" });

  // Course title
  doc.fillColor("#1d4ed8").fontSize(20).font("Helvetica-Bold")
    .text(courseTitle, 80, 250, { align: "center", width: W - 160 });

  // Instructor
  if (instructorName) {
    doc.fillColor("#6b7280").fontSize(11).font("Helvetica")
      .text(`Instructed by ${instructorName}`, 0, 295, { align: "center" });
  }

  // Bottom divider
  const bottomY = 340;
  doc.moveTo(80, bottomY).lineTo(W - 80, bottomY).lineWidth(0.5).stroke("#e5e7eb");

  // Date (left) | Grade (center) | Certificate ID (right)
  const infoY = 360;
  doc.fillColor("#374151").fontSize(10).font("Helvetica-Bold")
    .text("DATE ISSUED", 80, infoY)
    .font("Helvetica").fillColor("#111827").fontSize(12)
    .text(issuedDate, 80, infoY + 16);

  doc.fillColor("#374151").fontSize(10).font("Helvetica-Bold")
    .text("GRADE", 0, infoY, { align: "center" })
    .font("Helvetica").fillColor("#16a34a").fontSize(12)
    .text(cert.grade || "Pass", 0, infoY + 16, { align: "center" });

  const rightX = W - 200;
  doc.fillColor("#374151").fontSize(10).font("Helvetica-Bold")
    .text("CERTIFICATE ID", rightX, infoY, { width: 140 })
    .font("Helvetica").fillColor("#6b7280").fontSize(9)
    .text(certId, rightX, infoY + 16, { width: 140 });

  // Bottom accent bar
  doc.rect(0, H - 8, W, 8).fill("#1d4ed8");

  doc.end();
});
