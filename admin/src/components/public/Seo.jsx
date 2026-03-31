import { useEffect } from "react";

export default function Seo({ title, description, schema }) {
  useEffect(() => {
    document.title = title;
    const pageUrl = window.location.href;
    const imageUrl = `${window.location.origin}/favicon.svg`;

    const ensureMeta = (selectorType, key) => {
      const selector =
        selectorType === "property"
          ? `meta[property="${key}"]`
          : `meta[name="${key}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(selectorType, key);
        document.head.appendChild(el);
      }
      return el;
    };

    ensureMeta("name", "description").setAttribute(
      "content",
      description || "",
    );
    ensureMeta("property", "og:title").setAttribute(
      "content",
      title || "NiviDoc",
    );
    ensureMeta("property", "og:description").setAttribute(
      "content",
      description || "NiviDoc Healthcare Platform",
    );
    ensureMeta("property", "og:type").setAttribute("content", "website");
    ensureMeta("property", "og:url").setAttribute("content", pageUrl);
    ensureMeta("property", "og:image").setAttribute("content", imageUrl);
    ensureMeta("name", "twitter:card").setAttribute(
      "content",
      "summary_large_image",
    );
    ensureMeta("name", "twitter:title").setAttribute(
      "content",
      title || "NiviDoc",
    );
    ensureMeta("name", "twitter:description").setAttribute(
      "content",
      description || "NiviDoc Healthcare Platform",
    );
    ensureMeta("name", "twitter:image").setAttribute("content", imageUrl);

    let schemaEl = document.getElementById("nividoc-schema");
    if (!schemaEl) {
      schemaEl = document.createElement("script");
      schemaEl.id = "nividoc-schema";
      schemaEl.type = "application/ld+json";
      document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify(
      schema || {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        name: "NiviDoc",
        url: window.location.origin,
        description,
      },
    );
  }, [title, description, schema]);

  return null;
}
