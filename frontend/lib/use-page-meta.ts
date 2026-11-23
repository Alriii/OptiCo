import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description?: string;
}

/**
 * Custom hook to dynamically manage unique page titles and meta descriptions
 * across client routes for SEO and browser tab accessibility.
 */
export function usePageMeta({ title, description }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = `${title} | OptiCo Optical Clinic`;
    document.title = fullTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", fullTitle);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", description);
    }
  }, [title, description]);
}
