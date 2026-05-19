import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button, Pagination, Skeleton, TextField } from "@mui/material";
import { Bookmark, BookmarkX, BookOpen, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [removing, setRemoving] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await studentApi.getBookmarks({ page, limit: 12, search });
      setBookmarks(data.bookmarks || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch { toast.error("Failed to load bookmarks"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleRemove = async (id) => {
    try {
      setRemoving(id);
      await studentApi.removeBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
      setTotal((c) => Math.max(0, c - 1));
      toast.success("Bookmark removed");
    } catch { toast.error("Failed to remove bookmark"); }
    finally { setRemoving(null); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Bookmarks</h1>
            <p className="mt-2 text-white/60">Your saved lessons and course content</p>
          </div>
          {total > 0 && (
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-sky-300">{total}</p>
              <p className="text-xs text-white/50">Saved Items</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <TextField
          fullWidth
          size="small"
          placeholder="Search bookmarks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <Search size={16} className="mr-2 text-white/40 shrink-0" />,
              sx: { color: "white", borderRadius: 3 },
            },
          }}
          sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.12)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" } } }}
        />
        <Button type="submit" variant="contained" sx={{ borderRadius: 2, px: 3, background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", whiteSpace: "nowrap" }}>
          Search
        </Button>
        {search && (
          <Button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} variant="outlined"
            sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={140} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <Bookmark size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">{search ? "No bookmarks match your search" : "No bookmarks yet"}</p>
          {search && (
            <button onClick={() => { setSearch(""); setSearchInput(""); }} className="mt-3 text-sm text-sky-400 hover:text-sky-300 transition">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b, i) => (
            <motion.div key={b._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-[20px] ${glass} p-5 flex flex-col gap-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/20">
                    <BookOpen size={16} className="text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{b.lessonTitle || "Lesson"}</p>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{b.courseTitle || b.course?.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(b._id)}
                  disabled={removing === b._id}
                  className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50">
                  <Trash2 size={14} />
                </button>
              </div>

              {b.note && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/50 line-clamp-3">{b.note}</p>
                </div>
              )}

              <p className="text-xs text-white/25 mt-auto">
                Saved {new Date(b.createdAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
