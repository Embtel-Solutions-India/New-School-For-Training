import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AboutPage from "./pages/AboutPage";
import CourseShowcase from "./pages/CoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicy from "./components/Common/PrivacyPolicy";
import TermAndConditions from "./components/Common/TermAndConditions";
import ScrollToTop from "./components/Common/ScrollToTop";
import HelpCenterPage from "./components/Common/HelpCenterPage";
import CertificateVerifyPage from "./pages/CertificateVerifyPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import SessionExpiredModal from "./components/Auth/SessionExpiredModal";
import useAuthStore from "./store/authStore";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));

const DashboardFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-green-200 font-semibold">
    Loading dashboard...
  </div>
);

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 font-semibold">
    Loading...
  </div>
);

function App() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

const hydrated = useAuthStore((state) => state.hydrated);

const user = useAuthStore((state) => state.user);

const accessToken = useAuthStore((state) => state.accessToken);

useEffect(() => {
  if (!hydrated) return;
  if (user) {
    hydrateSession();
  }
}, [hydrated, hydrateSession]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SessionExpiredModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["student", "teacher", "admin"]}>
              <Suspense fallback={<DashboardFallback />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/courses" element={<CourseShowcase />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/checkout/:courseId" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<PaymentSuccessPage />} />
        <Route path="/checkout/cancel" element={<PaymentCancelPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermAndConditions />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/certificate/verify/:certId" element={<CertificateVerifyPage />} />
        <Route path="/features" element={<Suspense fallback={<PageFallback />}><FeaturesPage /></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<PageFallback />}><PricingPage /></Suspense>} />
        <Route path="/testimonials" element={<Suspense fallback={<PageFallback />}><TestimonialsPage /></Suspense>} />
        <Route path="/careers" element={<Suspense fallback={<PageFallback />}><CareersPage /></Suspense>} />
        <Route path="/community" element={<Suspense fallback={<PageFallback />}><CommunityPage /></Suspense>} />
        <Route path="/cookies" element={<Suspense fallback={<PageFallback />}><CookiesPage /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
