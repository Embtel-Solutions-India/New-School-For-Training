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
import SEO, {
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
  websiteSchema,
} from "./components/SEO";
import useAuthStore from "./store/authStore";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));

const pageSeo = {
  home: {
    title: "Career-Focused Online Courses",
    description:
      "Learn in-demand technology skills with live classes, practical projects, expert instructors, and career-ready certifications from School For Training.",
    keywords: ["online technology courses", "live coding classes", "career certification", "School For Training"],
    canonical: "/",
    structuredData: [organizationSchema, websiteSchema],
  },
  login: {
    title: "Login",
    description: "Login to your School For Training account to continue your courses, lessons, quizzes, and certificates.",
    keywords: ["student login", "teacher login", "School For Training login"],
    canonical: "/login",
    noindex: true,
  },
  register: {
    title: "Register",
    description: "Create a School For Training account to enroll in career-focused online courses and live classes.",
    keywords: ["register for online courses", "create learning account", "School For Training signup"],
    canonical: "/register",
  },
  forgotPassword: {
    title: "Forgot Password",
    description: "Recover access to your School For Training account securely.",
    keywords: ["forgot password", "account recovery", "School For Training"],
    canonical: "/forgot-password",
    noindex: true,
  },
  resetPassword: {
    title: "Reset Password",
    description: "Reset your School For Training account password securely.",
    keywords: ["reset password", "secure account", "School For Training"],
    canonical: "/reset-password",
    noindex: true,
  },
  verifyEmail: {
    title: "Verify Email",
    description: "Verify your School For Training account email address.",
    keywords: ["verify email", "School For Training account"],
    canonical: "/verify-email",
    noindex: true,
  },
  authCallback: {
    title: "Authentication Callback",
    description: "Secure authentication callback for School For Training.",
    keywords: ["authentication", "School For Training"],
    canonical: "/auth/callback",
    noindex: true,
  },
  unauthorized: {
    title: "Unauthorized",
    description: "This School For Training page requires the right account permissions.",
    keywords: ["unauthorized", "School For Training"],
    canonical: "/unauthorized",
    noindex: true,
  },
  dashboard: {
    title: "Dashboard",
    description: "Access your School For Training learning dashboard, course progress, lessons, reviews, and certificates.",
    keywords: ["learning dashboard", "course progress", "student dashboard"],
    canonical: "/dashboard",
    noindex: true,
  },
  courses: {
    title: "Online Courses",
    description:
      "Browse live and self-paced technology courses with structured roadmaps, real projects, quizzes, and certificates.",
    keywords: ["online courses", "technology courses", "certification courses", "live classes"],
    canonical: "/courses",
    structuredData: breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Courses", path: "/courses" },
    ]),
  },
  about: {
    title: "About School For Training",
    description:
      "Learn about School For Training, our practical learning model, guided process, and mission to help students build career-ready skills.",
    keywords: ["about School For Training", "technology institute", "online learning platform"],
    canonical: "/about",
    structuredData: [organizationSchema],
  },
  blog: {
    title: "Technology Blog",
    description:
      "Read career, development, AI, cloud, certification, and industry trend articles from School For Training instructors.",
    keywords: ["technology blog", "career articles", "coding blog", "certification guides"],
    canonical: "/blog",
  },
  contact: {
    title: "Contact",
    description:
      "Contact School For Training for course guidance, admissions support, partnerships, and learning platform questions.",
    keywords: ["contact School For Training", "course support", "admissions help"],
    canonical: "/contact",
    structuredData: breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]),
  },
  privacy: {
    title: "Privacy Policy",
    description: "Read the School For Training privacy policy for data collection, account privacy, and platform usage.",
    keywords: ["privacy policy", "data privacy", "School For Training"],
    canonical: "/privacy",
  },
  terms: {
    title: "Terms and Conditions",
    description: "Review the terms and conditions for using School For Training courses, accounts, and platform services.",
    keywords: ["terms and conditions", "platform terms", "School For Training"],
    canonical: "/terms",
  },
  help: {
    title: "Help Center",
    description: "Find help for School For Training accounts, courses, payments, certificates, and learning features.",
    keywords: ["help center", "course help", "learning support"],
    canonical: "/help",
    structuredData: faqSchema([
      {
        question: "How do I enroll in a course?",
        answer: "Browse courses, open a course detail page, and use the enrollment button to start the checkout or free enrollment flow.",
      },
      {
        question: "Can I verify certificates?",
        answer: "Yes. Certificate verification pages can confirm issued certificates using their verification ID.",
      },
    ]),
  },
  features: {
    title: "Platform Features",
    description: "Explore School For Training features including live classes, projects, quizzes, certificates, dashboards, and learning analytics.",
    keywords: ["learning platform features", "live classes", "certificates", "course dashboard"],
    canonical: "/features",
  },
  pricing: {
    title: "Pricing",
    description: "Explore School For Training course pricing, subscriptions, and learning plans for career-focused technology education.",
    keywords: ["course pricing", "online course plans", "training pricing"],
    canonical: "/pricing",
  },
  testimonials: {
    title: "Student Testimonials",
    description: "Read School For Training student testimonials and learner outcomes from career-focused technology programs.",
    keywords: ["student testimonials", "course reviews", "learner success"],
    canonical: "/testimonials",
  },
  careers: {
    title: "Careers",
    description: "Explore career opportunities and teaching roles with School For Training.",
    keywords: ["careers", "teacher jobs", "education jobs"],
    canonical: "/careers",
  },
  community: {
    title: "Learning Community",
    description: "Join the School For Training learning community for discussions, peer support, events, and student collaboration.",
    keywords: ["learning community", "student community", "course discussions"],
    canonical: "/community",
  },
  cookies: {
    title: "Cookie Policy",
    description: "Learn how School For Training uses cookies and similar technologies across the platform.",
    keywords: ["cookie policy", "cookies", "School For Training"],
    canonical: "/cookies",
  },
  checkoutSuccess: {
    title: "Payment Successful",
    description: "Your School For Training checkout was successful.",
    keywords: ["payment successful", "course enrollment"],
    canonical: "/checkout/success",
    noindex: true,
  },
  checkoutCancel: {
    title: "Payment Cancelled",
    description: "Your School For Training checkout was cancelled.",
    keywords: ["payment cancelled", "course checkout"],
    canonical: "/checkout/cancel",
    noindex: true,
  },
};

