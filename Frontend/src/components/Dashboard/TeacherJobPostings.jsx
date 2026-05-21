import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import {
  Briefcase, Plus, Trash2, X, Users, Eye, Clock, MapPin,
  Building2, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  ToggleLeft, ToggleRight, Send,
} from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

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

const EMPTY_JOB = {
  title: "", company: "", description: "", requirements: "",
  skills: "", location: "Remote", type: "full-time",
  category: "software", deadline: "",
  salaryMin: "", salaryMax: "", currency: "USD",
};

// ── Applicant list modal ───────────────────────────────────────────────────
const ApplicantModal = ({ job, onClose }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    teacherApi.getJobApplicants(job._id)
      .then(({ data }) => setApps(data.applications || []))
      .catch(() => toast.error("Failed to load applicants"))
      .finally(() => setLoading(false));
  }, [job._id]);

  const handleStatus = async (appId, status) => {
    setUpdating(appId);
    try {
      await teacherApi.updateApplicationStatus(appId, { status });
      setApps(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error("Failed to update status"); }
    finally { setUpdating(null); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-2xl max-h-[80vh] flex flex-col rounded-[28px] ${glass} overflow-hidden`}
        >
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h3 className="font-bold">Applicants — {job.title}</h3>
              <p className="text-xs text-white/40 mt-0.5">{job.company} · {apps.length} applicants</p>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/10 transition">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
              ))
            ) : apps.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={36} className="mx-auto mb-3 text-white/20" />
                <p className="text-white/40 text-sm">No applicants yet</p>
              </div>
            ) : (
              apps.map(app => {
                const st = STATUS_STYLES[app.status] || STATUS_STYLES.pending;
                return (
                  <div key={app._id} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start gap-3">
                      {app.student?.avatar ? (
                        <img src={app.student.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400/15 text-sm font-bold text-sky-300">
                          {app.student?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{app.student?.name}</p>
                        <p className="text-xs text-white/40">{app.student?.email}</p>
                        {app.student?.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {app.student.skills.slice(0, 4).map(s => (
                              <span key={s} className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-300">{s}</span>
                            ))}
                          </div>
                        )}
                        {app.coverLetter && (
                          <p className="mt-2 text-xs text-white/50 line-clamp-2">{app.coverLetter}</p>
                        )}
                        <p className="text-[10px] text-white/30 mt-1">
                          Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <Select
                            value={app.status}
                            onChange={e => handleStatus(app._id, e.target.value)}
                            disabled={updating === app._id}
                            sx={{ color: "white", fontSize: 11 }}
                          >
                            {Object.entries(STATUS_STYLES).map(([v, s]) => (
                              <MenuItem key={v} value={v} sx={{ fontSize: 12 }}>{s.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const TeacherJobPostings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewApplicants, setViewApplicants] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    teacherApi.getMyJobPostings()
      .then(({ data }) => setJobs(data.jobs || []))
      .catch(() => toast.error("Failed to load job postings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      toast.error("Title, company, and description are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        company: form.company.trim(),
        description: form.description,
        requirements: form.requirements,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        location: form.location,
        type: form.type,
        category: form.category,
        deadline: form.deadline || null,
        salary: {
          min: parseInt(form.salaryMin) || 0,
          max: parseInt(form.salaryMax) || 0,
          currency: form.currency,
          isPublic: !!(form.salaryMin || form.salaryMax),
        },
      };

      if (editingId) {
        await teacherApi.updateJob(editingId, payload);
        toast.success("Job updated");
      } else {
        await teacherApi.createJob(payload);
        toast.success("Job posted successfully!");
      }

      setShowForm(false);
      setForm(EMPTY_JOB);
      setEditingId(null);
      fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save job");
    } finally { setSubmitting(false); }
  };

  const handleEdit = (job) => {
    setForm({
      title: job.title, company: job.company,
      description: job.description, requirements: job.requirements || "",
      skills: (job.skills || []).join(", "),
      location: job.location || "Remote",
      type: job.type || "full-time",
      category: job.category || "software",
      deadline: job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
      salaryMin: job.salary?.min || "",
      salaryMax: job.salary?.max || "",
      currency: job.salary?.currency || "USD",
    });
    setEditingId(job._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (job) => {
    setToggling(job._id);
    try {
      await teacherApi.updateJob(job._id, { isActive: !job.isActive });
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, isActive: !j.isActive } : j));
      toast.success(job.isActive ? "Job deactivated" : "Job activated");
    } catch { toast.error("Failed to update job"); }
    finally { setToggling(null); }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Delete this job posting?")) return;
    setDeleting(jobId);
    try {
      await teacherApi.deleteJob(jobId);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      toast.success("Job deleted");
    } catch { toast.error("Failed to delete job"); }
    finally { setDeleting(null); }
  };

  const cancelForm = () => {
    setShowForm(false);
    setForm(EMPTY_JOB);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Job Postings</h1>
            <p className="mt-2 text-white/60">Post and manage job openings for students</p>
          </div>
          <button onClick={() => { setShowForm(v => !v); if (editingId) cancelForm(); }}
            className="flex items-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/15 px-5 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-400/25 transition">
            {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
            {showForm && !editingId ? "Cancel" : "Post a Job"}
          </button>
        </div>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`rounded-[28px] ${glass} p-6 space-y-5`}>
              <h3 className="font-bold text-lg">{editingId ? "Edit Job" : "New Job Posting"}</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Job Title *" value={form.title}
                  onChange={e => set("title", e.target.value)} size="small" fullWidth
                  slotProps={{ input: { sx: { color: "white" } } }} />
                <TextField label="Company *" value={form.company}
                  onChange={e => set("company", e.target.value)} size="small" fullWidth
                  slotProps={{ input: { sx: { color: "white" } } }} />
              </div>

              <TextField label="Job Description *" value={form.description}
                onChange={e => set("description", e.target.value)}
                multiline rows={4} fullWidth
                slotProps={{ input: { sx: { color: "white" } } }} />

              <TextField label="Requirements" value={form.requirements}
                onChange={e => set("requirements", e.target.value)}
                multiline rows={2} fullWidth
                slotProps={{ input: { sx: { color: "white" } } }} />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Required Skills (comma-separated)" value={form.skills}
                  onChange={e => set("skills", e.target.value)} size="small" fullWidth
                  slotProps={{ input: { sx: { color: "white" } } }} />
                <TextField label="Location" value={form.location}
                  onChange={e => set("location", e.target.value)} size="small" fullWidth
                  slotProps={{ input: { sx: { color: "white" } } }} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Job Type</InputLabel>
                  <Select value={form.type} onChange={e => set("type", e.target.value)} label="Job Type"
                    sx={{ color: "white" }}>
                    {["full-time","part-time","internship","remote","contract"].map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Category</InputLabel>
                  <Select value={form.category} onChange={e => set("category", e.target.value)} label="Category"
                    sx={{ color: "white" }}>
                    {["software","web-development","ai-ml","cloud","data-science","design","marketing","other"].map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField label="Application Deadline" value={form.deadline}
                  onChange={e => set("deadline", e.target.value)}
                  type="date" size="small" fullWidth
                  slotProps={{ input: { sx: { color: "white" } }, inputLabel: { shrink: true } }} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="Salary Min" value={form.salaryMin}
                  onChange={e => set("salaryMin", e.target.value)}
                  type="number" size="small" fullWidth
                  slotProps={{ input: { sx: { color: "white" } } }} />
                <TextField label="Salary Max" value={form.salaryMax}
                  onChange={e => set("salaryMax", e.target.value)}
                  type="number" size="small" fullWidth
                  slotProps={{ input: { sx: { color: "white" } } }} />
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Currency</InputLabel>
                  <Select value={form.currency} onChange={e => set("currency", e.target.value)} label="Currency"
                    sx={{ color: "white" }}>
                    {["USD","EUR","GBP","INR"].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={cancelForm}
                  className="rounded-xl border border-white/10 px-5 py-2 text-sm text-white/50 hover:text-white/80 transition">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-sky-500/20 px-5 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 transition disabled:opacity-50">
                  <Send size={14} />
                  {submitting ? "Saving…" : editingId ? "Update Job" : "Post Job"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={120} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <Briefcase size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No job postings yet</p>
          <p className="mt-1 text-xs text-white/25">Click "Post a Job" to create your first posting</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const isExpired = job.deadline && new Date(job.deadline) < new Date();
            return (
              <motion.div key={job._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-[20px] ${glass} p-5`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{job.title}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Building2 size={11} className="text-white/40 shrink-0" />
                          <span className="text-xs text-white/50">{job.company}</span>
                          {job.location && (
                            <>
                              <span className="text-white/20">·</span>
                              <MapPin size={10} className="text-white/40" />
                              <span className="text-xs text-white/40">{job.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          job.isActive && !isExpired
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-red-400/20 bg-red-400/10 text-red-300"
                        }`}>
                          {isExpired ? "Expired" : job.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[job.type] || "bg-white/5 text-white/40"}`}>
                          {job.type}
                        </span>
                      </div>
                    </div>

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.skills.slice(0, 5).map(s => (
                          <span key={s} className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-300">{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Users size={11} />{job.applicationCount || 0} applicants
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} />{job.views || 0} views
                      </span>
                      {job.deadline && (
                        <span className={`flex items-center gap-1 ${isExpired ? "text-red-400" : ""}`}>
                          <Clock size={11} />
                          {isExpired ? "Expired" : `Deadline: ${new Date(job.deadline).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setViewApplicants(job)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs hover:bg-white/10 transition">
                      <Users size={13} />
                      {job.applicationCount || 0}
                    </button>
                    <button onClick={() => handleToggle(job)} disabled={toggling === job._id}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-2 hover:bg-white/10 transition disabled:opacity-50">
                      {job.isActive
                        ? <ToggleRight size={16} className="text-emerald-400" />
                        : <ToggleLeft size={16} className="text-white/40" />}
                    </button>
                    <button onClick={() => handleEdit(job)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs hover:bg-white/10 transition">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(job._id)} disabled={deleting === job._id}
                      className="rounded-xl border border-red-400/20 bg-red-400/10 p-2 text-red-400 hover:bg-red-400/20 transition disabled:opacity-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Applicant Modal */}
      {viewApplicants && (
        <ApplicantModal job={viewApplicants} onClose={() => setViewApplicants(null)} />
      )}
    </div>
  );
};

export default TeacherJobPostings;
