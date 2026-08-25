// =====================================================================
// ErrorBoundary — catches unexpected errors so the app never goes blank
// or silently disconnects. If something throws, the user sees a friendly
// screen with a "Reload" button instead of losing their session.
// =====================================================================
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // React calls this when a child component throws during render.
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Log the error for debugging (optional — kept quiet by default).
  componentDidCatch(error) {
    console.error("App error:", error);
  }

  // Let the user recover without losing their login/family (which now
  // auto-restores on reload).
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrap}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.h1}>Something went wrong</h1>
            <p style={styles.p}>
              The app hit an unexpected error. Your account and family are safe — just reload to continue.
            </p>
            <button type="button" onClick={this.handleReload} style={styles.btn}>
              🔄 Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Inline styles (kept here so the error screen works even if CSS fails to load).
const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f1a3a",
    color: "#eef3ff",
    fontFamily: "Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    padding: 20,
  },
  card: {
    background: "#172554",
    border: "1px solid rgba(148,197,255,.2)",
    borderRadius: 20,
    padding: "32px 28px",
    textAlign: "center",
    maxWidth: 420,
    boxShadow: "0 20px 50px rgba(0,0,0,.4)",
  },
  icon: { fontSize: 44, marginBottom: 8 },
  h1: { fontSize: 22, margin: "0 0 8px" },
  p: { fontSize: 14, color: "#9fb0d0", margin: "0 0 20px", lineHeight: 1.5 },
  btn: {
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 700,
    padding: "12px 22px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    background: "linear-gradient(135deg,#38bdf8,#818cf8)",
    color: "#fff",
  },
};