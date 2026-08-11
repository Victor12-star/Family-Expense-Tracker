// =====================================================================
// ViewToggle — switch between Family and Individual views
// =====================================================================
export default function ViewToggle({ view, setView }) {
  return (
    <div className="view-toggle" role="group" aria-label="View">
      <button
        type="button"
        className={`view-btn ${view === "family" ? "active" : ""}`}
        onClick={() => setView("family")}
      >
        Family
      </button>
      <button
        type="button"
        className={`view-btn ${view === "individual" ? "active" : ""}`}
        onClick={() => setView("individual")}
      >
        Individual
      </button>
    </div>
  );
}
