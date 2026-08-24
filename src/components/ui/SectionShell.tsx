import React, { useEffect } from "react";

/**
 * SectionShell
 * Sticky left TOC + right content column, with smart in-page navigation.
 *
 * Senior Lead Review:
 * - Intercepts TOC clicks to prevent App-level router from showing "Page Not Found".
 * - Persists shareable deep links as: #<route>/<sectionId>.
 * - On mount or hashchange, auto-scrolls to the section if a sub-fragment exists.
 */
export default function SectionShell({
  toc,
  children,
  standard,
}: {
  toc: Array<{ id: string; label: string }>;
  children: React.ReactNode;
  standard?: React.ReactNode;
}) {
  // Parse the current hash into [route, section]
  const getHashParts = () => {
    const raw = window.location.hash.replace(/^#/, "");
    const [route = "", section = ""] = raw.split("/");
    return { route, section };
  };

  // On load & when hash changes externally, scroll to the section if present
  useEffect(() => {
    const scroll = () => {
      const { section } = getHashParts();
      if (section) {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    scroll();
    window.addEventListener("hashchange", scroll);
    return () => window.removeEventListener("hashchange", scroll);
  }, []);

  // Sidebar click handler: update hash to #<route>/<id> and scroll
  const onNavClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const { route } = getHashParts();
    const next = `#${route || "timer"}/${id}`; // default "timer" if route missing
    if (window.location.hash !== next) window.location.hash = next;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { route } = getHashParts(); // used to build hrefs for right-click/copy

  return (
    <div className="shell" style={{ padding: 20 }}>
      {/* Left: sticky in-page nav */}
      <nav
        className="side"
        aria-label="On this page"
        style={{ position: "sticky", top: 70 }}
      >
        <div className="label">On this page</div>
        <ul className="toc">
          {toc.map((t) => {
            const href = `#${route || "timer"}/${t.id}`;
            return (
              <li key={t.id}>
                <a href={href} onClick={onNavClick(t.id)}>
                  {t.label}
                </a>
              </li>
            );
          })}
        </ul>

        {standard && (
          <div className="callout" style={{ marginTop: 12 }}>
            <div className="label">SCC Standard</div>
            <div>{standard}</div>
          </div>
        )}
      </nav>

      {/* Right: main document area */}
      <article className="doc">{children}</article>
    </div>
  );
}
