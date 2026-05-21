import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, CheckCircle2, Shield, AlertCircle, ArrowLeft, ExternalLink, Calendar, BookOpen, User } from "lucide-react";
import api from "../services/api";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const CertificateVerifyPage = () => {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!certId) { setNotFound(true); setLoading(false); return; }
    api.get(`/certificate/verify/${certId}`)
      .then(({ data }) => setCert(data.certificate))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [certId]);

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6">
      {/* Brand header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center gap-2"
      >
        <img src="/images/sft_logo.png" alt="SFT" className="h-12 w-12 rounded-full object-cover" />
        <p className="text-base font-bold text-white/90">SFT Learning Platform</p>
        <p className="text-xs text-white/40">Certificate Verification Portal</p>
      </motion.div>

      {loading && (
        <div className="flex flex-col items-center gap-3 text-white/40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-sky-400" />
          <p className="text-sm">Verifying certificate…</p>
        </div>
      )}

      {!loading && notFound && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md w-full rounded-[28px] border border-red-400/20 bg-red-400/[0.05] backdrop-blur-2xl p-8 text-center`}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Certificate Not Found</h2>
          <p className="text-sm text-white/50 mb-1">
            The certificate ID could not be verified.
          </p>
          {certId && (
            <p className="text-xs text-white/30 font-mono mb-6 break-all">{certId}</p>
          )}
          <p className="text-xs text-white/40 mb-6">
            Please check that the ID is correct. If you believe this is an error,
            contact{" "}
            <a href="mailto:support@schoolfortraining.com" className="text-sky-400 hover:underline">
              support@schoolfortraining.com
            </a>
            .
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition">
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </motion.div>
      )}

      {!loading && cert && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-lg w-full rounded-[32px] ${glass} overflow-hidden`}
        >
          {/* Certificate top banner */}
          <div className="relative bg-gradient-to-r from-yellow-900/40 via-amber-800/30 to-yellow-900/40 px-8 py-7">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 ring-2 ring-emerald-400/30">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-0.5">
                  ✓ Verified &amp; Authentic
                </p>
                <h2 className="text-2xl font-bold text-white">Certificate of Completion</h2>
              </div>
            </div>
            {/* Decorative award icon */}
            <Award size={80} className="absolute right-6 top-1/2 -translate-y-1/2 text-yellow-400/10" />
          </div>

          {/* Certificate details */}
          <div className="px-8 py-6 space-y-5">
            {/* Student name */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User size={12} className="text-white/30" />
                <p className="text-xs text-white/40">Awarded to</p>
              </div>
              <p className="text-2xl font-bold text-white">{cert.studentName}</p>
            </div>

            {/* Course */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={12} className="text-white/30" />
                <p className="text-xs text-white/40">Course completed</p>
              </div>
              <p className="text-base font-semibold text-sky-300">{cert.courseTitle}</p>
            </div>

            {/* Instructor + Grade row */}
            <div className="flex flex-wrap gap-4">
              {cert.instructorName && (
                <div>
                  <p className="text-xs text-white/40 mb-1">Instructor</p>
                  <p className="text-sm font-medium text-white/80">{cert.instructorName}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/40 mb-1">Grade</p>
                <span className="inline-block rounded-full bg-emerald-400/15 px-3 py-0.5 text-sm font-bold text-emerald-300">
                  {cert.grade}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className="text-white/30" />
                  <p className="text-xs text-white/40">Date issued</p>
                </div>
                <p className="text-sm text-white/70">
                  {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Certificate ID */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-white/40 mb-1">Certificate ID</p>
              <p className="font-mono text-xs text-white/60 break-all">{cert.certificateId}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <Shield size={12} />
              <span>Issued by SFT Learning Platform</span>
            </div>
            <a
              href="https://schoolfortraining.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
            >
              <ExternalLink size={11} />
              schoolfortraining.com
            </a>
          </div>
        </motion.div>
      )}

      {/* Back link */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Link to="/" className="text-xs text-white/25 hover:text-white/50 transition flex items-center gap-1.5">
            <ArrowLeft size={12} />
            SFT Learning Platform
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default CertificateVerifyPage;
