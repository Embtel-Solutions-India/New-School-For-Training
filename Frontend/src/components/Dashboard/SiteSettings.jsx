import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Divider, FormControlLabel, Skeleton, Switch, TextField, Tooltip,
} from "@mui/material";
import { Globe, Lock, Save, Settings, Wrench, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const Section = ({ title, icon: Icon, color, children }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-xl p-2.5" style={{ background: color }}>
        <Icon size={18} className="text-white" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const SiteSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    adminApi.getSettings()
      .then(({ data }) => setSettings(data.settings))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (path, value) => {
    setSettings((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const save = async (section, apiCall, successMsg) => {
    try {
      setSaving((s) => ({ ...s, [section]: true }));
      await apiCall();
      toast.success(successMsg);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving((s) => ({ ...s, [section]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rounded" height={120} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: 4 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={200} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: 4 }} />
        ))}
      </div>
    );
  }

  if (!settings) return <div className="py-12 text-center text-white/40">Failed to load settings.</div>;

  const { general, payment, security, maintenance } = settings;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-white/60" />
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Site Settings</h1>
            <p className="mt-1 text-white/60">Configure platform-wide settings</p>
          </div>
        </div>
      </motion.div>

      {/* General Settings */}
      <Section title="General Settings" icon={Globe} color="rgba(34,197,94,0.2)">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Site Name" value={general?.siteName || ""} onChange={(e) => set("general.siteName", e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          <TextField label="Tagline" value={general?.tagline || ""} onChange={(e) => set("general.tagline", e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          <TextField label="Contact Email" type="email" value={general?.contactEmail || ""} onChange={(e) => set("general.contactEmail", e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          <TextField label="Support Email" type="email" value={general?.supportEmail || ""} onChange={(e) => set("general.supportEmail", e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          <TextField label="Logo URL" value={general?.logo || ""} onChange={(e) => set("general.logo", e.target.value)}
            size="small" className="sm:col-span-2" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
        </div>
        <Button variant="contained" startIcon={saving.general ? <CircularProgress size={14} color="inherit" /> : <Save size={16} />}
          disabled={saving.general}
          onClick={() => save("general", () => adminApi.updateGeneralSettings(general), "General settings saved")}
          sx={{ mt: 4, borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700 }}>
          Save General Settings
        </Button>
      </Section>

      {/* Payment Settings */}
      <Section title="Payment & Revenue" icon={CreditCard} color="rgba(249,115,22,0.2)">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Currency" value={payment?.currency || "USD"} onChange={(e) => set("payment.currency", e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          <TextField label="Tax Percent (%)" type="number" value={payment?.taxPercent ?? 18} onChange={(e) => set("payment.taxPercent", parseFloat(e.target.value))}
            size="small" inputProps={{ min: 0, max: 100 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
        </div>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 4 }} />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="font-semibold text-orange-200">Razorpay</p>
              <p className="text-xs text-white/50">Indian payment gateway</p>
            </div>
            <FormControlLabel control={<Switch checked={payment?.gateways?.razorpay?.enabled || false} onChange={(e) => set("payment.gateways.razorpay.enabled", e.target.checked)} color="warning" />} label={<span className="text-sm text-white/70">{payment?.gateways?.razorpay?.enabled ? "Enabled" : "Disabled"}</span>} />
          </div>
          {payment?.gateways?.razorpay?.enabled && (
            <TextField fullWidth label="Razorpay Key ID" value={payment?.gateways?.razorpay?.keyId || ""}
              onChange={(e) => set("payment.gateways.razorpay.keyId", e.target.value)} size="small"
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="font-semibold text-violet-200">Stripe</p>
              <p className="text-xs text-white/50">Global payment gateway</p>
            </div>
            <FormControlLabel control={<Switch checked={payment?.gateways?.stripe?.enabled || false} onChange={(e) => set("payment.gateways.stripe.enabled", e.target.checked)} color="secondary" />} label={<span className="text-sm text-white/70">{payment?.gateways?.stripe?.enabled ? "Enabled" : "Disabled"}</span>} />
          </div>
          {payment?.gateways?.stripe?.enabled && (
            <TextField fullWidth label="Stripe Publishable Key" value={payment?.gateways?.stripe?.publishableKey || ""}
              onChange={(e) => set("payment.gateways.stripe.publishableKey", e.target.value)} size="small"
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          )}
        </div>
        <Button variant="contained" startIcon={saving.payment ? <CircularProgress size={14} color="inherit" /> : <Save size={16} />}
          disabled={saving.payment}
          onClick={() => save("payment", () => adminApi.updatePaymentSettings(payment), "Payment settings saved")}
          sx={{ mt: 4, borderRadius: 3, background: "linear-gradient(135deg,#f97316,#ea580c)", fontWeight: 700 }}>
          Save Payment Settings
        </Button>
      </Section>

      {/* Security Settings */}
      <Section title="Security & Access" icon={Lock} color="rgba(56,189,248,0.2)">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Session Timeout (minutes)" type="number" value={security?.sessionTimeout ?? 60} onChange={(e) => set("security.sessionTimeout", parseInt(e.target.value))}
            size="small" inputProps={{ min: 5 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          <TextField label="Max Login Attempts" type="number" value={security?.maxLoginAttempts ?? 5} onChange={(e) => set("security.maxLoginAttempts", parseInt(e.target.value))}
            size="small" inputProps={{ min: 1 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Email Verification</p>
              <p className="text-xs text-white/50">Require verified email to login</p>
            </div>
            <Switch checked={security?.requireEmailVerification !== false} onChange={(e) => set("security.requireEmailVerification", e.target.checked)} color="success" />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Google OAuth</p>
              <p className="text-xs text-white/50">Allow sign in with Google</p>
            </div>
            <Switch checked={security?.allowGoogleAuth !== false} onChange={(e) => set("security.allowGoogleAuth", e.target.checked)} color="info" />
          </div>
        </div>
        <Button variant="contained" startIcon={saving.security ? <CircularProgress size={14} color="inherit" /> : <Save size={16} />}
          disabled={saving.security}
          onClick={() => save("security", () => adminApi.updateSecuritySettings(security), "Security settings saved")}
          sx={{ mt: 4, borderRadius: 3, background: "linear-gradient(135deg,#38bdf8,#0284c7)", fontWeight: 700 }}>
          Save Security Settings
        </Button>
      </Section>

      {/* Maintenance Mode */}
      <Section title="Maintenance Mode" icon={Wrench} color="rgba(239,68,68,0.2)">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Maintenance Mode</p>
            <p className="text-sm text-white/50">When enabled, visitors see the maintenance message instead of the platform.</p>
          </div>
          <Switch checked={maintenance?.enabled || false} onChange={(e) => set("maintenance.enabled", e.target.checked)} color="error" />
        </div>
        {maintenance?.enabled && (
          <TextField fullWidth multiline rows={2} label="Maintenance Message" value={maintenance?.message || ""}
            onChange={(e) => set("maintenance.message", e.target.value)} size="small" className="mt-4"
            InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
        )}
        <Button variant="contained" startIcon={saving.maintenance ? <CircularProgress size={14} color="inherit" /> : <Save size={16} />}
          disabled={saving.maintenance}
          onClick={() => save("maintenance", () => adminApi.updateMaintenanceMode(maintenance), "Maintenance settings saved")}
          sx={{ mt: 4, borderRadius: 3, background: maintenance?.enabled ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700 }}>
          {maintenance?.enabled ? "Disable Maintenance" : "Save Maintenance Settings"}
        </Button>
      </Section>
    </div>
  );
};

export default SiteSettings;
