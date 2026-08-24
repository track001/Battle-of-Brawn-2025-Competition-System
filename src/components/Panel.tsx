import React from "react";

/**
 * Panel
 * - Reusable card wrapper used across SOP pages.
 * - Handles an optional title (renders as <h3>) and optional right-side actions.
 * - Adds basic a11y (aria-labelledby) when a title is present.
 *
 * Usage:
 *  <Panel title="Where it lives">
 *    ...content...
 *  </Panel>
 *
 *  <Panel title="Run Options" right={<button className="btn tiny">Copy</button>}>
 *    ...content...
 *  </Panel>
 */

type PanelProps = {
  /** Heading shown at the top of the panel (renders as <h3>) */
  title?: React.ReactNode;
  /** Optional actions rendered on the right of the header row */
  right?: React.ReactNode;
  /** Panel body content */
  children: React.ReactNode;
  /** Optional id if you want to anchor-link to this panel */
  id?: string;
  /** Add extra classes if needed */
  className?: string;
  /** Change the root element if you need semantics (e.g., 'section') */
  as?: "div" | "section" | "article";
};

export default function Panel({
  title,
  right,
  children,
  id,
  className = "",
  as: Root = "div",
}: PanelProps) {
  // If we have a title, wire up aria-labelledby
  const headingId = title ? `${id ?? "panel"}-heading` : undefined;

  return (
    <Root
      id={id}
      className={`panel ${className}`}
      {...(headingId ? { "aria-labelledby": headingId } : {})}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {title ? (
            <h3 id={headingId} style={{ margin: 0 }}>
              {title}
            </h3>
          ) : (
            <div />
          )}
          {right ? <div>{right}</div> : null}
        </div>
      )}

      {children}
    </Root>
  );
}
