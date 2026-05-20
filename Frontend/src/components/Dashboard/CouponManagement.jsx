import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Pagination, Skeleton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip,
} from "@mui/material";
import { Edit, Plus, Tag, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const EMPTY_FORM = { code: "", discountPercent: "", usageLimit: "", expiresAt: "", minOrderAmount: "", description: "" };

const statusChip = (coupon) => {
  if (!coupon.active) return { label: "Disabled", bg: "rgba(148,163,184,0.15)", color: "#94a3b8" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { label: "Expired", bg: "rgba(239,68,68,0.15)", color: "#fca5a5" };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return { label: "Exhausted", bg: "rgba(251,191,36,0.15)", color: "#fde68a" };
  return { label: "Active", bg: "rgba(34,197,94,0.15)", color: "#86efac" };
};

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getCoupons({ page, limit: 15, search });
      setCoupons(data.coupons || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialog(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      usageLimit: coupon.usageLimit || "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
      minOrderAmount: coupon.minOrderAmount || "",
      description: coupon.description || "",
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountPercent) {
      toast.error("Code and discount percent are required");
      return;
    }
    const pct = parseFloat(form.discountPercent);
    if (pct < 1 || pct > 100) {
      toast.error("Discount must be between 1 and 100%");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        discountPercent: pct,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : 0,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
        expiresAt: form.expiresAt || null,
      };
      if (editing) {
        await adminApi.updateCoupon(editing._id, payload);
        toast.success("Coupon updated");
      } else {
        await adminApi.createCoupon(payload);
        toast.success("Coupon created");
      }
      setDialog(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await adminApi.deleteCoupon(id);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminApi.toggleCoupon(id);
      fetchCoupons();
    } catch {
      toast.error("Toggle failed");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Coupon Management</h1>
            <p className="mt-2 text-white/60">Create and manage discount coupons</p>
          </div>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={openCreate}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700, whiteSpace: "nowrap" }}>
            Create Coupon
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] ${glass} p-6`}>
        <div className="mb-6">
          <TextField placeholder="Search coupon codes..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} variant="outlined" size="small"
            InputProps={{ startAdornment: <Tag size={16} className="mr-2 text-white/40" />, sx: { color: "white" } }}
            sx={{ minWidth: 280 }} />
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["Code", "Discount", "Used / Limit", "Expires", "Min. Order", "Status", "Actions"].map((h) => (
                  <TableCell key={h} sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton variant="text" sx={{ bgcolor: "rgba(255,255,255,0.07)" }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "rgba(255,255,255,0.4)" }}>
                    No coupons found
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((c) => {
                  const sc = statusChip(c);
                  return (
                    <TableRow key={c._id} hover sx={{ "&:hover td": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                      <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "monospace" }}>{c.code}</TableCell>
                      <TableCell sx={{ color: "#86efac", fontWeight: 700 }}>{c.discountPercent}%</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>
                        {c.usedCount} / {c.usageLimit === 0 ? "∞" : c.usageLimit}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                        {c.minOrderAmount > 0 ? `$${c.minOrderAmount}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: "rgba(255,255,255,0.6)" }}>
                              <Edit size={15} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={c.active ? "Disable" : "Enable"}>
                            <IconButton size="small" onClick={() => handleToggle(c._id)} sx={{ color: c.active ? "#86efac" : "rgba(255,255,255,0.4)" }}>
                              {c.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(c._id, c.code)} sx={{ color: "rgba(239,68,68,0.7)" }}>
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination count={pagination.pages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </div>
        )}
      </motion.div>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 3 }}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField fullWidth label="Coupon Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              size="small" disabled={!!editing} placeholder="e.g. SAVE20"
              InputProps={{ sx: { color: "white", fontFamily: "monospace", fontWeight: 700 } }}
              InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Discount %" type="number" value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} size="small"
              inputProps={{ min: 1, max: 100 }}
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Usage Limit (0 = unlimited)" type="number" value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} size="small"
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Expires At" type="date" value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} size="small"
              InputLabelProps={{ shrink: true, sx: { color: "rgba(255,255,255,0.6)" } }}
              InputProps={{ sx: { color: "white" } }} />
            <TextField fullWidth label="Min. Order Amount ($)" type="number" value={form.minOrderAmount}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} size="small"
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} size="small"
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CouponManagement;
