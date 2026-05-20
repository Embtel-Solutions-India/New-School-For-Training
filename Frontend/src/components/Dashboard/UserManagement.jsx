import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputLabel, MenuItem,
  Pagination, Select, Skeleton, TextField, Tooltip, Button,
} from "@mui/material";
import { Edit, Key, Lock, MoreVertical, Trash2, Unlock, UserCog, X } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#22c55e" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#22c55e" },
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.5)" },
};

const ROLE_COLORS = {
  admin:   "rgba(34,211,238,0.15)",
  teacher: "rgba(251,146,60,0.15)",
  student: "rgba(52,211,153,0.15)",
};
const ROLE_TEXT = { admin: "#67e8f9", teacher: "#fdba74", student: "#6ee7b7" };

const STATUS_COLORS = {
  active:    "rgba(52,211,153,0.15)",
  suspended: "rgba(248,113,113,0.15)",
  disabled:  "rgba(148,163,184,0.15)",
};
const STATUS_TEXT = { active: "#6ee7b7", suspended: "#f87171", disabled: "#94a3b8" };

const MODAL_SX = {
  paper: {
    sx: {
      background: "rgba(7,11,20,0.97)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "20px",
      color: "white",
    },
  },
};

const UserManagement = () => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [acting, setActing]         = useState(null);

  // dialogs
  const [editTarget,   setEditTarget]   = useState(null); // { user }
  const [editForm,     setEditForm]     = useState({ name: "", email: "" });
  const [roleTarget,   setRoleTarget]   = useState(null); // { user, role }
  const [pwTarget,     setPwTarget]     = useState(null); // { user }
  const [pwValue,      setPwValue]      = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // user

  const limit = 10;

  useEffect(() => { fetchUsers(); }, [search, roleFilter, statusFilter, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getUsers(page, limit, search, roleFilter, statusFilter);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const withAct = async (userId, fn, successMsg) => {
    setActing(userId);
    try {
      await fn();
      toast.success(successMsg);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setActing(null);
    }
  };

  const handleSuspend   = (id) => withAct(id, () => adminApi.suspendUser(id),   "User suspended");
  const handleActivate  = (id) => withAct(id, () => adminApi.activateUser(id),  "User activated");

  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({ name: user.name || "", email: user.email || "" });
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setActing(editTarget._id);
    try {
      await adminApi.updateUser(editTarget._id, editForm);
      toast.success("User updated");
      setEditTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update user");
    } finally {
      setActing(null);
    }
  };

  const handleRoleChange = async () => {
    if (!roleTarget) return;
    setActing(roleTarget.user._id);
    try {
      await adminApi.changeUserRole(roleTarget.user._id, roleTarget.role);
      toast.success(`Role changed to ${roleTarget.role}`);
      setRoleTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change role");
    } finally {
      setActing(null);
    }
  };

  const handleResetPassword = async () => {
    if (!pwTarget || !pwValue.trim()) return;
    setActing(pwTarget._id);
    try {
      await adminApi.resetUserPassword(pwTarget._id, pwValue.trim());
      toast.success("Password reset successfully");
      setPwTarget(null);
      setPwValue("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActing(deleteTarget._id);
    try {
      await adminApi.deleteUser(deleteTarget._id);
      toast.success("User deleted");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-4xl ${glass} p-8`}>
        <h1 className="text-4xl font-bold">User Management</h1>
        <p className="mt-2 text-white/60">Search, filter, edit and manage platform users</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-[28px] ${glass} p-6`}>

        {/* FILTERS */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            sx={inputSx}
          />
          <FormControl size="small" sx={inputSx}>
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} label="Role">
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={inputSx}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} label="Status">
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="disabled">Disabled</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* TABLE HEADER */}
        <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-4 pb-2 text-xs text-white/40 uppercase tracking-wider">
          <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Joined</span><span>Actions</span>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <Skeleton key={i} variant="rounded" height={56}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
            ))}
          </div>
        )}

        {/* ROWS */}
        {!loading && users.length === 0 && (
          <p className="py-12 text-center text-white/40 text-sm">No users found</p>
        )}

        {!loading && users.map((user, i) => {
          const busy = acting === user._id;
          return (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-3 sm:gap-4 items-center px-4 py-3.5 rounded-2xl border border-white/5 bg-white/3 mb-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {(user.name || "?")?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white truncate">{user.name}</span>
              </div>

              <span className="text-xs text-white/60 truncate">{user.email}</span>

              <span className="inline-flex">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: ROLE_COLORS[user.role] || ROLE_COLORS.student, color: ROLE_TEXT[user.role] || ROLE_TEXT.student }}>
                  {user.role}
                </span>
              </span>

              <span className="inline-flex">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: STATUS_COLORS[user.accountStatus] || STATUS_COLORS.active, color: STATUS_TEXT[user.accountStatus] || STATUS_TEXT.active }}>
                  {user.accountStatus || "active"}
                </span>
              </span>

              <span className="text-xs text-white/40">
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
              </span>

              <div className="flex items-center gap-0.5">
                {busy ? (
                  <CircularProgress size={16} sx={{ color: "#22c55e", mx: 1 }} />
                ) : (
                  <>
                    <Tooltip title="Edit user">
                      <IconButton size="small" onClick={() => openEdit(user)}
                        sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#22c55e" } }}>
                        <Edit size={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Change role">
                      <IconButton size="small" onClick={() => setRoleTarget({ user, role: user.role })}
                        sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#f97316" } }}>
                        <UserCog size={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset password">
                      <IconButton size="small" onClick={() => { setPwTarget(user); setPwValue(""); }}
                        sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#38bdf8" } }}>
                        <Key size={14} />
                      </IconButton>
                    </Tooltip>
                    {user.accountStatus === "active" ? (
                      <Tooltip title="Suspend user">
                        <IconButton size="small" onClick={() => handleSuspend(user._id)}
                          sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#fbbf24" } }}>
                          <Lock size={14} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Activate user">
                        <IconButton size="small" onClick={() => handleActivate(user._id)}
                          sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#6ee7b7" } }}>
                          <Unlock size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete user">
                      <IconButton size="small" onClick={() => setDeleteTarget(user)}
                        sx={{ color: "rgba(239,68,68,0.5)", "&:hover": { color: "#ef4444" } }}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}

        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              count={pagination.pages}
              page={page}
              onChange={(_, v) => setPage(v)}
              sx={{
                "& .MuiPaginationItem-root": { color: "rgba(255,255,255,0.6)", fontWeight: 600 },
                "& .Mui-selected": { bgcolor: "#166534 !important", color: "white" },
              }}
            />
          </div>
        )}

        <p className="mt-3 text-center text-xs text-white/30">
          {pagination.total} total users
        </p>
      </motion.div>

      {/* ── EDIT USER DIALOG ─────────────────────────── */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth slotProps={MODAL_SX}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}>
          <span className="font-bold text-white">Edit User</span>
          <IconButton onClick={() => setEditTarget(null)} sx={{ color: "rgba(255,255,255,0.5)" }}><X size={16} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField label="Name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} fullWidth sx={inputSx} />
          <TextField label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} fullWidth sx={inputSx} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditTarget(null)} sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleEdit} disabled={!!acting}
            sx={{ bgcolor: "rgba(34,197,94,0.15)", color: "#86efac", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "rgba(34,197,94,0.25)" } }}>
            {acting ? <CircularProgress size={16} sx={{ color: "#86efac" }} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── CHANGE ROLE DIALOG ───────────────────────── */}
      <Dialog open={!!roleTarget} onClose={() => setRoleTarget(null)} maxWidth="xs" fullWidth slotProps={MODAL_SX}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}>
          <span className="font-bold text-white">Change Role</span>
          <IconButton onClick={() => setRoleTarget(null)} sx={{ color: "rgba(255,255,255,0.5)" }}><X size={16} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <p className="text-white/50 text-sm mb-4">
            Changing role for <strong className="text-white">{roleTarget?.user?.name}</strong>
          </p>
          <FormControl fullWidth sx={inputSx}>
            <InputLabel>New Role</InputLabel>
            <Select value={roleTarget?.role || ""} onChange={(e) => setRoleTarget((r) => ({ ...r, role: e.target.value }))} label="New Role">
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRoleTarget(null)} sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleRoleChange} disabled={!!acting}
            sx={{ bgcolor: "rgba(251,146,60,0.15)", color: "#fdba74", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "rgba(251,146,60,0.25)" } }}>
            {acting ? <CircularProgress size={16} sx={{ color: "#fdba74" }} /> : "Update Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── RESET PASSWORD DIALOG ────────────────────── */}
      <Dialog open={!!pwTarget} onClose={() => setPwTarget(null)} maxWidth="xs" fullWidth slotProps={MODAL_SX}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}>
          <span className="font-bold text-white">Reset Password</span>
          <IconButton onClick={() => setPwTarget(null)} sx={{ color: "rgba(255,255,255,0.5)" }}><X size={16} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <p className="text-white/50 text-sm mb-4">
            Set a new password for <strong className="text-white">{pwTarget?.name}</strong>
          </p>
          <TextField
            label="New Password" type="password" value={pwValue}
            onChange={(e) => setPwValue(e.target.value)} fullWidth sx={inputSx}
            slotProps={{ input: { autoComplete: "new-password" } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setPwTarget(null)} sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleResetPassword} disabled={!!acting || pwValue.length < 6}
            sx={{ bgcolor: "rgba(56,189,248,0.15)", color: "#7dd3fc", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "rgba(56,189,248,0.25)" } }}>
            {acting ? <CircularProgress size={16} sx={{ color: "#7dd3fc" }} /> : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DELETE CONFIRM DIALOG ────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth slotProps={MODAL_SX}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}>
          <span className="font-bold text-white">Delete User</span>
          <IconButton onClick={() => setDeleteTarget(null)} sx={{ color: "rgba(255,255,255,0.5)" }}><X size={16} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <p className="text-white/50 text-sm">
            Permanently delete <strong className="text-white">{deleteTarget?.name}</strong> ({deleteTarget?.email})?
            This action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} disabled={!!acting}
            sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "rgba(239,68,68,0.25)" } }}>
            {acting ? <CircularProgress size={16} sx={{ color: "#f87171" }} /> : "Delete User"}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default UserManagement;
