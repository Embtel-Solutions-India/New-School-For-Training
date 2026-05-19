import { useState } from "react";
import { Alert, Button, Snackbar, TextField } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import PasswordStrength from "../components/Auth/PasswordStrength";
import { resetPassword } from "../services/authApi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await resetPassword({ token: params.get("token"), password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password");
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 overflow-hidden">
      <div className="absolute top-0 left-[-180px] sm:left-[-120px] w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] bg-green-100 rounded-full blur-3xl opacity-20" />
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-lg rounded-[28px] sm:rounded-[36px] bg-white p-5 sm:p-8 md:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Reset Password</p>
          <img src="/images/sft_logo.png" alt="Logo" className="mx-auto mt-4 w-40 sm:w-50 h-auto max-h-16 object-contain" />
        </div>
        <form onSubmit={handleSubmit} className="mt-8 sm:mt-10 flex flex-col gap-5">
          <TextField label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth sx={inputStyles} />
          <PasswordStrength password={password} />
          {error && <Alert severity="error">{error}</Alert>}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button type="submit" fullWidth className="!bg-green-700 hover:!bg-orange-500 hover:!text-black !text-white !py-4 !rounded-2xl !font-semibold !text-[15px] transition-all duration-300">Update Password</Button>
          </motion.div>
        </form>
      </motion.div>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success" variant="filled">Password updated successfully</Alert>
      </Snackbar>
    </div>
  );
};

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#f9fafb",
    borderRadius: "18px",
    "& input": { color: "#111827", padding: "15px 18px", fontSize: "0.9375rem" },
    "& fieldset": { borderColor: "#f3f4f6" },
    "&:hover fieldset": { borderColor: "#16a34a" },
    "&.Mui-focused fieldset": { borderColor: "#16a34a", boxShadow: "0 0 0 4px rgba(22,163,74,0.10)" },
  },
  "& .MuiInputLabel-root": { color: "#6b7280", fontSize: "0.9375rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#16a34a" },
};

export default ResetPassword;
