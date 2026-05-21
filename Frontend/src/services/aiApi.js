import api from "./api";

const sendMessage = (data) => api.post("/ai/chat", data);
const getHistory = () => api.get("/ai/history");
const getSession = (sessionId) => api.get(`/ai/session/${sessionId}`);
const deleteSession = (sessionId) => api.delete(`/ai/session/${sessionId}`);

const generateLessonSummary = (data) => api.post("/ai/lesson-summary", data);
const getLessonSummary = (lessonId, language = "en") => api.get(`/ai/lesson-summary/${lessonId}`, { params: { language } });
const voiceChat = (data) => api.post("/ai/voice", data);

const aiApi = { sendMessage, getHistory, getSession, deleteSession, generateLessonSummary, getLessonSummary, voiceChat };
export default aiApi;
