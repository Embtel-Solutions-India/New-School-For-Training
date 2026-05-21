import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import { emitToUsers, getIo } from "../services/socketService.js";

// GET /api/jobs
export const getJobs = asyncHandler(async (req, res) => {
  const { search, category, type, page = 1, limit = 12 } = req.query;
  const filter = {
    isActive: true,
    $or: [{ deadline: null }, { deadline: { $gte: new Date() } }],
  };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (category) filter.category = category;
  if (type) filter.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Job.countDocuments(filter),
  ]);

  res.json({ success: true, jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/jobs/recommended — match student skills
export const getRecommendedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("skills interests").lean();
  const userSkills = [...(user?.skills || []), ...(user?.interests || [])];

  let jobs = [];
  if (userSkills.length) {
    const regexes = userSkills.map(s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    jobs = await Job.find({
      isActive: true,
      $or: [{ deadline: null }, { deadline: { $gte: new Date() } }],
      skills: { $in: regexes },
    })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
  }

  // Fallback: latest jobs if no skill match
  if (!jobs.length) {
    jobs = await Job.find({
      isActive: true,
      $or: [{ deadline: null }, { deadline: { $gte: new Date() } }],
    })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
  }

  res.json({ success: true, jobs });
});

// GET /api/jobs/my-applications
export const getMyApplications = asyncHandler(async (req, res) => {
  const apps = await Application.find({ student: req.user._id })
    .populate({ path: "job", select: "title company type location salary isActive deadline category" })
    .sort({ appliedAt: -1 })
    .lean();

  res.json({ success: true, applications: apps });
});

// GET /api/jobs/saved
export const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("savedJobs")
    .populate({ path: "savedJobs", select: "title company type location salary isActive deadline category applicationCount" })
    .lean();

  res.json({ success: true, jobs: user?.savedJobs || [] });
});

// GET /api/jobs/my-postings — teacher's own postings
export const getMyJobPostings = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, jobs });
});

// PATCH /api/jobs/applications/:appId/status
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ["pending", "reviewed", "shortlisted", "rejected", "offered"];
  if (!validStatuses.includes(status)) throw new ApiError(400, "Invalid status");

  const app = await Application.findById(req.params.appId)
    .populate({ path: "job", select: "title company postedBy" });
  if (!app) throw new ApiError(404, "Application not found");
  if (req.user.role !== "admin" && app.job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  app.status = status;
  if (note !== undefined) app.note = note;
  await app.save();

  const statusMessages = {
    reviewed: "Your application is under review",
    shortlisted: "Congratulations! You have been shortlisted",
    rejected: "Your application was not selected this time",
    offered: "🎉 Congratulations! You have received an offer",
  };

  Notification.create({
    recipient: app.student,
    type: status === "offered" || status === "shortlisted" ? "success" : "info",
    title: "Application Status Update",
    message: `${app.job.title} at ${app.job.company}: ${statusMessages[status] || `Status changed to ${status}`}`,
  }).catch(() => {});

  emitToUsers([app.student.toString()], "application-updated", {
    appId: app._id,
    status,
    jobTitle: app.job.title,
    company: app.job.company,
  });

  res.json({ success: true, application: app });
});

// GET /api/jobs/:id
export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("postedBy", "name").lean();
  if (!job) throw new ApiError(404, "Job not found");

  Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});

  let hasApplied = false;
  let isSaved = false;
  if (req.user) {
    const [app, user] = await Promise.all([
      Application.findOne({ student: req.user._id, job: req.params.id }).lean(),
      User.findById(req.user._id).select("savedJobs").lean(),
    ]);
    hasApplied = !!app;
    isSaved = (user?.savedJobs || []).some(id => id.toString() === req.params.id);
  }

  res.json({ success: true, job, hasApplied, isSaved });
});

// POST /api/jobs
export const createJob = asyncHandler(async (req, res) => {
  const { title, company, companyLogo, description, requirements, skills, location, type, category, salary, deadline } = req.body;
  if (!title?.trim() || !company?.trim() || !description) throw new ApiError(400, "title, company, description required");

  const job = await Job.create({
    title: title.trim(),
    company: company.trim(),
    companyLogo: companyLogo || "",
    description,
    requirements: requirements || "",
    skills: Array.isArray(skills) ? skills : [],
    location: location || "Remote",
    type: type || "full-time",
    category: category || "software",
    salary: salary || {},
    deadline: deadline ? new Date(deadline) : null,
    postedBy: req.user._id,
  });

  try {
    const io = getIo();
    if (io) io.emit("job-posted", { jobId: job._id, title: job.title, company: job.company, type: job.type });
  } catch { /* socket not critical */ }

  res.status(201).json({ success: true, job });
});

// PATCH /api/jobs/:id
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (req.user.role !== "admin" && job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const allowed = ["title", "company", "companyLogo", "description", "requirements", "skills", "location", "type", "category", "salary", "deadline", "isActive"];
  allowed.forEach(k => { if (req.body[k] !== undefined) job[k] = req.body[k]; });
  await job.save();

  res.json({ success: true, job });
});

// DELETE /api/jobs/:id
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (req.user.role !== "admin" && job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }
  await job.deleteOne();
  res.json({ success: true, message: "Job deleted" });
});

// POST /api/jobs/:id/apply
export const applyJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).lean();
  if (!job) throw new ApiError(404, "Job not found");
  if (!job.isActive) throw new ApiError(400, "This job posting is no longer active");
  if (job.deadline && new Date(job.deadline) < new Date()) throw new ApiError(400, "Application deadline has passed");

  const exists = await Application.findOne({ student: req.user._id, job: req.params.id }).lean();
  if (exists) throw new ApiError(409, "You have already applied to this job");

  const user = await User.findById(req.user._id).select("skills").lean();
  const app = await Application.create({
    student: req.user._id,
    job: req.params.id,
    coverLetter: req.body.coverLetter?.trim() || "",
    resumeSnapshot: {
      summary: req.body.summary?.trim() || "",
      skills: user?.skills || [],
    },
  });

  Job.findByIdAndUpdate(req.params.id, { $inc: { applicationCount: 1 } }).catch(() => {});
  ActivityLog.create({
    user: req.user._id,
    type: "job_applied",
    description: `Applied to ${job.title} at ${job.company}`,
    metadata: { jobId: job._id },
  }).catch(() => {});
  Notification.create({
    recipient: job.postedBy,
    type: "info",
    title: "New Application",
    message: `${req.user.name} applied to your posting: ${job.title}`,
  }).catch(() => {});

  res.status(201).json({ success: true, application: app });
});

// POST /api/jobs/:id/save — toggle saved
export const toggleSaveJob = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("savedJobs");
  const jobId = req.params.id;
  const idx = user.savedJobs.findIndex(id => id.toString() === jobId);

  if (idx === -1) user.savedJobs.push(jobId);
  else user.savedJobs.splice(idx, 1);

  await user.save();
  res.json({ success: true, saved: idx === -1 });
});

// GET /api/jobs/:id/applicants — teacher/admin
export const getJobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).lean();
  if (!job) throw new ApiError(404, "Job not found");
  if (req.user.role !== "admin" && job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const apps = await Application.find({ job: req.params.id })
    .populate("student", "name email avatar skills")
    .sort({ appliedAt: -1 })
    .lean();

  res.json({ success: true, applications: apps, jobTitle: job.title, company: job.company });
});
