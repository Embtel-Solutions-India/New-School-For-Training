import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Divider, LinearProgress, Skeleton, TextField, Tooltip,
} from "@mui/material";
import { AtSign, Briefcase, CheckCircle2, GitBranch, Globe, Languages, Lock, Sparkles, Target, User, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import i18n from "../../services/i18n";
import studentApi from "../../services/studentApi";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी (Hindi)" },
  { value: "es", label: "Español (Spanish)" },
  { value: "fr", label: "Français (French)" },
];

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& input": { padding: "11px 14px" },
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#38bdf8" },
};

// Chip tag editor: comma/Enter to add, X to remove
const TagEditor = ({ label, items, setItems, placeholder, color = "#38bdf8" }) => {
  const [input, setInput] = useState("");
  const addTag = () => {
    const val = input.trim();
    if (val && !items.includes(val) && items.length < 20) {
      setItems([...items, val]);
    }
    setInput("");
  };
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  };
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-white/50">{label}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((tag) => (
          <Chip key={tag} label={tag} size="small" onDelete={() => setItems(items.filter((t) => t !== tag))}
            sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "white", "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.4)" } }} />
        ))}
      </div>
      <TextField size="small" placeholder={placeholder} value={input}
        onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} onBlur={addTag}
        sx={{ ...inputSx, width: "100%" }} />
    </div>
  );
};

