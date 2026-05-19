import { useState } from "react";
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";

import { Visibility, VisibilityOff } from "@mui/icons-material";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/Auth/GoogleSignInButton";
import PasswordStrength from "../components/Auth/PasswordStrength";
import useAuthStore from "../store/authStore";

const Register = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((state) => state.signup);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  });

  const [showPass, setShowPass] = useState(false);

  const [errors, setErrors] = useState({});

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // VALIDATION
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name required";

    if (!form.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = "Invalid email";

    if (form.password.length < 8) newErrors.password = "Minimum 8 characters";

    if (form.password !== form.confirm)
      newErrors.confirm = "Passwords do not match";

    if (!form.agree) newErrors.agree = "Please accept terms";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSuccess(true);
      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-[-180px] sm:left-[-120px] w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] bg-green-100 rounded-full blur-3xl opacity-20" />

      <div className="absolute bottom-0 right-[-180px] sm:right-[-120px] w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] bg-orange-100 rounded-full blur-3xl opacity-10" />

      {/* FORM CARD */}
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.6,
        }}
        className="
        relative z-10
        w-full max-w-lg
        rounded-[28px] sm:rounded-[36px]
        bg-white
        p-5 sm:p-8 md:p-12
        shadow-[0_20px_80px_rgba(0,0,0,0.06)]
        "
      >
        {/* TOP LIGHT */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-70" />

        {/* HEADER */}
        <div className="text-center">
          {/* LABEL */}
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-green-700">
            Create Account
          </p>

          {/* TITLE */}
          <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] md:tracking-[-0.05em] leading-[1] text-gray-900">
            <span className="text-green-700">
              <img
                src="/images/sft_logo.png"
                alt="Logo"
                className="mx-auto mt-4 w-40 sm:w-50 h-auto max-h-16 object-contain"
              />
            </span>
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-6 text-gray-500 leading-8 text-[15px] max-w-md mx-auto">
            Start building practical skills, real-world projects, and career
            opportunities with us.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 sm:mt-10 flex flex-col gap-6"
        >
          <GoogleSignInButton label="Sign up with Google" />

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-400">
            <span className="h-px flex-1 bg-gray-100" />
            Or create with email
            <span className="h-px flex-1 bg-gray-100" />
          </div>

          {/* NAME */}
          <TextField
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            sx={inputStyles}
          />

          {/* EMAIL */}
          <TextField
            label="Email Address"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            sx={inputStyles}
          />

          {/* PASSWORD */}
          <TextField
            label="Password"
            name="password"
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            fullWidth
            sx={inputStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass(!showPass)}>
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <PasswordStrength password={form.password} />

          {/* CONFIRM PASSWORD */}
          <TextField
            label="Confirm Password"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            error={!!errors.confirm}
            helperText={errors.confirm}
            fullWidth
            sx={inputStyles}
          />

          {/* TERMS */}
          <div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.agree}
                  onChange={handleChange}
                  name="agree"
                  sx={{
                    color: "#16a34a",

                    "&.Mui-checked": {
                      color: "#16a34a",
                    },
                  }}
                />
              }
              label={
                <span className="text-gray-600 text-sm">
                  I agree to Terms & Conditions
                </span>
              }
            />

            {errors.agree && (
              <p className="text-red-500 text-sm mt-1">{errors.agree}</p>
            )}
          </div>

          {/* BUTTON */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              disabled={loading}
              type="submit"
              fullWidth
              className="
              !bg-green-700
              hover:!bg-orange-500
              hover:!text-black
              !text-white
              !py-4
              !rounded-2xl
              !font-semibold
              !text-[15px]
              transition-all duration-300
              "
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </motion.div>
        </form>

        {/* FOOTER */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="
            text-green-700
            font-semibold
            cursor-pointer
            hover:text-orange-500
            transition
            "
          >
            Login
          </span>
        </p>
      </motion.div>

      {/* SUCCESS */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" variant="filled">
          Account created successfully
        </Alert>
      </Snackbar>
    </div>
  );
};

// INPUT STYLE
const inputStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#f9fafb",
    borderRadius: "18px",
    "& input": {
      color: "#111827",
      padding: "15px 18px",
      fontSize: "0.9375rem",
    },
    "& fieldset": { borderColor: "#f3f4f6" },
    "&:hover fieldset": { borderColor: "#16a34a" },
    "&.Mui-focused fieldset": {
      borderColor: "#16a34a",
      boxShadow: "0 0 0 4px rgba(22,163,74,0.10)",
    },
  },
  "& .MuiInputLabel-root": { color: "#6b7280", fontSize: "0.9375rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#16a34a" },
};

export default Register;
