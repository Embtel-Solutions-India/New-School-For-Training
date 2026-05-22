import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, CircularProgress, TextField } from "@mui/material";
import { BookOpen, CheckCircle2, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import SEO from "../components/SEO";
import useAuthStore from "../store/authStore";
import paymentApi from "../services/paymentApi";
import studentApi from "../services/studentApi";
import { courseApi } from "../services/courseApi";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const CheckoutPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [stripeLoading, setStripeLoading] = useState(false);
  const [enrollingFree, setEnrollingFree] = useState(false);

  const paypalContainerRef = useRef(null);
  const paypalScriptRef = useRef(null);
  const paypalRendered = useRef(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) navigate(`/login?redirect=/checkout/${courseId}`);
  }, [user, courseId, navigate]);

  // Load course + config
  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, configRes] = await Promise.all([
          courseApi.getPublicCourseById(courseId),
          paymentApi.getCheckoutConfig(),
        ]);
        if (!courseRes.data?.success) throw new Error("Course not found");
        setCourse(courseRes.data.course);
        setConfig(configRes.data);
      } catch {
        toast.error("Failed to load checkout");
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) load();
  }, [courseId, navigate]);

  const originalPrice = course?.pricing?.price || 0;
  const discount = couponResult?.discount || 0;
  const finalPrice = couponResult?.finalAmount ?? originalPrice;

  // Load PayPal SDK once config + course are ready and course is paid
  const renderPayPal = useCallback(
    (clientId) => {
      if (paypalRendered.current || !paypalContainerRef.current) return;
      if (!clientId || finalPrice <= 0) return;

      const existing = document.getElementById("paypal-sdk");
      if (existing) {
        mountPayPalButtons(clientId);
        return;
      }

      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.onload = () => mountPayPalButtons(clientId);
      script.onerror = () => console.warn("PayPal SDK failed to load");
      document.body.appendChild(script);
      paypalScriptRef.current = script;
    },
    [finalPrice] // re-render when price changes (coupon applied)
  );

  const mountPayPalButtons = (clientId) => {
    if (!window.paypal || !paypalContainerRef.current) return;
    paypalContainerRef.current.innerHTML = "";
    paypalRendered.current = true;

    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },
        createOrder: async () => {
          const { data } = await paymentApi.createPayPalOrder({
            courseId,
            couponCode: couponResult?.couponCode || "",
          });
          if (!data.success) throw new Error("Failed to create PayPal order");
          return data.paypalOrderId;
        },
        onApprove: async (approveData) => {
          try {
            const { data } = await paymentApi.capturePayPalOrder({
              paypalOrderId: approveData.orderID,
              orderId: approveData.orderID, // backend also looks up by paypalOrderId
            });
            if (data.success) {
              toast.success("Payment successful! You are now enrolled.");
              navigate("/dashboard");
            }
          } catch (err) {
            toast.error(err?.response?.data?.message || "Payment capture failed");
          }
        },
        onCancel: () => toast("Payment cancelled"),
        onError: (err) => {
          console.error("PayPal error:", err);
          toast.error("PayPal encountered an error. Please try again.");
        },
      })
      .render(paypalContainerRef.current);
  };

  // Re-render PayPal when price changes or config arrives
  useEffect(() => {
    if (!config?.paypalClientId || !course || originalPrice === 0) return;
    paypalRendered.current = false;
    renderPayPal(config.paypalClientId);
  }, [config, course, finalPrice, renderPayPal]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data } = await paymentApi.applyCoupon(couponInput.trim(), courseId);
      setCouponResult(data);
      toast.success(data.message);
      paypalRendered.current = false; // re-render PayPal with new amount
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponResult(null);
    setCouponInput("");
    paypalRendered.current = false;
  };

  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    try {
      const { data } = await paymentApi.createStripeSession({
        courseId,
        couponCode: couponResult?.couponCode || "",
      });
      if (data.free) {
        toast.success("Enrolled successfully!");
        navigate("/dashboard");
        return;
      }
      window.location.href = data.sessionUrl;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Checkout failed");
      setStripeLoading(false);
    }
  };

  const handleFreeEnroll = async () => {
    setEnrollingFree(true);
    try {
      await studentApi.enrollCourse(courseId);
      toast.success("Enrolled successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Enrollment failed");
    } finally {
      setEnrollingFree(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CircularProgress sx={{ color: "#15803d" }} />
      </div>
    );
  }

  if (!course) return null;

  const isFree = originalPrice === 0;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <SEO
        title={course ? `Checkout - ${course.title}` : "Course Checkout"}
        description={
          course
            ? `Complete your secure enrollment for ${course.title} at School For Training.`
            : "Complete your secure School For Training course enrollment."
        }
        keywords={[course?.title, course?.category, "course checkout", "secure enrollment"]}
        canonical={`/checkout/${courseId}`}
        image={course?.thumbnail || "/images/Courses1.png"}
        noindex
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 mt-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* ── Left — Course summary + payment ── */}
          <div className="space-y-5">

            {/* Course card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex gap-4 p-5">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="h-20 w-32 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl bg-green-50">
                    <BookOpen size={24} className="text-green-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 leading-snug line-clamp-2">{course.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{course.category}</p>
                  {course.teacher?.name && (
                    <p className="text-xs text-gray-400 mt-0.5">by {course.teacher.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Coupon — only for paid courses */}
            {!isFree && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-green-600" /> Coupon Code
                </p>
                {couponResult ? (
                  <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-green-700">{couponResult.couponCode}</p>
                      <p className="text-xs text-green-600">{couponResult.message}</p>
                    </div>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 transition">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <TextField
                      fullWidth size="small"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          "&.Mui-focused fieldset": { borderColor: "#15803d" },
                        },
                      }}
                    />
                    <Button
                      variant="outlined" onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponInput.trim()}
                      sx={{
                        borderRadius: "12px", borderColor: "#15803d", color: "#15803d",
                        fontWeight: 700, whiteSpace: "nowrap", px: 3,
                        "&:hover": { borderColor: "#15803d", bgcolor: "#f0fdf4" },
                      }}
                    >
                      {applyingCoupon ? <CircularProgress size={16} color="inherit" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Payment methods */}
            {!isFree && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <p className="font-semibold text-gray-900 mb-1">Payment Method</p>

                <Button
                  fullWidth variant="contained" onClick={handleStripeCheckout}
                  disabled={stripeLoading}
                  sx={{
                    py: 1.5, borderRadius: "12px", bgcolor: "#635bff", fontWeight: 700, fontSize: 15,
                    "&:hover": { bgcolor: "#4f46e5" }, "&:disabled": { bgcolor: "#c4c4fc" },
                  }}
                >
                  {stripeLoading
                    ? <CircularProgress size={20} color="inherit" />
                    : "Pay with Card (Stripe)"}
                </Button>

                {config?.paypalClientId && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t border-gray-100" />
                      <span className="text-xs text-gray-400">or</span>
                      <div className="flex-1 border-t border-gray-100" />
                    </div>
                    <div ref={paypalContainerRef} id="paypal-button-container" />
                  </>
                )}
              </div>
            )}

            {/* Free enrollment */}
            {isFree && (
              <Button
                fullWidth variant="contained" onClick={handleFreeEnroll}
                disabled={enrollingFree}
                sx={{
                  py: 1.5, borderRadius: "12px", bgcolor: "#15803d", fontWeight: 700, fontSize: 15,
                  "&:hover": { bgcolor: "#166534" },
                }}
              >
                {enrollingFree ? <CircularProgress size={20} color="inherit" /> : "Enroll for Free"}
              </Button>
            )}
          </div>

          {/* ── Right — Order summary ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm h-fit">
            <p className="font-semibold text-gray-900 mb-4">Order Summary</p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Original price</span>
                <span>{isFree ? "Free" : formatPrice(originalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon discount</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{isFree ? "Free" : formatPrice(finalPrice)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {[
                "30-day money-back guarantee",
                "Full lifetime access",
                "Certificate of completion",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
