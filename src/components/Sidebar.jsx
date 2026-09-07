import { UserButton, useUser } from "@clerk/clerk-react";
import { APP_NAME } from "../config";
import logo from "../assets/truefit_logo.svg";

const links = [
  ["#dashboard", "space_dashboard", "Dashboard"],
  ["#recent-matches", "insights", "Match Report"],
  ["#cover-letter", "draft", "Cover Letter"],
  ["#interview-prep", "forum", "Interview Prep"],
];

function Sidebar({ page }) {
  const { user } = useUser();

  const openUploadCenter = (event) => {
    event.preventDefault();
    window.sessionStorage.setItem("openResumeUpload", "true");
    if (window.location.hash !== "#dashboard") window.location.hash = "#dashboard";
    window.setTimeout(() => window.dispatchEvent(new Event("openResumeUpload")), 100);
  };

  return (
    <nav className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-white md:flex">
      <div className="px-6 pb-5 pt-6">
        <img src={logo} alt={APP_NAME} className="h-auto w-40 object-contain" />
      </div>

      <div className="px-4">
        <a
          href="#dashboard"
          onClick={openUploadCenter}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 py-3 text-sm font-semibold text-white shadow-brand transition hover:brightness-110 active:scale-[.99]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Analysis
        </a>
      </div>

      <p className="mt-7 px-6 pb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-ink-400">
        Workspace
      </p>

      <div className="flex flex-1 flex-col gap-1 px-3">
        {links.map(([href, icon, label]) => {
          const active = page === href || (href === "#dashboard" && page === "#upload");
          return (
            <a
              key={label}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-line-soft hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />
              )}
              <span
                className={`material-symbols-outlined text-[20px] ${
                  active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-500"
                }`}
              >
                {icon}
              </span>
              {label}
            </a>
          );
        })}
      </div>

      <div className="m-3 flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
        <UserButton afterSignOutUrl="/" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {user?.firstName || user?.username || "Account"}
          </p>
          <p className="truncate text-xs text-ink-500">
            {user?.primaryEmailAddress?.emailAddress || "Signed in"}
          </p>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
