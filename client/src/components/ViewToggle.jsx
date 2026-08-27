export default function ViewToggle({ view, setView }) {
  return (
    <div className="view-toggle" role="group" aria-label="Expense workspace">
      <button
        type="button"
        className={`view-btn ${view === "family" ? "active" : ""}`}
        onClick={() => setView("family")}
        aria-pressed={view === "family"}
      >
        Family
      </button>
      <button
        type="button"
        className={`view-btn ${view === "single" ? "active" : ""}`}
        onClick={() => setView("single")}
        aria-pressed={view === "single"}
      >
        Single
      </button>
    </div>
  );
}
