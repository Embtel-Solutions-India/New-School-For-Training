import { useEffect } from "react";
import useAuthStore from "../store/authStore";
import { connectSocket, disconnectSocket } from "../services/socketClient";

const useSocket = () => {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user?._id) return;
    connectSocket(user._id);
    return () => disconnectSocket();
  }, [user?._id]);
};

export default useSocket;
