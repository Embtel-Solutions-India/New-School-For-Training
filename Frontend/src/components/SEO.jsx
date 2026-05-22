import { Helmet } from "react-helmet-async";

const SITE_NAME = "School For Training";
const DEFAULT_DESCRIPTION =
  "School For Training offers career-focused online courses, live classes, certifications, and practical projects for modern technology learners.";
const DEFAULT_KEYWORDS = [
  "School For Training",
  "online courses",
  "live classes",
  "technology training",
  "certification courses",
  "career learning",
];
const DEFAULT_IMAGE = "/images/sft_logo.png";

const getSiteUrl = () =>
  (
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://schoolfortraining.com")
  ).replace(/\/$/, "");

const absolutize = (value) => {
  if (!value) return `${getSiteUrl()}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${getSiteUrl()}${value.startsWith("/") ? value : `/${value}`}`;
};

export const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const truncate = (value = "", max = 155) => {
  const text = stripHtml(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}...`;
};

export const buildCanonical = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: getSiteUrl(),
  logo: absolutize(DEFAULT_IMAGE),
  sameAs: [],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: getSiteUrl(),
  potentialAction: {
    "@type": "SearchAction",
    target: `${getSiteUrl()}/courses?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const breadcrumbSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: buildCanonical(item.path),
  })),
});

export const faqSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  structuredData,
  noindex = false,
}) => {
  const pageTitle = title?.includes(SITE_NAME) ? title : `${title || SITE_NAME} | ${SITE_NAME}`;
  const metaDescription = truncate(description || DEFAULT_DESCRIPTION);
  const metaKeywords = Array.isArray(keywords) ? keywords.filter(Boolean).join(", ") : keywords;
  const canonicalUrl = buildCanonical(canonical);
  const imageUrl = absolutize(image || DEFAULT_IMAGE);
  const schemas = Array.isArray(structuredData)
    ? structuredData.filter(Boolean)
    : structuredData
      ? [structuredData]
      : [];

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      {metaKeywords && <meta name="keywords" content={metaKeywords} />}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {import.meta.env.VITE_GOOGLE_SITE_VERIFICATION && (
        <meta
          name="google-site-verification"
          content={import.meta.env.VITE_GOOGLE_SITE_VERIFICATION}
        />
      )}

      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
