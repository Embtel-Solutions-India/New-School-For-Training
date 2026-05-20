import api from "./api";

const sendMessage = (data) => api.post("/ai/chat", data);
const getHistory = () => api.get("/ai/history");
const getSession = (sessionId) => api.get(`/ai/session/${sessionId}`);
const deleteSession = (sessionId) => api.delete(`/ai/session/${sessionId}`);

const aiApi = { sendMessage, getHistory, getSession, deleteSession };
export default aiApi;
