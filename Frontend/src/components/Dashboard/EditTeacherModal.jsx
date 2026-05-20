import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, Tabs, Tab, Box } from "@mui/material";
import adminApi from "../../services/adminApi";

const EditTeacherModal = ({ open, onClose, teacher, onSuccess }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
    expertise: "",
    bio: "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (teacher && open) {
      setFormData({
        name: teacher.name || "",
        avatar: teacher.avatar || "",
        expertise: teacher.expertise?.join(", ") || "",
        bio: teacher.bio || "",
      });
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setErrors({});
      setApiError("");
      setActiveTab(0);
    }
  }, [teacher, open]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.newPassword) newErrors.newPassword = "Password is required";
    if (passwordData.newPassword.length < 8) newErrors.newPassword = "Password must be at least 8 characters";
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateTeacher = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError("");

    try {
      const expertiseArray = formData.expertise
        ? formData.expertise.split(",").map((e) => e.trim()).filter((e) => e)
        : [];

      await adminApi.updateTeacher(teacher._id, {
        name: formData.name,
        avatar: formData.avatar || undefined,
        expertise: expertiseArray,
        bio: formData.bio || undefined,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      setApiError(error.response?.data?.message || "Failed to update teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    setApiError("");

    try {
      await adminApi.resetTeacherPassword(teacher._id, passwordData.newPassword);
      onSuccess?.();
      handleClose();
    } catch (error) {
      setApiError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", avatar: "", expertise: "", bio: "" });
    setPasswordData({ newPassword: "", confirmPassword: "" });
    setErrors({});
    setApiError("");
    onClose();
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{ paper: { className: "!bg-[#0b1220] !text-white !rounded-3xl" } }}>
      <DialogTitle className="!text-white !font-bold">Edit Teacher</DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "rgba(255,255,255,0.1)" }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} textColor="inherit" indicatorColor="primary">
          <Tab label="Details" />
          <Tab label="Password" />
        </Tabs>
      </Box>

      <DialogContent className="!space-y-4 !pt-4">
        {apiError && <Alert severity="error" className="!bg-red-500/20 !border-red-500/50">{apiError}</Alert>}

        {activeTab === 0 && (
          <>
            <TextField
              fullWidth
              label="Teacher Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              variant="outlined"
              size="small"
              InputProps={{ className: "!text-white" }}
              InputLabelProps={{ className: "!text-white/70" }}
            />

            <TextField
              fullWidth
              label="Avatar URL"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              variant="outlined"
              size="small"
              InputProps={{ className: "!text-white" }}
              InputLabelProps={{ className: "!text-white/70" }}
            />

            <TextField
              fullWidth
              label="Expertise (Comma-separated)"
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              InputProps={{ className: "!text-white" }}
              InputLabelProps={{ className: "!text-white/70" }}
            />

            <TextField
              fullWidth
              label="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              InputProps={{ className: "!text-white" }}
              InputLabelProps={{ className: "!text-white/70" }}
            />
          </>
        )}

        {activeTab === 1 && (
          <>
            <Alert severity="info" className="!bg-blue-500/20 !border-blue-500/50">
              Leave empty to keep current password
            </Alert>

            <TextField
              fullWidth
              label="New Password"
              type="password"
              placeholder="Min 8 characters"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              variant="outlined"
              size="small"
              InputProps={{ className: "!text-white" }}
              InputLabelProps={{ className: "!text-white/70" }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              variant="outlined"
              size="small"
              InputProps={{ className: "!text-white" }}
              InputLabelProps={{ className: "!text-white/70" }}
            />
          </>
        )}
      </DialogContent>

      <DialogActions className="!px-6 !pb-4">
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={activeTab === 0 ? handleUpdateTeacher : handleResetPassword}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Saving..." : activeTab === 0 ? "Update Details" : "Reset Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTeacherModal;
