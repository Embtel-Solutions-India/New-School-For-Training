import nodemailer from "nodemailer";
import EmailLog from "../models/EmailLog.js";

export const buildClientUrl = (path, params = {}) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
  return url.toString();
};

// ── Transporter (lazy singleton) ─────────────────────────────────────────────
let _transporter = null;

const isConfigured = () =>
  !!(process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT || "587") === 465,
      auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
    });
  }
  return _transporter;
};

// ── Core send function ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, template = "", meta = {} }) => {
  const transporter = getTransporter();
  const logEntry = { to, subject, template, meta };

  if (!transporter) {
    console.log(`[email:skipped] ${subject} → ${to}`);
    await EmailLog.create({ ...logEntry, status: "skipped" }).catch(() => {});
    return { skipped: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_EMAIL,
      to,
      subject,
      html,
    });
    await EmailLog.create({ ...logEntry, status: "sent" }).catch(() => {});
    return { sent: true };
  } catch (err) {
    const error = err?.message || "Unknown error";
    console.error(`[email:failed] ${subject} → ${to}:`, error);
    await EmailLog.create({ ...logEntry, status: "failed", error }).catch(() => {});
    return { failed: true, error };
  }
};

// ── Base HTML wrapper ─────────────────────────────────────────────────────────
const wrap = (content, preview = "") => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notification</title>
${preview ? `<div style="display:none;max-height:0;overflow:hidden;">${preview}</div>` : ""}
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#14532d,#1d4ed8);padding:32px 40px;">
        <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">SFT Learning</p>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Your learning journey continues</p>
      </td></tr>
      <tr><td style="padding:36px 40px;color:#e5e7eb;">${content}</td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">© ${new Date().getFullYear()} SFT Learning. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

const btn = (url, label, color = "#16a34a") =>
  `<a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:${color};color:#fff;font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;">${label}</a>`;

const divider = () => `<hr style="margin:28px 0;border:none;border-top:1px solid rgba(255,255,255,0.08);">`;

// ── Templates ─────────────────────────────────────────────────────────────────

