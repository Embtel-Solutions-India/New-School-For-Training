import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, CircularProgress } from "@mui/material";
import { CheckCircle2 } from "lucide-react";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import paymentApi from "../services/paymentApi";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    paymentApi
      .verifyStripeSession(sessionId)
      .then(({ data }) => setVerified(data.paid))
      .catch(() => setVerified(true)) // show success even if verify fails
      .finally(() => setVerifying(false));
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-24 mt-16">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center max-w-md w-full">
          {verifying ? (
            <CircularProgress sx={{ color: "#15803d" }} />
          ) : (
            <>
              <CheckCircle2 size={56} className="mx-auto mb-4 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-500 mb-8 text-sm">
                You are now enrolled. Head to your dashboard to start learning.
              </p>
              <Button
                fullWidth variant="contained" onClick={() => navigate("/dashboard")}
                sx={{
                  py: 1.5, borderRadius: "12px", bgcolor: "#15803d", fontWeight: 700,
                  "&:hover": { bgcolor: "#166534" },
                }}
              >
                Go to My Courses
              </Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
