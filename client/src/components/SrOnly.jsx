// =====================================================================
// SrOnly — visually hides text but keeps it readable by screen readers.
// Use for labels, instructions, or descriptive text that should be
// announced but not shown visually.
// =====================================================================
export default function SrOnly({ children }) {
  return <span className="sr-only">{children}</span>;
}
