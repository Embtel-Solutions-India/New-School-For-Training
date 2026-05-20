import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { Edit, KeyRound, Lock, Plus, Search, Trash2, Unlock, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const EMPTY_FORM = { name: "", email: "", password: "", expertise: "", avatar: "", status: "active" };

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [resetPwdDialog, setResetPwdDialog] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const limit = 10;

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getTeachers(page, limit, search, statusFilter);
      setTeachers(data.teachers || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const openCreate = () => {
    setEditingTeacher(null);
    setFormData(EMPTY_FORM);
    setOpenDialog(true);
  };

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      password: "",
      expertise: Array.isArray(teacher.expertise) ? teacher.expertise.join(", ") : (teacher.expertise || ""),
      avatar: teacher.avatar || "",
      status: teacher.accountStatus || "active",
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }
    if (!editingTeacher && !formData.password) {
      toast.error("Password is required for new teachers");
      return;
    }
    try {
      setSaving(true);
      const expertiseArray = formData.expertise
        ? formData.expertise.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      if (editingTeacher) {
        await adminApi.updateTeacher(editingTeacher._id, {
          name: formData.name,
          expertise: expertiseArray,
          avatar: formData.avatar,
        });
        toast.success("Teacher updated successfully");
      } else {
        await adminApi.createTeacher({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          expertise: expertiseArray,
          avatar: formData.avatar,
        });
        toast.success("Teacher created successfully");
      }
      setOpenDialog(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teacherId, name) => {
    if (!window.confirm(`Delete teacher "${name}"? This action cannot be undone.`)) return;
    try {
      await adminApi.deleteTeacher(teacherId);
      toast.success("Teacher deleted");
      fetchTeachers();
    } catch {
      toast.error("Failed to delete teacher");
    }
  };

  const handleToggleSuspend = async (teacher) => {
    try {
      if (teacher.accountStatus === "active" || !teacher.isSuspended) {
        await adminApi.suspendTeacher(teacher._id);
        toast.success("Teacher suspended");
      } else {
        await adminApi.activateTeacher(teacher._id);
        toast.success("Teacher activated");
      }
      fetchTeachers();
    } catch {
      toast.error("Failed to update teacher status");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      setSaving(true);
      await adminApi.resetTeacherPassword(resetPwdDialog._id, newPassword);
      toast.success("Password reset successfully");
      setResetPwdDialog(null);
      setNewPassword("");
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setSaving(false);
    }
  };

  const isSuspended = (t) => t.isSuspended || t.accountStatus === "suspended";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Teacher Credentials</h1>
            <p className="mt-2 text-white/60">Create, edit, suspend, and manage platform teachers</p>
          </div>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={openCreate}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg, #22c55e, #16a34a)", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            Create Teacher
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] ${glass} p-6`}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            variant="outlined"
            size="small"
            InputProps={{ startAdornment: <Search size={16} className="mr-2 text-white/40" />, className: "!text-white" }}
          />
          <FormControl size="small">
            <InputLabel className="!text-white/70">Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} label="Status" className="!text-white">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <UserCheck size={16} className="text-emerald-300" />
            {loading ? "Loading..." : `${pagination.total} teacher${pagination.total !== 1 ? "s" : ""} found`}
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="!text-white/60 !font-semibold !text-xs !uppercase !tracking-widest">Teacher</TableCell>
                <TableCell className="!text-white/60 !font-semibold !text-xs !uppercase !tracking-widest">Expertise</TableCell>
                <TableCell className="!text-white/60 !font-semibold !text-xs !uppercase !tracking-widest">Courses</TableCell>
                <TableCell className="!text-white/60 !font-semibold !text-xs !uppercase !tracking-widest">Status</TableCell>
                <TableCell className="!text-white/60 !font-semibold !text-xs !uppercase !tracking-widest">Joined</TableCell>
                <TableCell className="!text-white/60 !font-semibold !text-xs !uppercase !tracking-widest">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton variant="text" sx={{ bgcolor: "rgba(255,255,255,0.07)" }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow key={teacher._id} hover sx={{ "&:hover td": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={teacher.avatar} alt={teacher.name} sx={{ width: 36, height: 36, fontSize: 14 }}>
                          {teacher.name?.[0]}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white">{teacher.name}</p>
                          <p className="text-xs text-white/50">{teacher.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(teacher.expertise || []).slice(0, 2).map((e) => (
                          <span key={e} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">{e}</span>
                        ))}
                        {(teacher.expertise || []).length > 2 && (
                          <span className="text-xs text-white/40">+{teacher.expertise.length - 2}</span>
                        )}
                        {!(teacher.expertise?.length) && <span className="text-xs text-white/30">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="!text-white/60">{teacher.assignedCourses?.length || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={isSuspended(teacher) ? "Suspended" : "Active"}
                        size="small"
                        sx={{
                          bgcolor: isSuspended(teacher) ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                          color: isSuspended(teacher) ? "#fca5a5" : "#86efac",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                    </TableCell>
                    <TableCell className="!text-white/50 !text-sm">
                      {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Tooltip title="Edit teacher">
                          <IconButton size="small" onClick={() => openEdit(teacher)} sx={{ color: "rgba(255,255,255,0.6)" }}>
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={isSuspended(teacher) ? "Activate" : "Suspend"}>
                          <IconButton size="small" onClick={() => handleToggleSuspend(teacher)} sx={{ color: isSuspended(teacher) ? "#86efac" : "rgba(255,255,255,0.6)" }}>
                            {isSuspended(teacher) ? <Unlock size={16} /> : <Lock size={16} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset password">
                          <IconButton size="small" onClick={() => { setResetPwdDialog(teacher); setNewPassword(""); }} sx={{ color: "rgba(255,255,255,0.6)" }}>
                            <KeyRound size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete teacher">
                          <IconButton size="small" onClick={() => handleDelete(teacher._id, teacher.name)} sx={{ color: "rgba(239,68,68,0.7)" }}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "rgba(255,255,255,0.4)" }}>
                    No teachers found. Create one to get started.
                  </TableCell>
                </TableRow>
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

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 20 }}>
          {editingTeacher ? "Edit Teacher" : "Create New Teacher"}
        </DialogTitle>
        <DialogContent>
          <div className="mt-3 space-y-4">
            <TextField fullWidth label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} size="small" disabled={!!editingTeacher} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            {!editingTeacher && (
              <TextField fullWidth label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} size="small" helperText="Minimum 8 characters" FormHelperTextProps={{ sx: { color: "rgba(255,255,255,0.4)" } }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            )}
            <TextField fullWidth label="Expertise (comma separated)" value={formData.expertise} onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} size="small" placeholder="e.g. React, Node.js, MongoDB" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Avatar URL (optional)" value={formData.avatar} onChange={(e) => setFormData({ ...formData, avatar: e.target.value })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 3, background: "linear-gradient(135deg, #22c55e, #16a34a)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editingTeacher ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={Boolean(resetPwdDialog)} onClose={() => setResetPwdDialog(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent>
          <p className="mb-4 text-sm text-white/60">Set a new password for <span className="font-semibold text-white">{resetPwdDialog?.name}</span></p>
          <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} size="small" helperText="Minimum 8 characters" FormHelperTextProps={{ sx: { color: "rgba(255,255,255,0.4)" } }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setResetPwdDialog(null)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained" disabled={saving} sx={{ borderRadius: 3, background: "linear-gradient(135deg, #f97316, #ea580c)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TeacherManagement;
