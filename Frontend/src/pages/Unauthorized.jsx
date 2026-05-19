import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Access Restricted</p>
        <h1 className="mt-5 text-3xl font-bold text-gray-900">Unauthorized</h1>
        <p className="mt-4 text-gray-500">Your current role does not have permission to view this page.</p>
        <Button onClick={() => navigate("/dashboard")} className="!mt-8 !rounded-2xl !bg-green-700 !px-7 !py-3 !text-white hover:!bg-orange-500 hover:!text-black">
          Back to dashboard
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
