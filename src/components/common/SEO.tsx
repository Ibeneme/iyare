import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  structuredData?: object;
}

const SITE_NAME = "Yare Height Learning Hub";
const DEFAULT_DESC =
  "Yare Height connects students and parents with qualified teachers for a world-class learning experience.";
const DEFAULT_IMAGE = "/logo.png";
const BASE_URL = "https://www.yareheight.com";

function setMeta(name: string, content: string, attr = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data: object) {
  const id = "structured-data-json-ld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  noIndex = false,
  structuredData,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = canonical
    ? `${BASE_URL}${canonical}`
    : `${BASE_URL}${window.location.pathname}`;
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;

  useEffect(() => {
    document.title = fullTitle;

    // Standard meta
    setMeta("description", description);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Canonical
    setLink("canonical", canonicalUrl);

    // Open Graph
    setMeta("og:type", ogType, "property");
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonicalUrl, "property");
    setMeta("og:image", imageUrl, "property");
    setMeta("og:site_name", SITE_NAME, "property");

    // Twitter Card
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", imageUrl);

    // Structured data
    if (structuredData) setJsonLd(structuredData);
  }, [fullTitle, description, canonicalUrl, imageUrl, ogType, noIndex, structuredData]);

  return null;
};

export default SEO;
