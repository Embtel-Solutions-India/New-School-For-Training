import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@mui/material";
import { XCircle } from "lucide-react";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";

const PaymentCancelPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("course");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-24 mt-16">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center max-w-md w-full">
          <XCircle size={56} className="mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-500 mb-8 text-sm">
            Your payment was cancelled and you have not been charged.
          </p>
          <div className="flex flex-col gap-3">
            {courseId && (
              <Button
                fullWidth variant="contained"
                onClick={() => navigate(`/checkout/${courseId}`)}
                sx={{
                  py: 1.5, borderRadius: "12px", bgcolor: "#15803d", fontWeight: 700,
                  "&:hover": { bgcolor: "#166534" },
                }}
              >
                Try Again
              </Button>
            )}
            <Button
              fullWidth variant="outlined"
              onClick={() => navigate("/courses")}
              sx={{ py: 1.5, borderRadius: "12px", borderColor: "#15803d", color: "#15803d", fontWeight: 700 }}
            >
              Browse Courses
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentCancelPage;
