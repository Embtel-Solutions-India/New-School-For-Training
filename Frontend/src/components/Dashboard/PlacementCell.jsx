import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import {
  Briefcase, Search, Bookmark, BookmarkCheck, CheckCircle2, Clock, MapPin,
  Building2, Sparkles, Download, FileText, Plus, Trash2, X, ChevronDown,
  ChevronUp, Send, RefreshCw, Wand2, TrendingUp, Award,
} from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";
import { getSocket } from "../../services/socketClient";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

// ── Status badge for applications ──────────────────────────────────────────
const STATUS_STYLES = {
  pending:     { label: "Pending",     color: "text-yellow-300 bg-yellow-400/10 border-yellow-400/20" },
  reviewed:    { label: "Reviewed",    color: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
  shortlisted: { label: "Shortlisted", color: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  rejected:    { label: "Rejected",    color: "text-red-300 bg-red-400/10 border-red-400/20" },
  offered:     { label: "Offered 🎉",  color: "text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/20" },
};

const TYPE_COLORS = {
  internship:  "bg-sky-400/10 text-sky-300",
  remote:      "bg-teal-400/10 text-teal-300",
  "full-time": "bg-emerald-400/10 text-emerald-300",
  "part-time": "bg-amber-400/10 text-amber-300",
  contract:    "bg-rose-400/10 text-rose-300",
};

// ── Job Card ───────────────────────────────────────────────────────────────
const JobCard = ({ job, isSaved, hasApplied, onApply, onSave }) => {
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  const handleApply = async () => {
    if (hasApplied) return;
    setApplying(true);
    try {
      await studentApi.applyJob(job._id, { coverLetter });
      toast.success("Application submitted!");
      setShowApplyForm(false);
      setCoverLetter("");
      onApply(job._id);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to apply");
    } finally { setApplying(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await studentApi.toggleSaveJob(job._id);
      onSave(job._id, data.saved);
    } catch { toast.error("Failed to save job"); }
    finally { setSaving(false); }
  };

  const isExpired = job.deadline && new Date(job.deadline) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[20px] ${glass} overflow-hidden flex flex-col`}
    >
      <div className="p-5 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight">{job.title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 size={11} className="text-white/40 shrink-0" />
              <span className="text-xs text-white/50 truncate">{job.company}</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="shrink-0 rounded-xl p-1.5 hover:bg-white/10 transition text-white/40 hover:text-yellow-300">
            {isSaved ? <BookmarkCheck size={15} className="text-yellow-300" /> : <Bookmark size={15} />}
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${TYPE_COLORS[job.type] || "bg-white/5 text-white/40"}`}>
            {job.type}
          </span>
          {job.category && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
              {job.category}
            </span>
          )}
          {job.location && (
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
              <MapPin size={9} />{job.location}
            </span>
          )}
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.skills.slice(0, 4).map(s => (
              <span key={s} className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-300">{s}</span>
            ))}
            {job.skills.length > 4 && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/30">+{job.skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Salary + deadline */}
        <div className="flex items-center justify-between text-xs text-white/40">
          {job.salary?.isPublic && job.salary?.max > 0 ? (
            <span>${job.salary.min?.toLocaleString()} – ${job.salary.max?.toLocaleString()} {job.salary.currency}</span>
          ) : <span />}
          {job.deadline && (
            <span className={`flex items-center gap-1 ${isExpired ? "text-red-400" : "text-white/40"}`}>
              <Clock size={10} />
              {isExpired ? "Expired" : `Due ${new Date(job.deadline).toLocaleDateString()}`}
            </span>
          )}
        </div>
      </div>

      {/* Apply form collapse */}
      <AnimatePresence>
        {showApplyForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-4 space-y-3">
              <TextField
                multiline rows={3}
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Brief cover letter (optional)..."
                size="small" fullWidth
                slotProps={{ input: { sx: { color: "white", fontSize: 12 } } }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer buttons */}
      <div className="border-t border-white/10 flex">
        {hasApplied ? (
          <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={12} /> Applied
          </div>
        ) : isExpired ? (
          <div className="flex flex-1 items-center justify-center py-2.5 text-xs text-white/25">Expired</div>
        ) : (
          <>
            <button
              onClick={() => setShowApplyForm(v => !v)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-sky-300 hover:bg-sky-400/10 transition"
            >
              {showApplyForm ? <ChevronUp size={12} /> : <Send size={12} />}
              {showApplyForm ? "Cancel" : "Apply"}
            </button>
            {showApplyForm && (
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition disabled:opacity-50"
              >
                {applying ? "Sending…" : <><Send size={11} /> Submit</>}
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

// ── Resume Form Helpers ────────────────────────────────────────────────────
const TEMPLATES = [
  { id: "modern",  label: "Modern",  desc: "Dark navy header, gold accents" },
  { id: "classic", label: "Classic", desc: "Traditional blue header" },
  { id: "minimal", label: "Minimal", desc: "Clean, monochrome style" },
];

const emptyEducation = () => ({ institution: "", degree: "", field: "", startYear: "", endYear: "", grade: "" });
const emptyExperience = () => ({ company: "", role: "", startDate: "", endDate: "", description: "" });
const emptyProject = () => ({ title: "", description: "", tech: [], link: "" });
const emptyCert = () => ({ title: "", issuer: "SFT Learning Platform", date: "", certificateId: "" });

// ── Main Component ─────────────────────────────────────────────────────────
const PlacementCell = () => {
  const [activeTab, setActiveTab] = useState("jobs");

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobSearch, setJobSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobPage, setJobPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Resume state
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [savingResume, setSavingResume] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [resumeForm, setResumeForm] = useState({
    template: "modern",
    summary: "",
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [achieveInput, setAchieveInput] = useState("");

  // Fetch on mount
  useEffect(() => {
    Promise.all([
      studentApi.getMyApplications(),
      studentApi.getSavedJobs(),
    ]).then(([appRes, savedRes]) => {
      const apps = appRes.data.applications || [];
      setApplications(apps);
      setAppliedIds(new Set(apps.map(a => a.job?._id)));
      const saved = savedRes.data.jobs || [];
      setSavedJobs(saved);
      setSavedIds(new Set(saved.map(j => j._id)));
    }).catch(() => {});
  }, []);

  const fetchJobs = useCallback(() => {
    setLoadingJobs(true);
    const params = { page: jobPage, limit: 12 };
    if (jobSearch) params.search = jobSearch;
    if (jobType) params.type = jobType;
    if (jobCategory) params.category = jobCategory;

    studentApi.getJobs(params)
      .then(({ data }) => {
        setJobs(data.jobs || []);
        setTotalPages(data.pages || 1);
      })
      .catch(() => toast.error("Failed to load jobs"))
      .finally(() => setLoadingJobs(false));
  }, [jobSearch, jobType, jobCategory, jobPage]);

  useEffect(() => {
    if (activeTab === "jobs") fetchJobs();
  }, [activeTab, fetchJobs]);

  useEffect(() => {
    if (activeTab === "jobs") {
      studentApi.getRecommendedJobs()
        .then(({ data }) => setRecommended(data.jobs || []))
        .catch(() => {});
    }
  }, [activeTab]);

  // Load resume when tab activates
  useEffect(() => {
    if (activeTab !== "resume") return;
    setLoadingResume(true);
    studentApi.getMyResume()
      .then(({ data }) => {
        if (data.resume) {
          setResume(data.resume);
          setResumeForm(r => ({ ...r, ...data.resume }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingResume(false));
  }, [activeTab]);

  // Socket: new job posted
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => {
      toast(`💼 New job: ${data.title} at ${data.company}`, {
        duration: 5000,
        style: { background: "#0f1e35", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" },
      });
      if (activeTab === "jobs") fetchJobs();
    };
    const appHandler = (data) => {
      setApplications(prev => prev.map(a =>
        a._id === data.appId ? { ...a, status: data.status } : a
      ));
      toast(`🎯 Application update: ${data.jobTitle} — ${data.status}`, {
        duration: 5000,
        style: { background: "#0f1e35", color: "white", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "16px" },
      });
    };
    socket.on("job-posted", handler);
    socket.on("application-updated", appHandler);
    return () => { socket.off("job-posted", handler); socket.off("application-updated", appHandler); };
  }, [activeTab, fetchJobs]);

  const handleJobApplied = (jobId) => {
    setAppliedIds(prev => new Set([...prev, jobId]));
    studentApi.getMyApplications()
      .then(({ data }) => setApplications(data.applications || []))
      .catch(() => {});
  };

  const handleJobSaved = (jobId, isSaved) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.add(jobId) : next.delete(jobId);
      return next;
    });
    if (!isSaved) setSavedJobs(prev => prev.filter(j => j._id !== jobId));
    else {
      studentApi.getSavedJobs().then(({ data }) => setSavedJobs(data.jobs || [])).catch(() => {});
    }
  };

  // Resume handlers
  const handleAutofill = async () => {
    setAutofilling(true);
    try {
      const { data } = await studentApi.autofillResume();
      const { prefill } = data;
      setResumeForm(f => ({
        ...f,
        skills: prefill.skills?.length ? prefill.skills : f.skills,
        summary: prefill.summary || f.summary,
        certifications: prefill.certifications?.length ? prefill.certifications : f.certifications,
        achievements: prefill.achievements?.length ? prefill.achievements : f.achievements,
      }));
      toast.success("Resume auto-filled from your profile!");
    } catch { toast.error("Auto-fill failed"); }
    finally { setAutofilling(false); }
  };

  const handleAIEnhance = async () => {
    setEnhancing(true);
    try {
      const { data } = await studentApi.aiEnhanceResume(resumeForm);
      const { enhancements } = data;
      if (enhancements.summary) setResumeForm(f => ({ ...f, summary: enhancements.summary }));
      if (enhancements.suggestedSkills?.length) {
        setResumeForm(f => ({
          ...f,
          skills: [...new Set([...f.skills, ...enhancements.suggestedSkills])],
        }));
      }
      toast.success("AI enhancements applied!");
    } catch { toast.error("AI enhancement failed"); }
    finally { setEnhancing(false); }
  };

  const handleSaveResume = async () => {
    setSavingResume(true);
    try {
      await studentApi.saveResume(resumeForm);
      toast.success("Resume saved!");
    } catch { toast.error("Failed to save resume"); }
    finally { setSavingResume(false); }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      await handleSaveResume(); // save first
      const { data } = await studentApi.downloadResumePDF();
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = "my-resume.pdf"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to download PDF"); }
    finally { setDownloadingPDF(false); }
  };

  const rf = (key, val) => setResumeForm(f => ({ ...f, [key]: val }));

  const rfArr = (key, idx, subKey, val) => setResumeForm(f => {
    const arr = [...f[key]];
    arr[idx] = { ...arr[idx], [subKey]: val };
    return { ...f, [key]: arr };
  });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !resumeForm.skills.includes(s)) {
      rf("skills", [...resumeForm.skills, s]);
    }
    setSkillInput("");
  };

  const addAchievement = () => {
    const a = achieveInput.trim();
    if (a) rf("achievements", [...resumeForm.achievements, a]);
    setAchieveInput("");
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: "jobs",         label: "Browse Jobs",   icon: Briefcase },
    { id: "applications", label: "Applications",  icon: FileText },
    { id: "resume",       label: "Resume",         icon: Award },
    { id: "saved",        label: "Saved",          icon: Bookmark },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Placement Cell</h1>
            <p className="mt-2 text-white/60">Jobs, internships, resume builder &amp; career tracker</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-sky-300">{applications.length}</p>
              <p className="text-xs text-white/50">Applied</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-yellow-300">{savedIds.size}</p>
              <p className="text-xs text-white/50">Saved</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              activeTab === t.id
                ? "border-sky-400/40 bg-sky-400/15 text-sky-300"
                : "border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80"
            }`}>
            <t.icon size={15} />
            {t.label}
            {t.id === "applications" && applications.length > 0 && (
              <span className="rounded-full bg-sky-400/20 px-1.5 text-xs">{applications.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Browse Jobs ── */}
      {activeTab === "jobs" && (
        <div className="space-y-5">
          {/* Search + filters */}
          <div className={`rounded-[24px] ${glass} p-4`}>
            <div className="flex flex-wrap gap-3">
              <TextField value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                placeholder="Search jobs, companies, skills…" size="small"
                sx={{ flex: 1, minWidth: 200 }}
                slotProps={{ input: { startAdornment: <Search size={14} className="mr-2 text-white/40 shrink-0" />, sx: { color: "white" } } }}
                onKeyDown={e => e.key === "Enter" && fetchJobs()}
              />
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Type</InputLabel>
                <Select value={jobType} onChange={e => setJobType(e.target.value)} label="Type"
                  sx={{ color: "white" }}>
                  <MenuItem value="">All types</MenuItem>
                  {["full-time","part-time","internship","remote","contract"].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Category</InputLabel>
                <Select value={jobCategory} onChange={e => setJobCategory(e.target.value)} label="Category"
                  sx={{ color: "white" }}>
                  <MenuItem value="">All categories</MenuItem>
                  {["software","web-development","ai-ml","cloud","data-science","design","marketing","other"].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <button onClick={fetchJobs}
                className="rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 transition">
                Search
              </button>
            </div>
          </div>

          {/* Recommended */}
          {recommended.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-400" />
                <p className="text-sm font-semibold text-white/70">Recommended for you</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recommended.slice(0, 4).map(job => (
                  <JobCard key={job._id} job={job}
                    isSaved={savedIds.has(job._id)} hasApplied={appliedIds.has(job._id)}
                    onApply={handleJobApplied} onSave={handleJobSaved} />
                ))}
              </div>
            </div>
          )}

          {/* All jobs */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white/70">All Openings</p>
              <button onClick={fetchJobs} className="text-xs text-white/30 hover:text-white/60 transition flex items-center gap-1">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
            {loadingJobs ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={220} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className={`rounded-[24px] ${glass} py-16 text-center`}>
                <Briefcase size={40} className="mx-auto mb-3 text-white/20" />
                <p className="text-white/40">No jobs found</p>
                <p className="mt-1 text-xs text-white/25">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {jobs.map(job => (
                    <JobCard key={job._id} job={job}
                      isSaved={savedIds.has(job._id)} hasApplied={appliedIds.has(job._id)}
                      onApply={handleJobApplied} onSave={handleJobSaved} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button onClick={() => setJobPage(p => Math.max(1, p - 1))} disabled={jobPage === 1}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs disabled:opacity-30">
                      Previous
                    </button>
                    <span className="text-xs text-white/40">Page {jobPage} of {totalPages}</span>
                    <button onClick={() => setJobPage(p => Math.min(totalPages, p + 1))} disabled={jobPage === totalPages}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs disabled:opacity-30">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Applications ── */}
      {activeTab === "applications" && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className={`rounded-[24px] ${glass} py-16 text-center`}>
              <FileText size={40} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/40">No applications yet</p>
              <p className="mt-1 text-xs text-white/25">Apply to jobs from the Browse tab</p>
            </div>
          ) : (
            applications.map((app, i) => {
              const st = STATUS_STYLES[app.status] || STATUS_STYLES.pending;
              return (
                <motion.div key={app._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-[20px] ${glass} p-5 flex flex-col sm:flex-row sm:items-center gap-4`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{app.job?.title || "Job"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <Building2 size={10} />{app.job?.company}
                      </span>
                      {app.job?.location && (
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <MapPin size={10} />{app.job.location}
                        </span>
                      )}
                      {app.job?.type && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[app.job.type] || "bg-white/5 text-white/40"}`}>
                          {app.job.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ── Resume Builder ── */}
      {activeTab === "resume" && (
        <div className="space-y-5">
          {loadingResume ? (
            <Skeleton variant="rounded" height={200} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ) : (
            <>
              {/* Action bar */}
              <div className={`rounded-[24px] ${glass} p-4 flex flex-wrap gap-3 items-center justify-between`}>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleAutofill} disabled={autofilling}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition disabled:opacity-50">
                    <RefreshCw size={12} className={autofilling ? "animate-spin" : ""} />
                    {autofilling ? "Auto-filling…" : "Auto-fill from Profile"}
                  </button>
                  <button onClick={handleAIEnhance} disabled={enhancing}
                    className="flex items-center gap-1.5 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold text-fuchsia-300 hover:bg-fuchsia-400/20 transition disabled:opacity-50">
                    <Wand2 size={12} className={enhancing ? "animate-pulse" : ""} />
                    {enhancing ? "Enhancing…" : "AI Enhance"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveResume} disabled={savingResume}
                    className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 px-4 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition disabled:opacity-50">
                    {savingResume ? "Saving…" : "Save"}
                  </button>
                  <button onClick={handleDownloadPDF} disabled={downloadingPDF}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition disabled:opacity-50">
                    <Download size={12} />
                    {downloadingPDF ? "Downloading…" : "Download PDF"}
                  </button>
                </div>
              </div>

              {/* Template selector */}
              <div className={`rounded-[24px] ${glass} p-5`}>
                <p className="mb-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Template</p>
                <div className="flex flex-wrap gap-3">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => rf("template", t.id)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        resumeForm.template === t.id
                          ? "border-sky-400/40 bg-sky-400/10"
                          : "border-white/10 bg-white/[0.04] hover:border-white/20"
                      }`}>
                      <p className="text-sm font-semibold">{t.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className={`rounded-[24px] ${glass} p-5 space-y-3`}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Professional Summary</p>
                <TextField multiline rows={3} fullWidth value={resumeForm.summary}
                  onChange={e => rf("summary", e.target.value)}
                  placeholder="A compelling summary of your professional profile…"
                  slotProps={{ input: { sx: { color: "white", fontSize: 13 } } }} />
              </div>

              {/* Skills */}
              <div className={`rounded-[24px] ${glass} p-5 space-y-3`}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Skills</p>
                <div className="flex gap-2">
                  <TextField value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    placeholder="Add a skill…" size="small" sx={{ flex: 1 }}
                    slotProps={{ input: { sx: { color: "white" } } }}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }}
                  />
                  <button onClick={addSkill}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs hover:bg-white/10 transition">
                    <Plus size={14} />
                  </button>
                </div>
                {resumeForm.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {resumeForm.skills.map((s, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-0.5 text-xs text-sky-300">
                        {s}
                        <button onClick={() => rf("skills", resumeForm.skills.filter((_, j) => j !== i))}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Education */}
              <ResumeSection title="Education" items={resumeForm.education}
                onAdd={() => rf("education", [...resumeForm.education, emptyEducation()])}
                onRemove={i => rf("education", resumeForm.education.filter((_, j) => j !== i))}>
                {resumeForm.education.map((edu, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2">
                    <TextField label="Institution" value={edu.institution} size="small"
                      onChange={e => rfArr("education", i, "institution", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Degree" value={edu.degree} size="small"
                      onChange={e => rfArr("education", i, "degree", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Field of Study" value={edu.field} size="small"
                      onChange={e => rfArr("education", i, "field", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Grade / GPA" value={edu.grade} size="small"
                      onChange={e => rfArr("education", i, "grade", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Start Year" value={edu.startYear} size="small" type="number"
                      onChange={e => rfArr("education", i, "startYear", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="End Year" value={edu.endYear} size="small" type="number"
                      onChange={e => rfArr("education", i, "endYear", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                  </div>
                ))}
              </ResumeSection>

              {/* Experience */}
              <ResumeSection title="Work Experience" items={resumeForm.experience}
                onAdd={() => rf("experience", [...resumeForm.experience, emptyExperience()])}
                onRemove={i => rf("experience", resumeForm.experience.filter((_, j) => j !== i))}>
                {resumeForm.experience.map((exp, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2">
                    <TextField label="Company" value={exp.company} size="small"
                      onChange={e => rfArr("experience", i, "company", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Role / Title" value={exp.role} size="small"
                      onChange={e => rfArr("experience", i, "role", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Start Date" value={exp.startDate} size="small" placeholder="e.g. Jan 2023"
                      onChange={e => rfArr("experience", i, "startDate", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="End Date" value={exp.endDate} size="small" placeholder="Present"
                      onChange={e => rfArr("experience", i, "endDate", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <div className="sm:col-span-2">
                      <TextField label="Description" value={exp.description} size="small" multiline rows={2} fullWidth
                        onChange={e => rfArr("experience", i, "description", e.target.value)}
                        slotProps={{ input: { sx: { color: "white" } } }} />
                    </div>
                  </div>
                ))}
              </ResumeSection>

              {/* Projects */}
              <ResumeSection title="Projects" items={resumeForm.projects}
                onAdd={() => rf("projects", [...resumeForm.projects, emptyProject()])}
                onRemove={i => rf("projects", resumeForm.projects.filter((_, j) => j !== i))}>
                {resumeForm.projects.map((proj, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2">
                    <TextField label="Project Title" value={proj.title} size="small"
                      onChange={e => rfArr("projects", i, "title", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Project Link" value={proj.link} size="small"
                      onChange={e => rfArr("projects", i, "link", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Technologies (comma-separated)" value={proj.tech?.join(", ") || ""} size="small"
                      onChange={e => rfArr("projects", i, "tech", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <div className="sm:col-span-2">
                      <TextField label="Description" value={proj.description} size="small" multiline rows={2} fullWidth
                        onChange={e => rfArr("projects", i, "description", e.target.value)}
                        slotProps={{ input: { sx: { color: "white" } } }} />
                    </div>
                  </div>
                ))}
              </ResumeSection>

              {/* Certifications */}
              <ResumeSection title="Certifications" items={resumeForm.certifications}
                onAdd={() => rf("certifications", [...resumeForm.certifications, emptyCert()])}
                onRemove={i => rf("certifications", resumeForm.certifications.filter((_, j) => j !== i))}>
                {resumeForm.certifications.map((cert, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2">
                    <TextField label="Certificate Title" value={cert.title} size="small"
                      onChange={e => rfArr("certifications", i, "title", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Issuing Organization" value={cert.issuer} size="small"
                      onChange={e => rfArr("certifications", i, "issuer", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Date" value={cert.date} size="small" placeholder="e.g. March 2024"
                      onChange={e => rfArr("certifications", i, "date", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                    <TextField label="Certificate ID" value={cert.certificateId} size="small"
                      onChange={e => rfArr("certifications", i, "certificateId", e.target.value)}
                      slotProps={{ input: { sx: { color: "white" } } }} />
                  </div>
                ))}
              </ResumeSection>

              {/* Achievements */}
              <div className={`rounded-[24px] ${glass} p-5 space-y-3`}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Achievements</p>
                <div className="flex gap-2">
                  <TextField value={achieveInput} onChange={e => setAchieveInput(e.target.value)}
                    placeholder="Add an achievement…" size="small" sx={{ flex: 1 }}
                    slotProps={{ input: { sx: { color: "white" } } }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAchievement(); } }}
                  />
                  <button onClick={addAchievement}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs hover:bg-white/10 transition">
                    <Plus size={14} />
                  </button>
                </div>
                {resumeForm.achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <span className="flex-1 text-sm text-white/80">{a}</span>
                    <button onClick={() => rf("achievements", resumeForm.achievements.filter((_, j) => j !== i))}
                      className="text-white/30 hover:text-red-400 transition">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Saved Jobs ── */}
      {activeTab === "saved" && (
        savedJobs.length === 0 ? (
          <div className={`rounded-[24px] ${glass} py-16 text-center`}>
            <Bookmark size={40} className="mx-auto mb-3 text-white/20" />
            <p className="text-white/40">No saved jobs yet</p>
            <p className="mt-1 text-xs text-white/25">Bookmark jobs from the Browse tab</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map(job => (
              <JobCard key={job._id} job={job}
                isSaved={savedIds.has(job._id)} hasApplied={appliedIds.has(job._id)}
                onApply={handleJobApplied} onSave={handleJobSaved} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

// ── Resume Section Wrapper ─────────────────────────────────────────────────
const ResumeSection = ({ title, items, onAdd, onRemove, children }) => (
  <div className={`rounded-[24px] ${glass} p-5 space-y-4`}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{title}</p>
      <button onClick={onAdd}
        className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs hover:bg-white/10 transition">
        <Plus size={12} /> Add
      </button>
    </div>
    {items.length === 0 && (
      <p className="text-xs text-white/25">No {title.toLowerCase()} added yet.</p>
    )}
    {Array.isArray(children) ? children.map((child, i) => (
      <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
        <div className="flex justify-end">
          <button onClick={() => onRemove(i)} className="text-white/25 hover:text-red-400 transition">
            <Trash2 size={13} />
          </button>
        </div>
        {child}
      </div>
    )) : children}
  </div>
);

export default PlacementCell;
