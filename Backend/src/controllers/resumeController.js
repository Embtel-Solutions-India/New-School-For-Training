import PDFDocument from "pdfkit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import Certificate from "../models/Certificate.js";
import Enrollment from "../models/Enrollment.js";
import ActivityLog from "../models/ActivityLog.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GET /api/resume
export const getMyResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id }).lean();
  res.json({ success: true, resume: resume || null });
});

// POST /api/resume — upsert
export const saveResume = asyncHandler(async (req, res) => {
  const { template, summary, skills, education, experience, projects, certifications, achievements } = req.body;

  const resume = await Resume.findOneAndUpdate(
    { user: req.user._id },
    { template, summary, skills, education, experience, projects, certifications, achievements },
    { new: true, upsert: true, runValidators: false }
  );

  ActivityLog.create({
    user: req.user._id,
    type: "resume_created",
    description: "Resume saved",
    metadata: { template },
  }).catch(() => {});

  res.json({ success: true, resume });
});

// POST /api/resume/autofill — populate from profile
export const autofillResume = asyncHandler(async (req, res) => {
  const [user, certificates, enrollments] = await Promise.all([
    User.findById(req.user._id)
      .select("name email bio skills interests learningGoals socialLinks portfolio")
      .lean(),
    Certificate.find({ student: req.user._id })
      .populate("course", "title")
      .lean(),
    Enrollment.find({ user: req.user._id })
      .populate("course", "title")
      .lean(),
  ]);

  const certifications = certificates.map(cert => ({
    title: `Certificate of Completion – ${cert.course?.title || "Course"}`,
    issuer: "SFT Learning Platform",
    date: new Date(cert.issuedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    certificateId: cert.certificateId || "",
  }));

  const achievements = [];
  if (user?.learningGoals?.length) {
    achievements.push(...user.learningGoals.map(g => `Goal: ${g}`));
  }

  const prefill = {
    skills: user?.skills || [],
    summary: user?.bio || "",
    certifications,
    achievements,
  };

  res.json({ success: true, prefill });
});

// POST /api/resume/ai-enhance
export const aiEnhanceResume = asyncHandler(async (req, res) => {
  const { resumeData } = req.body;
  const user = await User.findById(req.user._id)
    .select("name skills interests learningGoals")
    .lean();

  const prompt = `You are a professional resume writer. Enhance the following resume for ${user?.name || "the candidate"}.

Resume Data:
${JSON.stringify(resumeData || {}, null, 2)}

Skills profile: ${(user?.skills || []).join(", ")}
Interests: ${(user?.interests || []).join(", ")}

Return ONLY a valid JSON object (no markdown, no explanation) with:
{
  "summary": "2-3 sentence compelling professional summary",
  "suggestedSkills": ["skill1", "skill2", ...up to 8 skills],
  "projectDescriptions": { "projectTitle": "improved 1-2 sentence description" }
}`;

  let enhancements = { summary: "", suggestedSkills: [], projectDescriptions: {} };
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, "").trim();
    enhancements = JSON.parse(text);
  } catch { /* return empty enhancements on failure */ }

  res.json({ success: true, enhancements });
});

// GET /api/resume/download — stream PDF
export const downloadResumePDF = asyncHandler(async (req, res) => {
  const [resume, user] = await Promise.all([
    Resume.findOne({ user: req.user._id }).lean(),
    User.findById(req.user._id).select("name email bio skills socialLinks").lean(),
  ]);

  if (!resume) throw new ApiError(404, "No resume found. Please create your resume first.");

  const safeName = (user?.name || "resume").replace(/\s+/g, "-").toLowerCase();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}-resume.pdf"`);

  buildResumePDF(resume, user, res);
});

// ── PDF Generation ─────────────────────────────────────────────────────────

