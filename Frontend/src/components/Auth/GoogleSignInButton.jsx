import { Button } from "@mui/material";
import { googleAuthUrl } from "../../services/authApi";

const GoogleSignInButton = ({ label = "Continue with Google" }) => {
  return (
    <Button
      type="button"
      fullWidth
      onClick={() => {
        window.location.href = googleAuthUrl();
      }}
      className="!rounded-2xl !border !border-gray-200 !bg-white !py-3.5 !font-semibold !text-gray-700 hover:!bg-gray-50"
    >
      {label}
    </Button>
  );
};

export default GoogleSignInButton;