const templates = {
  auth: ({ subject, actionUrl }) => wrap(`
    <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#fff;">${subject}</h2>
    <p style="margin:0;color:rgba(255,255,255,0.65);line-height:1.6;">Click the button below to proceed. This link expires soon.</p>
    ${btn(actionUrl, subject.includes("Reset") ? "Reset Password" : "Verify Email")}
    ${divider()}
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">If you didn't request this, you can safely ignore this email.</p>
  `, subject),

  enrollment: ({ studentName, courseTitle, instructorName, dashboardUrl }) => wrap(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#fff;">You're enrolled! 🎉</h2>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">Welcome to your new course</p>
    <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Course</p>
      <p style="margin:0;font-size:18px;font-weight:600;color:#fff;">${courseTitle}</p>
      ${instructorName ? `<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Instructor: ${instructorName}</p>` : ""}
    </div>
    <p style="margin:0;color:rgba(255,255,255,0.65);line-height:1.6;">Hi ${studentName}, you've successfully enrolled. Start learning at your own pace — all content is available immediately.</p>
    ${btn(dashboardUrl, "Start Learning")}
  `, `You're enrolled in ${courseTitle}!`),

  completion: ({ studentName, courseTitle, instructorName, dashboardUrl }) => wrap(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#fff;">Congratulations! 🏆</h2>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">You've completed a course</p>
    <div style="background:linear-gradient(135deg,rgba(234,179,8,0.12),rgba(234,179,8,0.05));border:1px solid rgba(234,179,8,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:rgba(234,179,8,0.6);text-transform:uppercase;letter-spacing:1px;">Completed Course</p>
      <p style="margin:0;font-size:18px;font-weight:600;color:#fbbf24;">${courseTitle}</p>
      ${instructorName ? `<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Instructor: ${instructorName}</p>` : ""}
    </div>
    <p style="margin:0;color:rgba(255,255,255,0.65);line-height:1.6;">Amazing work, ${studentName}! You've completed every lesson. Your certificate of completion has been issued and is ready to download from your dashboard.</p>
    ${btn(dashboardUrl, "View Certificate", "#d97706")}
  `, `You completed ${courseTitle}!`),

  liveClass: ({ studentName, classTitle, courseTitle, meetingLink, dashboardUrl }) => wrap(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#fff;">Your Class is Live Now! 🔴</h2>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">A live session just started</p>
    <div style="background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.05));border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:rgba(239,68,68,0.7);text-transform:uppercase;letter-spacing:1px;">Live Session</p>
      <p style="margin:0;font-size:18px;font-weight:600;color:#fff;">${classTitle}</p>
      ${courseTitle ? `<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Course: ${courseTitle}</p>` : ""}
    </div>
    <p style="margin:0;color:rgba(255,255,255,0.65);line-height:1.6;">Hi ${studentName}, your instructor just started a live class. Join now to participate in real time.</p>
    ${meetingLink ? btn(meetingLink, "Join Live Class", "#dc2626") : btn(dashboardUrl, "Go to Dashboard", "#dc2626")}
  `, `Live class started: ${classTitle}`),

  certificate: ({ studentName, courseTitle, certificateId, downloadUrl, verifyUrl }) => wrap(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#fff;">Your Certificate is Ready 📜</h2>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">Certificate of Completion</p>
    <div style="background:linear-gradient(135deg,rgba(234,179,8,0.15),rgba(251,191,36,0.05));border:1px solid rgba(234,179,8,0.25);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#fbbf24;">${studentName}</p>
      <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.5);">has successfully completed</p>
      <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#fff;">${courseTitle}</p>
      <p style="margin:0;font-size:11px;font-family:monospace;color:rgba(255,255,255,0.35);">${certificateId}</p>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      ${btn(downloadUrl, "Download PDF", "#d97706")}
      <a href="${verifyUrl}" style="display:inline-block;margin-top:24px;margin-left:12px;padding:14px 24px;background:rgba(255,255,255,0.08);color:#e5e7eb;font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;border:1px solid rgba(255,255,255,0.12);">Verify</a>
    </div>
  `, `Your certificate for ${courseTitle} is ready`),
};

// ── Public API ────────────────────────────────────────────────────────────────

export const sendAuthEmail = async ({ to, subject, actionUrl }) => {
  const html = templates.auth({ subject, actionUrl });
  return sendEmail({ to, subject, html, template: "auth", meta: { actionUrl } });
};

export const sendEnrollmentEmail = async ({ to, studentName, courseTitle, instructorName, dashboardUrl }) => {
  const html = templates.enrollment({ studentName, courseTitle, instructorName, dashboardUrl });
  return sendEmail({ to, subject: `You're enrolled in ${courseTitle}`, html, template: "enrollment", meta: { courseTitle } });
};

export const sendCompletionEmail = async ({ to, studentName, courseTitle, instructorName, dashboardUrl }) => {
  const html = templates.completion({ studentName, courseTitle, instructorName, dashboardUrl });
  return sendEmail({ to, subject: `You completed ${courseTitle}!`, html, template: "completion", meta: { courseTitle } });
};

export const sendCertificateEmail = async ({ to, studentName, courseTitle, certificateId, downloadUrl, verifyUrl }) => {
  const html = templates.certificate({ studentName, courseTitle, certificateId, downloadUrl, verifyUrl });
  return sendEmail({ to, subject: `Your certificate for ${courseTitle} is ready`, html, template: "certificate", meta: { courseTitle, certificateId } });
};

export const sendLiveClassEmail = async ({ to, studentName, classTitle, courseTitle, meetingLink, dashboardUrl }) => {
  const html = templates.liveClass({ studentName, classTitle, courseTitle, meetingLink, dashboardUrl });
  return sendEmail({ to, subject: `Live class started: ${classTitle}`, html, template: "liveClass", meta: { classTitle, courseTitle } });
};