function buildResumePDF(resume, user, stream) {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });
  doc.pipe(stream);

  const W = doc.page.width;   // 595.28
  const MARGIN = 48;
  const CONTENT_W = W - MARGIN * 2;

  const tmpl = resume.template || "modern";
  const HEADER_COLOR = tmpl === "classic" ? "#1e3a8a" : tmpl === "minimal" ? "#1f2937" : "#0d1b2a";
  const ACCENT = tmpl === "classic" ? "#2563eb" : tmpl === "minimal" ? "#374151" : "#B8860B";

  let y = 0;

  // ── HEADER BAND
  const headerH = 110;
  doc.rect(0, 0, W, headerH).fill(HEADER_COLOR);

  doc.fillColor("#ffffff").fontSize(24).font("Helvetica-Bold")
    .text(user?.name || "Your Name", MARGIN, 22, { width: CONTENT_W });

  const contactParts = [];
  if (user?.email) contactParts.push(user.email);
  if (user?.socialLinks?.linkedin) contactParts.push(`linkedin: ${user.socialLinks.linkedin}`);
  if (user?.socialLinks?.github) contactParts.push(`github: ${user.socialLinks.github}`);
  if (user?.socialLinks?.website) contactParts.push(user.socialLinks.website);

  doc.fillColor("#aab0bb").fontSize(8.5).font("Helvetica")
    .text(contactParts.join("   ·   "), MARGIN, 54, { width: CONTENT_W });

  if (tmpl !== "minimal" && user?.bio) {
    doc.fillColor("#ffffff").fillOpacity(0.55).fontSize(8.5).font("Helvetica")
      .text(user.bio.substring(0, 120), MARGIN, 72, { width: CONTENT_W - 20 });
    doc.fillOpacity(1);
  }

  y = headerH + 18;

  // ── Skills strip
  const allSkills = [...new Set([...(resume.skills || []), ...(user?.skills || [])])];
  if (allSkills.length) {
    doc.fillColor(ACCENT).fontSize(7.5).font("Helvetica-Bold")
      .text("SKILLS", MARGIN, y, { lineBreak: false });
    y += 13;
    doc.fillColor("#374151").fontSize(8.5).font("Helvetica")
      .text(allSkills.join("   ·   "), MARGIN, y, { width: CONTENT_W });
    y += doc.heightOfString(allSkills.join("   ·   "), { width: CONTENT_W }) + 10;
    doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).lineWidth(0.4).strokeColor("#e5e7eb").stroke();
    y += 12;
  }

  const checkPage = (needed = 60) => {
    if (y + needed > doc.page.height - 40) {
      doc.addPage();
      y = 40;
    }
  };

  const sectionHeader = (title) => {
    checkPage(35);
    doc.fillColor(HEADER_COLOR).fontSize(9.5).font("Helvetica-Bold")
      .text(title.toUpperCase(), MARGIN, y);
    y += 3;
    doc.moveTo(MARGIN, y + 9).lineTo(W - MARGIN, y + 9).lineWidth(1.2).strokeColor(HEADER_COLOR).stroke();
    y += 16;
  };

  // ── SUMMARY
  if (resume.summary) {
    sectionHeader("Professional Summary");
    doc.fillColor("#374151").fontSize(9.5).font("Helvetica")
      .text(resume.summary, MARGIN, y, { width: CONTENT_W, align: "justify" });
    y += doc.heightOfString(resume.summary, { width: CONTENT_W }) + 14;
  }

  // ── EXPERIENCE
  if (resume.experience?.length) {
    sectionHeader("Work Experience");
    for (const exp of resume.experience) {
      checkPage(40);
      doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold")
        .text(exp.role || "Role", MARGIN, y);
      const dateStr = exp.startDate ? `${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : " – Present"}` : "";
      doc.fillColor(ACCENT).fontSize(8.5).font("Helvetica")
        .text(`${exp.company || ""}${dateStr ? `   ·   ${dateStr}` : ""}`, MARGIN, y + 14);
      y += 28;
      if (exp.description) {
        checkPage(20);
        doc.fillColor("#4b5563").fontSize(9).font("Helvetica")
          .text(exp.description, MARGIN + 10, y, { width: CONTENT_W - 10 });
        y += doc.heightOfString(exp.description, { width: CONTENT_W - 10 }) + 4;
      }
      y += 6;
    }
    y += 4;
  }

  // ── EDUCATION
  if (resume.education?.length) {
    sectionHeader("Education");
    for (const edu of resume.education) {
      checkPage(35);
      const degreeStr = [edu.degree, edu.field].filter(Boolean).join(" in ");
      doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold")
        .text(degreeStr || "Degree", MARGIN, y);
      const eduDetail = [
        edu.institution,
        edu.startYear && edu.endYear ? `${edu.startYear} – ${edu.endYear}` : edu.startYear || "",
        edu.grade,
      ].filter(Boolean).join("   ·   ");
      doc.fillColor(ACCENT).fontSize(8.5).font("Helvetica")
        .text(eduDetail, MARGIN, y + 14);
      y += 32;
    }
    y += 4;
  }

  // ── PROJECTS
  if (resume.projects?.length) {
    sectionHeader("Projects");
    for (const proj of resume.projects) {
      checkPage(40);
      doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold")
        .text(proj.title || "Project", MARGIN, y);
      if (proj.tech?.length) {
        doc.fillColor(ACCENT).fontSize(8).font("Helvetica")
          .text(proj.tech.join(", "), MARGIN, y + 14);
        y += 26;
      } else {
        y += 16;
      }
      if (proj.description) {
        checkPage(20);
        doc.fillColor("#4b5563").fontSize(9).font("Helvetica")
          .text(proj.description, MARGIN + 10, y, { width: CONTENT_W - 10 });
        y += doc.heightOfString(proj.description, { width: CONTENT_W - 10 }) + 4;
      }
      if (proj.link) {
        doc.fillColor("#6b7280").fontSize(7.5).font("Helvetica")
          .text(`${proj.link}`, MARGIN + 10, y);
        y += 12;
      }
      y += 6;
    }
    y += 4;
  }

  // ── CERTIFICATIONS
  if (resume.certifications?.length) {
    sectionHeader("Certifications");
    for (const cert of resume.certifications) {
      checkPage(30);
      doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold")
        .text(cert.title || "Certificate", MARGIN, y);
      const certDetail = [cert.issuer, cert.date].filter(Boolean).join("   ·   ");
      if (certDetail) {
        doc.fillColor(ACCENT).fontSize(8.5).font("Helvetica").text(certDetail, MARGIN, y + 14);
        y += 28;
      } else {
        y += 16;
      }
    }
    y += 4;
  }

  // ── ACHIEVEMENTS
  if (resume.achievements?.length) {
    sectionHeader("Achievements");
    for (const ach of resume.achievements) {
      checkPage(18);
      doc.fillColor("#374151").fontSize(9).font("Helvetica")
        .text(`•  ${ach}`, MARGIN + 6, y, { width: CONTENT_W - 6 });
      y += doc.heightOfString(`•  ${ach}`, { width: CONTENT_W - 6 }) + 5;
    }
  }

  doc.end();
}
