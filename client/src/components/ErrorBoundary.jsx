// Application-level recovery boundary. Unexpected rendering failures should
// show a safe recovery screen instead of exposing technical details or leaving
// the user with a blank page.
import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, details) {
    // Production observability can replace this with a privacy-safe reporting
    // provider. Never include tokens, financial form contents, or chat data.
    if (import.meta.env.DEV) console.error("Application render failure", error, details);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="fatal-error" role="alert">
        <section className="fatal-error-card">
          <p className="eyebrow">Recovery</p>
          <h1>Something went wrong</h1>
          <p>Your saved information is still protected. Reload the application to continue.</p>
          <button className="btn primary" type="button" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