const withSeo = (key, element) => (
  <>
    <SEO {...pageSeo[key]} />
    {element}
  </>
);

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
        <Route path="/" element={withSeo("home", <Home />)} />
        <Route path="/login" element={withSeo("login", <Login />)} />
        <Route path="/register" element={withSeo("register", <Register />)} />
        <Route path="/forgot-password" element={withSeo("forgotPassword", <ForgotPassword />)} />
        <Route path="/reset-password" element={withSeo("resetPassword", <ResetPassword />)} />
        <Route path="/verify-email" element={withSeo("verifyEmail", <VerifyEmail />)} />
        <Route path="/auth/callback" element={withSeo("authCallback", <AuthCallback />)} />
        <Route path="/unauthorized" element={withSeo("unauthorized", <Unauthorized />)} />
        <Route
          path="/dashboard"
          element={
            withSeo(
              "dashboard",
              <ProtectedRoute roles={["student", "teacher", "admin"]}>
                <Suspense fallback={<DashboardFallback />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            )
          }
        />
        <Route path="/courses" element={withSeo("courses", <CourseShowcase />)} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/checkout/:courseId" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={withSeo("checkoutSuccess", <PaymentSuccessPage />)} />
        <Route path="/checkout/cancel" element={withSeo("checkoutCancel", <PaymentCancelPage />)} />
        <Route path="/about" element={withSeo("about", <AboutPage />)} />
        <Route path="/blog" element={withSeo("blog", <BlogPage />)} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/contact" element={withSeo("contact", <ContactPage />)} />
        <Route path="/privacy" element={withSeo("privacy", <PrivacyPolicy />)} />
        <Route path="/terms" element={withSeo("terms", <TermAndConditions />)} />
        <Route path="/help" element={withSeo("help", <HelpCenterPage />)} />
        <Route path="/certificate/verify/:certId" element={<CertificateVerifyPage />} />
        <Route path="/features" element={withSeo("features", <Suspense fallback={<PageFallback />}><FeaturesPage /></Suspense>)} />
        <Route path="/pricing" element={withSeo("pricing", <Suspense fallback={<PageFallback />}><PricingPage /></Suspense>)} />
        <Route path="/testimonials" element={withSeo("testimonials", <Suspense fallback={<PageFallback />}><TestimonialsPage /></Suspense>)} />
        <Route path="/careers" element={withSeo("careers", <Suspense fallback={<PageFallback />}><CareersPage /></Suspense>)} />
        <Route path="/community" element={withSeo("community", <Suspense fallback={<PageFallback />}><CommunityPage /></Suspense>)} />
        <Route path="/cookies" element={withSeo("cookies", <Suspense fallback={<PageFallback />}><CookiesPage /></Suspense>)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
