import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton, TextField } from "@mui/material";
import { Award, CheckCircle2, ExternalLink, Search, Shield } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const StudentCertificates = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    studentApi.getMyCertificates()
      .then(({ data }) => setCerts(data.certificates || []))
      .catch(() => toast.error("Failed to load certificates"))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async () => {
    if (!verifyId.trim()) return;
    try {
      setVerifying(true);
      setVerifyResult(null);
      const { data } = await studentApi.verifyCertificate(verifyId.trim());
      setVerifyResult({ valid: true, cert: data.certificate });
    } catch {
      setVerifyResult({ valid: false });
    } finally { setVerifying(false); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Certificates</h1>
            <p className="mt-2 text-white/60">Your course completion certificates</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-300">{certs.length}</p>
            <p className="text-xs text-white/50">Earned</p>
          </div>
        </div>
      </motion.div>

      {/* Verify Certificate */}
      <div className={`rounded-[24px] ${glass} p-5`}>
        <p className="mb-3 text-sm font-semibold text-white/60">Verify a Certificate</p>
        <div className="flex gap-3">
          <TextField value={verifyId} onChange={(e) => setVerifyId(e.target.value)} placeholder="Enter Certificate ID..."
            size="small" sx={{ flex: 1 }} slotProps={{ input: { startAdornment: <Search size={14} className="mr-2 text-white/40 shrink-0" />, sx: { color: "white" } } }} />
          <button onClick={handleVerify} disabled={verifying}
            className="rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 transition">
            {verifying ? "Checking..." : "Verify"}
          </button>
        </div>
        {verifyResult && (
          <div className={`mt-3 rounded-xl border p-3 text-sm ${verifyResult.valid ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-300" : "border-red-400/30 bg-red-400/5 text-red-300"}`}>
            {verifyResult.valid ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Valid certificate — {verifyResult.cert?.student?.name} completed {verifyResult.cert?.course?.title}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield size={16} />
                <span>Certificate not found. Please check the ID.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificates List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={200} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : certs.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <Award size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No certificates yet</p>
          <p className="mt-1 text-xs text-white/30">Complete a course 100% to earn your certificate</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert, i) => (
            <motion.div key={cert._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-[20px] ${glass} overflow-hidden`}>
              {/* Certificate visual */}
              <div className="relative h-32 bg-gradient-to-br from-yellow-900/30 to-amber-700/20 flex items-center justify-center">
                {cert.course?.thumbnail ? (
                  <img src={cert.course.thumbnail} alt="" className="h-full w-full object-cover opacity-30" />
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Award size={32} className="text-yellow-400" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-yellow-300">Certificate of Completion</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{cert.course?.title}</h3>
                <p className="text-xs text-white/40 mt-1">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                <p className="text-xs text-white/30 mt-0.5 font-mono">{cert.certificateId}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-xs font-bold text-yellow-300">{cert.grade}</span>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-xs text-emerald-300">Verified</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;
