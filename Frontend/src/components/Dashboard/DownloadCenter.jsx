import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import { Award, Download, ExternalLink, File, FileText } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const FILE_CONFIG = {
  pdf: { icon: FileText, color: "#f87171", bg: "rgba(248,113,113,0.15)", label: "PDF" },
  download: { icon: Download, color: "#60a5fa", bg: "rgba(96,165,250,0.15)", label: "File" },
  certificate: { icon: Award, color: "#fbbf24", bg: "rgba(251,191,36,0.15)", label: "Certificate" },
};

const ResourceCard = ({ item, i }) => {
  const fc = FILE_CONFIG[item.type] || FILE_CONFIG.download;
  const Icon = fc.icon;
  return (
    <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
      className={`rounded-[20px] ${glass} p-4 flex items-center gap-4`}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: fc.bg }}>
        <Icon size={18} style={{ color: fc.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{item.title}</p>
        <p className="text-xs text-white/40 truncate">{item.course}</p>
        {item.issuedAt && (
          <p className="text-xs text-white/25">Issued {new Date(item.issuedAt).toLocaleDateString()}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: fc.bg, color: fc.color }}>
          {fc.label}
        </span>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white">
            <ExternalLink size={12} /> Open
          </a>
        )}
      </div>
    </motion.div>
  );
};

const DownloadCenter = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    studentApi.getDownloads()
      .then(({ data: res }) => setData(res))
      .catch(() => toast.error("Failed to load downloads"))
      .finally(() => setLoading(false));
  }, []);

  const allItems = data ? [...(data.resources || []), ...(data.certificates || [])] : [];
  const resources = data?.resources || [];
  const certificates = data?.certificates || [];

  const displayed = tab === "all" ? allItems : tab === "certificates" ? certificates : resources;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Download Center</h1>
            <p className="mt-2 text-white/60">Access your course resources and certificates</p>
          </div>
          {data && (
            <div className="flex gap-3">
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-center">
                <p className="text-lg font-bold text-sky-300">{resources.length}</p>
                <p className="text-xs text-white/50">Resources</p>
              </div>
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-center">
                <p className="text-lg font-bold text-yellow-300">{certificates.length}</p>
                <p className="text-xs text-white/50">Certificates</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 w-fit">
        {[
          { key: "all", label: `All (${allItems.length})` },
          { key: "resources", label: `Resources (${resources.length})` },
          { key: "certificates", label: `Certificates (${certificates.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.key ? "bg-white text-[#0c1220]" : "text-white/60 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={72} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <File size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">
            {tab === "certificates"
              ? "No certificates earned yet — complete a course to earn one!"
              : "No downloadable resources available"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Certificates section header */}
          {tab === "all" && certificates.length > 0 && (
            <p className="text-sm font-semibold text-yellow-300 mb-1">Certificates</p>
          )}
          {tab === "all" && certificates.map((item, i) => <ResourceCard key={item.id} item={item} i={i} />)}

          {tab === "all" && resources.length > 0 && (
            <p className="text-sm font-semibold text-sky-300 mt-4 mb-1">Course Resources</p>
          )}
          {tab !== "certificates" && resources.map((item, i) => <ResourceCard key={item.id} item={item} i={i} />)}
          {tab === "certificates" && certificates.map((item, i) => <ResourceCard key={item.id} item={item} i={i} />)}
        </div>
      )}
    </div>
  );
};

export default DownloadCenter;
