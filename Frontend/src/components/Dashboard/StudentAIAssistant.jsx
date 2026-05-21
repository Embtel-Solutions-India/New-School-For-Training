import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@mui/material";
import {
  Bot, ChevronDown, Clock, MessageSquare, Mic, MicOff, Plus, Send, Sparkles, Trash2, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import aiApi from "../../services/aiApi";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const SUGGESTIONS = [
  { label: "Summarize this lesson", prompt: "Please summarize the key points of this lesson." },
  { label: "Generate practice questions", prompt: "Generate 5 practice questions on this lesson to help me study." },
  { label: "Explain with examples", prompt: "Explain the main concepts of this lesson using simple real-world examples." },
  { label: "Key takeaways", prompt: "What are the most important things I should remember from this lesson?" },
  { label: "Study tips", prompt: "Give me effective study tips for mastering this course material." },
];

// Map i18n language code → Web Speech API lang tag
const SPEECH_LANG_MAP = { en: "en-US", hi: "hi-IN", es: "es-ES", fr: "fr-FR" };

const hasSpeechSupport = () =>
  typeof window !== "undefined" &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.07] px-4 py-3">
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/40"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  </div>
);

const MessageBubble = ({ msg, i }) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(i * 0.02, 0.2) }}
    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
  >
    {msg.role === "assistant" && (
      <div className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-violet-500/20">
        <Bot size={14} className="text-violet-300" />
      </div>
    )}
    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
      msg.role === "user"
        ? "rounded-br-sm bg-sky-500/20 text-sky-100"
        : "rounded-bl-sm border border-white/10 bg-white/[0.06] text-white/90"
    }`}>
      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
      {msg.timestamp && (
        <p className="mt-1 text-[10px] opacity-30">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  </motion.div>
);

const StudentAIAssistant = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceSupported] = useState(hasSpeechSupport);
  const recognitionRef = useRef(null);
  const preferredLanguage = localStorage.getItem("preferredLanguage") || "en";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, sending, scrollToBottom]);

  useEffect(() => {
    aiApi.getHistory()
      .then(({ data }) => setSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
    studentApi.getEnrolledCourses({ limit: 50 })
      .then(({ data }) => setEnrollments(data.enrollments || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!courseId) { setLessons([]); setLessonId(""); return; }
    setLessonsLoading(true);
    setLessonId("");
    studentApi.getCourseLessons(courseId)
      .then(({ data }) => setLessons(data.lessons || []))
      .catch(() => setLessons([]))
      .finally(() => setLessonsLoading(false));
  }, [courseId]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const loadSession = async (sid) => {
    try {
      const { data } = await aiApi.getSession(sid);
      setSessionId(data.session.sessionId);
      setMessages(data.session.messages || []);
      setShowSessions(false);
    } catch {
      toast.error("Failed to load session");
    }
  };

  const handleDeleteSession = async (sid, e) => {
    e.stopPropagation();
    try {
      await aiApi.deleteSession(sid);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sid));
      if (sessionId === sid) startNewChat();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput("");
    setTranscript("");
    setSending(true);

    const userMsg = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { data } = await aiApi.sendMessage({
        message: msg,
        sessionId,
        courseId: courseId || undefined,
        lessonId: lessonId || undefined,
        preferredLanguage,
      });
      setSessionId(data.sessionId);
      setMessages(data.messages);

      setSessions((prev) => {
        const existing = prev.find((s) => s.sessionId === data.sessionId);
        if (existing) {
          return prev.map((s) => s.sessionId === data.sessionId
            ? { ...s, updatedAt: new Date() } : s);
        }
        return [{ sessionId: data.sessionId, title: msg.slice(0, 80), courseTitle: "", updatedAt: new Date(), messages: [] }, ...prev];
      });
    } catch (err) {
      const errMsg = err?.response?.data?.message || "AI assistant temporarily unavailable. Please try again.";
      toast.error(errMsg);
      setMessages((prev) => prev.slice(0, -1));
      setInput(msg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startListening = () => {
    if (!voiceSupported) {
      toast.error(t("voice_not_supported"));
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[preferredLanguage] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      setTranscript(finalText || interimText);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error !== "aborted") {
        toast.error("Voice recognition error: " + event.error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const useTranscriptAsInput = () => {
    if (transcript.trim()) {
      setInput(transcript.trim());
      setTranscript("");
      inputRef.current?.focus();
    }
  };

  const sendTranscriptDirectly = () => {
    if (transcript.trim()) sendMessage(transcript.trim());
  };

  const selectedCourse = enrollments.find((en) => en.course?._id === courseId)?.course;
  const selectedLesson = lessons.find((l) => l._id === lessonId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-500/20">
              <Bot size={28} className="text-violet-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">{t("ai_assistant")}</h1>
              <p className="mt-1 text-white/60">Powered by Gemini — ask anything about your courses</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center">
              <p className="text-lg font-bold text-violet-300">{sessions.length}</p>
              <p className="text-xs text-white/50">Saved Chats</p>
            </div>
            {voiceSupported && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-center">
                <Mic size={16} className="mx-auto text-emerald-300 mb-0.5" />
                <p className="text-xs text-white/50">Voice On</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        {/* Sessions Sidebar */}
        <div className={`rounded-[24px] ${glass} p-4 xl:max-h-[700px] xl:overflow-hidden xl:flex xl:flex-col`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white/60">{t("recent_chats")}</p>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 rounded-xl bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/30 transition"
            >
              <Plus size={13} /> {t("new_chat")}
            </button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            {historyLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
              ))
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-white/20" />
                <p className="text-xs text-white/35">No saved chats yet</p>
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.sessionId}
                  onClick={() => loadSession(s.sessionId)}
                  className={`group w-full rounded-xl px-3 py-2.5 text-left transition ${
                    sessionId === s.sessionId
                      ? "bg-violet-500/20 text-violet-100"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-xs font-medium">{s.title || "Chat"}</p>
                    <button
                      onClick={(e) => handleDeleteSession(s.sessionId, e)}
                      className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  {s.courseTitle && (
                    <p className="mt-0.5 truncate text-[10px] opacity-40">{s.courseTitle}</p>
                  )}
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-30">
                    <Clock size={9} />
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`rounded-[24px] ${glass} flex flex-col`} style={{ minHeight: 600 }}>
          {/* Context Selector */}
          <div className="border-b border-white/10 p-4 flex flex-wrap gap-3 items-center">
            <Sparkles size={14} className="text-violet-400 shrink-0" />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-violet-400/40 transition"
            >
              <option value="">{t("select_course")}</option>
              {enrollments.map((en) => (
                <option key={en._id} value={en.course?._id}>{en.course?.title}</option>
              ))}
            </select>
            {courseId && (
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                disabled={lessonsLoading}
                className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-violet-400/40 transition disabled:opacity-40"
              >
                <option value="">{t("select_lesson")}</option>
                {lessons.map((l) => (
                  <option key={l._id} value={l._id}>{l.title}</option>
                ))}
              </select>
            )}
            {(selectedCourse || selectedLesson) && (
              <div className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-[10px] text-violet-300">
                <Bot size={10} />
                {selectedLesson ? selectedLesson.title : selectedCourse?.title}
                <button onClick={() => { setCourseId(""); setLessonId(""); }} className="ml-1 hover:text-white">
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar" style={{ maxHeight: 460 }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 mb-4">
                  <Sparkles size={28} className="text-violet-300" />
                </div>
                <p className="text-white/60 font-medium">{t("ask_anything")}</p>
                <p className="mt-1 text-xs text-white/35">Select a course context above for better answers</p>
                {voiceSupported && (
                  <p className="mt-1 text-xs text-emerald-400/60">
                    🎤 Click the mic button to use voice input
                  </p>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => sendMessage(s.prompt)}
                      className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.1] hover:text-white transition"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} i={i} />)}
                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Voice transcript preview */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-emerald-400/20 bg-emerald-400/5 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <Mic size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-emerald-400/70 mb-1">{t("transcript_preview")}</p>
                    <p className="text-sm text-white/80 leading-snug">{transcript}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={useTranscriptAsInput}
                      className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/[0.12] hover:text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={sendTranscriptDirectly}
                      disabled={sending}
                      className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-40"
                    >
                      {t("use_transcript")}
                    </button>
                    <button
                      onClick={() => setTranscript("")}
                      className="rounded-lg px-1.5 py-1 text-white/30 hover:text-white/60 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            {messages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt)}
                    disabled={sending}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45 hover:bg-white/[0.08] hover:text-white/70 transition disabled:opacity-40"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
                disabled={sending}
                className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/40 transition disabled:opacity-50"
                style={{ maxHeight: 120, overflow: "auto" }}
              />

              {/* Mic button */}
              {voiceSupported && (
                <button
                  onClick={startListening}
                  disabled={sending}
                  title={isListening ? t("listening") : t("voice_input")}
                  className={`grid h-12 w-12 shrink-0 place-items-center self-end rounded-2xl transition disabled:opacity-40 ${
                    isListening
                      ? "bg-red-500/30 text-red-300 hover:bg-red-500/40"
                      : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  }`}
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <MicOff size={18} />
                    </motion.div>
                  ) : (
                    <Mic size={18} />
                  )}
                </button>
              )}

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="grid h-12 w-12 shrink-0 place-items-center self-end rounded-2xl bg-violet-500/20 text-violet-300 transition hover:bg-violet-500/30 disabled:opacity-40"
              >
                {sending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Sparkles size={18} />
                  </motion.div>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            {isListening && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-center text-xs text-emerald-400/70"
              >
                🎤 {t("listening")} Click mic to stop.
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAIAssistant;
