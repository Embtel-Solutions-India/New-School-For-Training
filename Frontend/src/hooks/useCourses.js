import { useEffect, useState } from "react";
import courseApi from "../services/courseApi";

export const useCourses = ({ search, category, sort, page, limit } = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    courseApi
      .getPublicCourses({ search, category, sort, page, limit })
      .then(({ data }) => {
        if (cancelled) return;
        setCourses(data.courses || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load courses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [search, category, sort, page, limit]);

  return { courses, loading, error, total, pages };
};

export const useCourseDetail = (courseId) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    courseApi
      .getPublicCourseById(courseId)
      .then(({ data }) => setCourse(data.course))
      .catch(() => setError("Course not found"))
      .finally(() => setLoading(false));
  }, [courseId]);

  return { course, loading, error };
};
