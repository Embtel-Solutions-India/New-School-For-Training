import { useState } from "react";
import { Alert, Button, Snackbar, TextField } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../services/authApi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 overflow-hidden">
      <div className="absolute top-0 left-[-180px] sm:left-[-120px] w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] bg-green-100 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-[-180px] sm:right-[-120px] w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] bg-orange-100 rounded-full blur-3xl opacity-10" />
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-lg rounded-[28px] sm:rounded-[36px] bg-white p-5 sm:p-8 md:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Password Help</p>
          <img src="/images/sft_logo.png" alt="Logo" className="mx-auto mt-4 w-40 sm:w-50 h-auto max-h-16 object-contain" />
          <p className="mt-6 text-gray-500 leading-8 text-[15px] max-w-md mx-auto">Enter your account email and we will send secure reset instructions.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 sm:mt-10 flex flex-col gap-5">
          <TextField label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth sx={inputStyles} />
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button disabled={loading} type="submit" fullWidth className="!bg-green-700 hover:!bg-orange-500 hover:!text-black !text-white !py-4 !rounded-2xl !font-semibold !text-[15px] transition-all duration-300">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </motion.div>
        </form>
        <p className="text-center text-sm text-gray-500 mt-8">
          Remembered it? <span onClick={() => navigate("/login")} className="text-green-700 font-semibold cursor-pointer hover:text-orange-500 transition">Login</span>
        </p>
      </motion.div>
      <Snackbar open={success} autoHideDuration={4000} onClose={() => setSuccess(false)}>
        <Alert severity="success" variant="filled">Reset instructions sent if the email exists</Alert>
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

export default ForgotPassword;
