import Blog from "../models/Blog.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";

const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value = "", max = 155) => {
  const text = stripHtml(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}...`;
};

const urlEntry = ({ loc, lastmod, priority = "0.7", changefreq = "weekly" }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

export const getSitemap = asyncHandler(async (_req, res) => {
  const base = clientUrl();
  const staticPages = [
    { loc: `${base}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${base}/about`, priority: "0.8" },
    { loc: `${base}/courses`, priority: "0.9", changefreq: "daily" },
    { loc: `${base}/blog`, priority: "0.8", changefreq: "daily" },
    { loc: `${base}/contact`, priority: "0.7" },
    { loc: `${base}/pricing`, priority: "0.7" },
    { loc: `${base}/features`, priority: "0.7" },
    { loc: `${base}/testimonials`, priority: "0.6" },
    { loc: `${base}/community`, priority: "0.6" },
    { loc: `${base}/careers`, priority: "0.5" },
    { loc: `${base}/help`, priority: "0.5" },
  ];

  const [courses, blogs] = await Promise.all([
    Course.find({ status: "published" }).select("slug _id updatedAt").lean(),
    Blog.find({ status: "published" }).select("slug updatedAt publishedAt").lean(),
  ]);

  const dynamicPages = [
    ...courses.map((course) => ({
      loc: `${base}/courses/${course.slug || course._id}`,
      lastmod: course.updatedAt,
      priority: "0.9",
    })),
    ...blogs.map((blog) => ({
      loc: `${base}/blog/${blog.slug}`,
      lastmod: blog.updatedAt || blog.publishedAt,
      priority: "0.8",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...dynamicPages].map(urlEntry).join("")}
</urlset>`;

  res.type("application/xml").send(xml);
});

export const getMetaBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const courseLookup = mongoose.Types.ObjectId.isValid(slug)
    ? { $or: [{ slug }, { _id: slug }] }
    : { slug };

  const [course, blog] = await Promise.all([
    Course.findOne({ ...courseLookup, status: "published" })
      .select("title slug description category tags thumbnail averageRating reviewCount updatedAt")
      .lean(),
    Blog.findOne({ slug, status: "published" })
      .select("title slug shortDescription subtitle content category tags featuredImage readTime updatedAt publishedAt")
      .lean(),
  ]);

  if (course) {
    return res.json({
      success: true,
      type: "course",
      meta: {
        title: `${course.title} Course | School For Training`,
        description: truncate(course.description || `${course.title} course at School For Training`),
        keywords: [course.title, course.category, ...(course.tags || []), "online course", "certification"].filter(Boolean),
        canonical: `${clientUrl()}/courses/${course.slug || course._id}`,
        image: course.thumbnail || "/images/Courses1.png",
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: truncate(course.description, 300),
          provider: { "@type": "Organization", name: "School For Training" },
          aggregateRating:
            course.averageRating > 0 && course.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: course.averageRating,
                  reviewCount: course.reviewCount,
                }
              : undefined,
        },
      },
    });
  }

  if (blog) {
    return res.json({
      success: true,
      type: "blog",
      meta: {
        title: `${blog.title} | School For Training`,
        description: truncate(blog.shortDescription || blog.subtitle || blog.content),
        keywords: [blog.title, blog.category, ...(blog.tags || []), "technology blog"].filter(Boolean),
        canonical: `${clientUrl()}/blog/${blog.slug}`,
        image: blog.featuredImage || "/images/Tech.jpg",
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: blog.title,
          description: truncate(blog.shortDescription || blog.subtitle || blog.content),
          datePublished: blog.publishedAt || blog.updatedAt,
          publisher: { "@type": "Organization", name: "School For Training" },
        },
      },
    });
  }

  res.status(404).json({ success: false, message: "SEO metadata not found" });
});
