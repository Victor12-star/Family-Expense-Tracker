import { Link } from "react-router-dom";

const SUPPORT_EMAIL = String(import.meta.env.VITE_SUPPORT_EMAIL || "").trim();
const EFFECTIVE_DATE = "30 August 2026";

function LegalShell({ title, intro, children }) {
  return (
    <main className="legal-page-shell">
      <article className="legal-page-card">
        <Link className="legal-brand" to="/login" aria-label="Family Expense Tracker sign in">
          <img src="/brand-mark.png" alt="" />
          <span>Family Expense Tracker</span>
        </Link>
        <header>
          <p className="legal-eyebrow">Legal</p>
          <h1>{title}</h1>
          <p>{intro}</p>
          <small>Effective date: {EFFECTIVE_DATE}</small>
        </header>
        <div className="legal-page-copy">{children}</div>
        <footer className="legal-page-footer">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/account-deletion">Account deletion</Link>
          <Link to="/login">Sign in</Link>
        </footer>
      </article>
    </main>
  );
}

function ContactLine() {
  return SUPPORT_EMAIL ? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> : <span className="legal-contact-pending">Support contact pending publication</span>;
}

export function PrivacyPolicy() {
  return (
    <LegalShell title="Privacy Policy" intro="This policy explains how Family Expense Tracker handles information when you use the web or mobile application.">
      <section><h2>Information you provide</h2><p>We process your name, email address and password credentials to create and secure your account. We also process information you enter into the service, including expenses, budgets, reminders, shopping items, family membership, invitation codes, chat messages, voice recordings and uploaded images or files.</p></section>
      <section><h2>How information is used</h2><p>We use this information to authenticate you, provide Single and Family features, synchronize information across your devices, deliver reminders, support family collaboration, prevent abuse, troubleshoot errors and maintain the service.</p></section>
      <section><h2>Family sharing</h2><p>Information added to a Family workspace may be visible to other members of that family. Private or Single-mode information is not intended to be shared with family members. Only join families and upload content you trust the other members to access.</p></section>
      <section><h2>Service providers</h2><p>The application uses hosting, server and database providers to operate the service. These providers process information only as needed to host the interface, run the API, store application data, deliver files and maintain security. The current deployment uses Vercel for the web interface and external server and PostgreSQL database infrastructure for application data.</p></section>
      <section><h2>Device permissions</h2><p>Microphone, notification, camera or file permissions are requested only when you use the related feature. You can deny or withdraw device permissions through your browser or Android settings, although the related feature may stop working.</p></section>
      <section><h2>Retention and deletion</h2><p>We retain account information while your account remains active and as reasonably required to operate and secure the service. You can permanently delete your account from Account settings. You can also use the public account-deletion instructions linked below.</p></section>
      <section><h2>Security</h2><p>We use reasonable technical safeguards including encrypted HTTPS connections, hashed passwords, authenticated API access and rotating session tokens. No internet service can guarantee absolute security.</p></section>
      <section><h2>Children</h2><p>The service is not directed to children under 13. A higher minimum age may apply in your country. A parent or guardian who believes a child provided personal information should contact us.</p></section>
      <section><h2>Your choices and rights</h2><p>Depending on your location, you may have rights to access, correct, export, restrict or delete personal information. Contact us to make a privacy request.</p></section>
      <section><h2>Contact</h2><p>Privacy and data requests: <ContactLine /></p></section>
    </LegalShell>
  );
}

export function TermsOfUse() {
  return (
    <LegalShell title="Terms of Use" intro="These terms govern access to Family Expense Tracker.">
      <section><h2>Using the service</h2><p>You may use the service only lawfully and must provide accurate registration information. You are responsible for protecting your password and for activity performed through your account.</p></section>
      <section><h2>Financial information</h2><p>Family Expense Tracker is an organizational tool, not a bank, accountant, financial adviser or payment service. Calculations, reminders and summaries may contain errors or be delayed. Verify important financial information independently.</p></section>
      <section><h2>Your content</h2><p>You retain ownership of content you add. You grant the service the limited permission needed to store, process and display that content to you and, for Family content, to authorized family members.</p></section>
      <section><h2>Acceptable use</h2><p>Do not use the service to break the law, harm others, distribute malware, gain unauthorized access, overload the service or upload content you do not have permission to use.</p></section>
      <section><h2>Availability and changes</h2><p>Features may be modified, suspended or discontinued. We aim to operate the service reliably but do not promise uninterrupted or error-free availability.</p></section>
      <section><h2>Account suspension and deletion</h2><p>You may delete your account at any time. Access may be restricted when reasonably necessary to protect users, the service or comply with legal obligations.</p></section>
      <section><h2>Liability</h2><p>To the extent permitted by applicable law, the service is provided without guarantees beyond those that cannot legally be excluded. We are not responsible for decisions made solely from app calculations or reminders.</p></section>
      <section><h2>Changes to these terms</h2><p>Material changes will be communicated through the application or another reasonable method. Continuing to use the service after updated terms take effect means you accept them, where permitted by law.</p></section>
      <section><h2>Contact</h2><p>Questions about these terms: <ContactLine /></p></section>
    </LegalShell>
  );
}

export function AccountDeletion() {
  return (
    <LegalShell title="Delete your account" intro="You can permanently delete your Family Expense Tracker account and associated information.">
      <section><h2>Delete from the app</h2><ol><li>Sign in to Family Expense Tracker.</li><li>Open <strong>Settings</strong>, then <strong>Account</strong>.</li><li>Select <strong>Delete account</strong>.</li><li>Confirm your password and approve the deletion.</li></ol><p><Link className="btn primary small legal-action" to="/settings">Open Account settings</Link></p></section>
      <section><h2>If you cannot sign in</h2><p>Send an account-deletion request from the email address registered to your account. Include the words “Delete my Family Expense Tracker account.” We may request reasonable verification before deletion.</p>{SUPPORT_EMAIL ? <a className="btn secondary small legal-action" href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20Family%20Expense%20Tracker%20account`}>Email deletion request</a> : <p className="notice error">The external deletion contact will be added before public release.</p>}</section>
      <section><h2>What is deleted</h2><p>Your profile, active sessions and data directly associated with your account are permanently removed. If you own a family with other members, ownership transfers to another member so their shared workspace can continue. A family with no other members is deleted.</p></section>
      <section><h2>Processing time</h2><p>In-app deletion begins immediately. A manually submitted request will be processed after account ownership is verified and within the period required by applicable law.</p></section>
    </LegalShell>
  );
}
