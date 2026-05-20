import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radio, X } from "lucide-react";

const AUTO_DISMISS_MS = 30_000;

const LiveClassPopup = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <PopupCard key={n.liveClassId} notification={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const PopupCard = ({ notification, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(AUTO_DISMISS_MS / 1000);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          onDismiss(notification.liveClassId);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [notification.liveClassId, onDismiss]);

  const handleJoin = () => {
    if (notification.meetingLink) {
      window.open(notification.meetingLink, "_blank", "noopener,noreferrer");
    }
    onDismiss(notification.liveClassId);
  };

  const progress = (timeLeft / (AUTO_DISMISS_MS / 1000)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="pointer-events-auto w-80 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(17,24,39,0.92)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(239,68,68,0.3)",
      }}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-red-900/40">
        <motion.div
          className="h-full bg-red-500"
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Pulsing live indicator */}
            <div className="relative shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-50" />
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40">
                <Radio size={16} className="text-red-400" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-0.5">
                Live Now
              </p>
              <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                {notification.title}
              </p>
            </div>
          </div>

          <button
            onClick={() => onDismiss(notification.liveClassId)}
            className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors mt-0.5"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {notification.meetingLink ? (
            <button
              onClick={handleJoin}
              className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
            >
              Join Now
            </button>
          ) : (
            <button
              onClick={() => onDismiss(notification.liveClassId)}
              className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
            >
              View in Dashboard
            </button>
          )}
          <span className="text-xs text-gray-500 tabular-nums shrink-0">{timeLeft}s</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveClassPopup;
