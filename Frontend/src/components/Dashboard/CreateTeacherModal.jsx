import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from "@mui/material";
import adminApi from "../../services/adminApi";

const CreateTeacherModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "",
    expertise: "",
    status: "active",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError("");

    try {
      const expertiseArray = formData.expertise
        ? formData.expertise.split(",").map((e) => e.trim()).filter((e) => e)
        : [];

      await adminApi.createTeacher({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        avatar: formData.avatar || undefined,
        expertise: expertiseArray,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      setApiError(error.response?.data?.message || "Failed to create teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", password: "", avatar: "", expertise: "", status: "active" });
    setErrors({});
    setApiError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{ paper: { className: "!bg-[#0b1220] !text-white !rounded-3xl" } }}>
      <DialogTitle className="!text-white !font-bold">Create New Teacher</DialogTitle>

      <DialogContent className="!space-y-5 !pt-5">
        {apiError && <Alert severity="error" className="!bg-red-500/20 !border-red-500/50">{apiError}</Alert>}

        <TextField
          fullWidth
          label="Teacher Name"
          placeholder="e.g., Jane Smith"
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
          label="Email Address"
          type="email"
          placeholder="teacher@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email}
          variant="outlined"
          size="small"
          InputProps={{ className: "!text-white" }}
          InputLabelProps={{ className: "!text-white/70" }}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          placeholder="Min 8 characters"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={!!errors.password}
          helperText={errors.password}
          variant="outlined"
          size="small"
          InputProps={{ className: "!text-white" }}
          InputLabelProps={{ className: "!text-white/70" }}
        />

        <TextField
          fullWidth
          label="Avatar URL (Optional)"
          placeholder="https://example.com/avatar.jpg"
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
          placeholder="e.g., Mathematics, Physics, Chemistry"
          value={formData.expertise}
          onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
          variant="outlined"
          size="small"
          multiline
          rows={2}
          InputProps={{ className: "!text-white" }}
          InputLabelProps={{ className: "!text-white/70" }}
        />

        <FormControl fullWidth size="small">
          <InputLabel className="!text-white/70">Initial Status</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            label="Initial Status"
            className="!text-white"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions className="!px-6 !pb-4">
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Creating..." : "Create Teacher"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTeacherModal;
