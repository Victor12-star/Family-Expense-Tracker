// =====================================================================
// Layout — responsive app shell + accessible landmarks
// Desktop: top navbar. Mobile: top navbar + bottom nav.
// =====================================================================
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import BottomNav from "./BottomNav.jsx";
import ReminderAlarm from "./ReminderAlarm.jsx";

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <ReminderAlarm />
      {/* main-content is the target of the "Skip to content" link */}
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
