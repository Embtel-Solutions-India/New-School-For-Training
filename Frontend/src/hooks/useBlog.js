import { useEffect, useState } from "react";
import blogApi from "../services/blogApi";

export const usePublicBlogs = ({ search, category, page = 1, limit = 10 } = {}) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    blogApi
      .getPublicBlogs({ search, category, page, limit })
      .then(({ data }) => {
        if (!cancelled) {
          setBlogs(data.blogs || []);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load blogs");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, category, page, limit]);

  return { blogs, loading, error, total, pages };
};

export const useBlogDetail = (slug) => {
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    blogApi
      .getBlogBySlug(slug)
      .then(({ data }) => {
        setBlog(data.blog);
        setRelated(data.related || []);
      })
      .catch(() => setError("Blog not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  return { blog, related, loading, error };
};
