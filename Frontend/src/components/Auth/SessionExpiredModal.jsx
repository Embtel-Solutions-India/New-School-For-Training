import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const SessionExpiredModal = () => {
  const navigate = useNavigate();
  const { sessionExpired, clearSessionExpired } = useAuthStore();

  return (
    <Dialog open={sessionExpired} onClose={clearSessionExpired} slotProps={{ paper: { className: "!rounded-[24px]" } }}>
      <DialogTitle className="!font-bold !text-gray-900">Session expired</DialogTitle>
      <DialogContent className="!text-gray-400">
        Your secure session ended. Please sign in again to continue.
      </DialogContent>
      <DialogActions className="!p-5">
        <Button
          onClick={() => {
            clearSessionExpired();
            navigate("/login");
          }}
          className="!rounded-2xl !bg-green-700 !px-5 !py-2.5 !text-white hover:!bg-orange-500 hover:!text-black"
        >
          Login again
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionExpiredModal;
