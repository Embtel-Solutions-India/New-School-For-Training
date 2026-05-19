import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Divider, Skeleton, TextField,
} from "@mui/material";
import { AtSign, Briefcase, CheckCircle2, GitBranch, Globe, Lock, User } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

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

const ProfileSettings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [form, setForm] = useState({ name: "", bio: "", avatar: "", website: "", twitter: "", linkedin: "", github: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    studentApi.getProfile()
      .then(({ data }) => {
        setProfile(data.user);
        const u = data.user;
        setForm({
          name: u.name || "",
          bio: u.bio || "",
          avatar: u.avatar || "",
          website: u.socialLinks?.website || "",
          twitter: u.socialLinks?.twitter || "",
          linkedin: u.socialLinks?.linkedin || "",
          github: u.socialLinks?.github || "",
        });
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
        socialLinks: { website: form.website, twitter: form.twitter, linkedin: form.linkedin, github: form.github },
      });
      setProfile(data.user);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
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
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-4xl ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="h-20 w-20 shrink-0 rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 overflow-hidden">
            {form.avatar
              ? <img src={form.avatar} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {profile?.name?.[0]?.toUpperCase()}
                </div>}
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

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={saving} variant="contained"
            sx={{ borderRadius: 3, px: 4, background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : <><CheckCircle2 size={16} className="mr-1.5" />Save Changes</>}
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
