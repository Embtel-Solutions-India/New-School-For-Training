import { useState } from "react";

import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import GoogleSignInButton from "../components/Auth/GoogleSignInButton";
import useAuthStore from "../store/authStore";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [success, setSuccess] =
    useState(false);
  const [loading, setLoading] = useState(false);

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      setSuccess(true);
      toast.success("Logged in successfully");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const oauthError = searchParams.get("oauth_error");

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
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">
            Welcome Back
          </p>
          <img
            src="/images/sft_logo.png"
            alt="Logo"
            className="mx-auto mt-4 w-40 sm:w-50 h-auto max-h-16 object-contain"
          />

         

          {/* DESCRIPTION */}
          <p className="mt-6 text-gray-500 leading-8 text-[15px] max-w-md mx-auto">
            Access your dashboard, courses,
            projects, and continue building
            your tech career.
          </p>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 sm:mt-10 flex flex-col gap-6"
        >
          {oauthError && (
            <Alert severity="error">
              {decodeURIComponent(oauthError)}
            </Alert>
          )}

          <GoogleSignInButton />

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-400">
            <span className="h-px flex-1 bg-gray-100" />
            Or login with email
            <span className="h-px flex-1 bg-gray-100" />
          </div>

          {/* EMAIL */}
          <TextField
            label="Email Address"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            sx={inputStyles}
          />

          {/* PASSWORD */}
          <TextField
            label="Password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={form.password}
            onChange={handleChange}
            fullWidth
            sx={inputStyles}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* REMEMBER + FORGOT */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.remember}
                  onChange={handleChange}
                  name="remember"
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
                  Remember me
                </span>
              }
            />

            <span
              onClick={() => navigate("/forgot-password")}
              className="
              text-sm
              text-green-700
              cursor-pointer
              hover:text-orange-500
              transition
              "
            >
              Forgot password?
            </span>

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
              {loading ? "Logging in..." : "Login"}
            </Button>

          </motion.div>

        </form>

        {/* FOOTER */}
        <p className="text-center text-sm text-gray-500 mt-8">

          Don’t have an account?{" "}

          <span
            onClick={() =>
              navigate("/register")
            }
            className="
            text-green-700
            font-semibold
            cursor-pointer
            hover:text-orange-500
            transition
            "
          >
            Sign up
          </span>

        </p>

      </motion.div>

      {/* SUCCESS TOAST */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() =>
          setSuccess(false)
        }
      >

        <Alert
          severity="success"
          variant="filled"
        >
          Logged in successfully
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

export default Login;
