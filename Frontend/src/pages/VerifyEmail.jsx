import { useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/authApi";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("Verification token is missing.");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("Email verified successfully."))
      .catch((err) => setStatus(err.response?.data?.message || "Email verification failed."));
  }, [params]);

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-lg rounded-[28px] sm:rounded-[36px] bg-white p-5 sm:p-8 md:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.06)] text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Email Verification</p>
        <img src="/images/sft_logo.png" alt="Logo" className="mx-auto mt-4 w-40 sm:w-50 h-auto max-h-16 object-contain" />
        <Alert className="!mt-8" severity={status.includes("success") ? "success" : status.includes("failed") || status.includes("missing") ? "error" : "info"}>
          {status}
        </Alert>
        <Button onClick={() => navigate("/dashboard")} className="!mt-8 !rounded-2xl !bg-green-700 !px-7 !py-3 !text-white hover:!bg-orange-500 hover:!text-black">
          Continue
        </Button>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