const ProfileSettings = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [xpProfile, setXpProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);

  const [form, setForm] = useState({
    name: "", bio: "", avatar: "", website: "", twitter: "", linkedin: "", github: "", portfolio: "",
  });
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [learningGoals, setLearningGoals] = useState([]);
  const [goalInput, setGoalInput] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    Promise.all([
      studentApi.getProfile(),
      studentApi.getXpProfile().catch(() => ({ data: null })),
    ]).then(([profileRes, xpRes]) => {
      const u = profileRes.data.user;
      setProfile(u);
      setForm({
        name: u.name || "",
        bio: u.bio || "",
        avatar: u.avatar || "",
        website: u.socialLinks?.website || "",
        twitter: u.socialLinks?.twitter || "",
        linkedin: u.socialLinks?.linkedin || "",
        github: u.socialLinks?.github || "",
        portfolio: u.portfolio || "",
      });
      setSkills(u.skills || []);
      setInterests(u.interests || []);
      setLearningGoals(u.learningGoals || []);
      setPreferredLanguage(u.preferredLanguage || "en");
      if (xpRes.data?.xpProfile) setXpProfile(xpRes.data.xpProfile);
    })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    try {
      setSaving(true);
      const { data } = await studentApi.updateProfile({
        name: form.name,
        bio: form.bio,
        avatar: form.avatar,
        portfolio: form.portfolio,
        socialLinks: { website: form.website, twitter: form.twitter, linkedin: form.linkedin, github: form.github },
        skills,
        interests,
        learningGoals,
        preferredLanguage,
      });
      setProfile(data.user);
      // Sync i18n language
      i18n.changeLanguage(preferredLanguage);
      localStorage.setItem("preferredLanguage", preferredLanguage);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const handleGenerateAvatar = async () => {
    try {
      setGeneratingAvatar(true);
      const { data } = await studentApi.generateAIAvatar();
      setForm((f) => ({ ...f, avatar: data.avatarUrl }));
      setProfile((p) => p ? { ...p, avatar: data.avatarUrl } : p);
      toast.success("AI avatar generated!");
    } catch {
      toast.error("Failed to generate avatar");
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Required";
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) errs.newPassword = "At least 6 characters";
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = "Passwords don't match";
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePw()) return;
    try {
      setChangingPw(true);
      await studentApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password changed!");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setPwErrors({});
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally { setChangingPw(false); }
  };

  const tf = (key, label, type = "text", multiline = false, rows = 1) => (
    <TextField fullWidth size="small" label={label} type={type}
      value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      multiline={multiline} rows={rows} sx={inputSx} />
  );

  const pwField = (key, label) => (
    <TextField fullWidth size="small" label={label} type="password"
      value={pwForm[key]} onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
      error={!!pwErrors[key]} helperText={pwErrors[key]}
      sx={inputSx}
      FormHelperTextProps={{ sx: { color: "#f87171" } }} />
  );

  const addGoal = () => {
    const val = goalInput.trim();
    if (val && !learningGoals.includes(val) && learningGoals.length < 10) {
      setLearningGoals([...learningGoals, val]);
    }
    setGoalInput("");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rounded" height={160} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 4 }} />
        <Skeleton variant="rounded" height={300} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative h-20 w-20 shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 overflow-hidden">
              {form.avatar
                ? <img src={form.avatar} alt="" className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>}
            </div>
            <Tooltip title="Generate AI Avatar" arrow>
              <button onClick={handleGenerateAvatar} disabled={generatingAvatar}
                className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-300 transition hover:bg-purple-500/40 disabled:opacity-50">
                {generatingAvatar ? <CircularProgress size={12} color="inherit" /> : <Sparkles size={13} />}
              </button>
            </Tooltip>
          </div>
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">{profile?.name}</h1>
            <p className="mt-1 text-white/50">{profile?.email}</p>
            <p className="mt-1 text-xs text-white/30 capitalize">{profile?.role}</p>
          </div>
          {profile && (
            <div className="sm:ml-auto flex gap-3">
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-center">
                <p className="text-lg font-bold text-sky-300">{profile.enrollmentCount ?? 0}</p>
                <p className="text-xs text-white/50">Enrolled</p>
              </div>
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-center">
                <p className="text-lg font-bold text-yellow-300">{profile.certCount ?? 0}</p>
                <p className="text-xs text-white/50">Certs</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* XP / Level / Badges card */}
      {xpProfile && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className={`rounded-3xl ${glass} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            <p className="font-semibold">XP & Level</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-600/20 border border-yellow-400/20">
              <p className="text-xs text-yellow-400/70 font-semibold">LVL</p>
              <p className="text-2xl font-bold text-yellow-300">{xpProfile.level}</p>
            </div>

            <div className="flex-1 min-w-[180px]">
              <div className="flex justify-between text-xs text-white/50 mb-1.5">
                <span>{xpProfile.totalXP} XP total</span>
                <span>Next level: {xpProfile.nextLevelXP} XP</span>
              </div>
              <LinearProgress
                variant="determinate"
                value={xpProfile.levelProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.08)",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #fbbf24, #d97706)",
                    borderRadius: 4,
                  },
                }}
              />
              <p className="mt-1 text-xs text-white/35">{xpProfile.levelProgress}% to Level {xpProfile.level + 1}</p>
            </div>

            {xpProfile.streak > 0 && (
              <div className="flex flex-col items-center rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-2">
                <p className="text-xl font-bold text-orange-300">🔥 {xpProfile.streak}</p>
                <p className="text-xs text-white/40">day streak</p>
              </div>
            )}
          </div>

          {xpProfile.badges?.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-white/60">Badges Earned ({xpProfile.badges.length})</p>
              <div className="flex flex-wrap gap-2">
                {xpProfile.badges.map((b) => (
                  <Tooltip key={b.key} title={b.desc} arrow>
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      <span className="text-base">{b.icon}</span>
                      <p className="text-xs font-semibold">{b.label}</p>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Profile form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={`rounded-3xl ${glass} p-6`}>
        <div className="mb-5 flex items-center gap-2">
          <User size={18} className="text-sky-400" />
          <p className="font-semibold">Personal Information</p>
        </div>
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {tf("name", "Full Name")}
            {tf("avatar", "Avatar URL")}
          </div>
          {tf("bio", "Bio / About", "text", true, 3)}
          {tf("portfolio", "Portfolio / Website URL")}
        </div>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Skills & Interests */}
        <div className="mb-4 flex items-center gap-2">
          <Target size={16} className="text-white/40" />
          <p className="text-sm font-semibold text-white/70">Skills & Interests</p>
        </div>
        <div className="space-y-5">
          <TagEditor label="Skills (press Enter or comma to add)" items={skills} setItems={setSkills} placeholder="e.g. JavaScript, React, Python" />
          <TagEditor label="Interests" items={interests} setItems={setInterests} placeholder="e.g. Web Dev, AI, Data Science" />
        </div>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Learning Goals */}
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400/70" />
          <p className="text-sm font-semibold text-white/70">Learning Goals</p>
        </div>
        <div className="space-y-3">
          {learningGoals.map((g, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <span className="flex-1 text-sm">{g}</span>
              <button onClick={() => setLearningGoals(learningGoals.filter((_, j) => j !== i))}
                className="text-white/30 hover:text-white/60 text-lg leading-none">&times;</button>
            </div>
          ))}
          <div className="flex gap-2">
            <TextField size="small" placeholder="Add a learning goal..." value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
              sx={{ ...inputSx, flex: 1 }} />
            <Button onClick={addGoal} variant="outlined" size="small"
              sx={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", borderRadius: 2, whiteSpace: "nowrap" }}>
              Add
            </Button>
          </div>
        </div>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

        <div className="mb-4 flex items-center gap-2">
          <Globe size={16} className="text-white/40" />
          <p className="text-sm font-semibold text-white/70">Social Links</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField fullWidth size="small" label="Website" value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            slotProps={{ input: { startAdornment: <Globe size={14} className="mr-2 text-white/30 shrink-0" /> } }}
            sx={inputSx} />
          <TextField fullWidth size="small" label="Twitter" value={form.twitter}
            onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))}
            slotProps={{ input: { startAdornment: <AtSign size={14} className="mr-2 text-white/30 shrink-0" /> } }}
            sx={inputSx} />
          <TextField fullWidth size="small" label="LinkedIn" value={form.linkedin}
            onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
            slotProps={{ input: { startAdornment: <Briefcase size={14} className="mr-2 text-white/30 shrink-0" /> } }}
            sx={inputSx} />
          <TextField fullWidth size="small" label="GitHub" value={form.github}
            onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))}
            slotProps={{ input: { startAdornment: <GitBranch size={14} className="mr-2 text-white/30 shrink-0" /> } }}
            sx={inputSx} />
        </div>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Language Preferences */}
        <div className="mb-4 flex items-center gap-2">
          <Languages size={16} className="text-emerald-400/70" />
          <p className="text-sm font-semibold text-white/70">{t("preferred_language")}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-white/50">{t("preferred_language")}</p>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white/80 outline-none focus:border-emerald-400/40 transition"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0f1629] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-white/35">AI responses will be in this language</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/50">{t("voice_language")}</p>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white/80 outline-none focus:border-emerald-400/40 transition"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0f1629] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-white/35">Used for voice-to-text recognition</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={handleGenerateAvatar} disabled={generatingAvatar} variant="outlined"
            startIcon={generatingAvatar ? <CircularProgress size={14} color="inherit" /> : <Sparkles size={14} />}
            sx={{ borderRadius: 3, px: 3, borderColor: "rgba(168,85,247,0.4)", color: "#d8b4fe", fontWeight: 600 }}>
            {generatingAvatar ? "Generating..." : "Generate AI Avatar"}
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="contained"
            sx={{ borderRadius: 3, px: 4, background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : <><CheckCircle2 size={16} className="mr-1.5" />{t("save_changes")}</>}
          </Button>
        </div>
      </motion.div>

      {/* Password change */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-3xl ${glass} p-6`}>
        <div className="mb-5 flex items-center gap-2">
          <Lock size={18} className="text-orange-400" />
          <p className="font-semibold">Change Password</p>
        </div>
        <div className="space-y-5">
          {pwField("currentPassword", "Current Password")}
          <div className="grid gap-5 sm:grid-cols-2">
            {pwField("newPassword", "New Password")}
            {pwField("confirm", "Confirm New Password")}
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={handlePasswordChange} disabled={changingPw} variant="outlined"
            sx={{ borderRadius: 3, px: 4, borderColor: "rgba(251,191,36,0.4)", color: "#fde68a", fontWeight: 700 }}>
            {changingPw ? <CircularProgress size={18} color="inherit" /> : "Update Password"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSettings;
