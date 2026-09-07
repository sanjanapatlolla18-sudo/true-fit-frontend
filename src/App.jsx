import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import Sidebar from "./components/Sidebar";
import MatchReportPage from "./components/MatchReportPage";
import InterviewPrepPage from "./components/InterviewPrepPage";
import ExportReportPage from "./components/ExportReportPage";
import Dashboard from "./page/dashboard";
import CoverLetterPage from "./page/CoverLetterPage";
import { getActiveMatch } from "./utils/activeMatch";
import { APP_NAME } from "./config";
import { cssVar } from "./theme";
import logo from "./assets/truefit_logo.svg";

// Clerk needs literal colour values, so read them back from the same CSS custom
// properties the rest of the UI is themed with instead of restating hexes here.
function clerkAppearance() {
  return {
    variables: {
      colorPrimary: cssVar("--color-brand-600"),
      colorText: cssVar("--color-ink"),
      colorTextSecondary: cssVar("--color-ink-500"),
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "0.75rem",
    },
    elements: {
      rootBox: "w-full",
      card: "shadow-lift border border-line rounded-2xl",
    },
  };
}

const highlights = [
  ["target", "Scored against the real job description", "No keyword guesswork — an AI match score with the reasoning behind it."],
  ["school", "Skill gaps, spelled out", "See exactly what's missing and what to learn next."],
  ["draft", "Cover letter, ready to send", "Tailored to the role, editable, exports to Word."],
];

function App() {
  const [page, setPage] = useState(window.location.hash || "#dashboard");

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#dashboard");
    const updatePage = () => setPage(window.location.hash || "#dashboard");
    window.addEventListener("hashchange", updatePage);
    return () => window.removeEventListener("hashchange", updatePage);
  }, []);

  const [base, query] = page.split("?");
  const matchId = new URLSearchParams(query).get("id");

  const isExport = base === "#export-report";
  const content = base === "#interview-prep" ? <InterviewPrepPage />
      : base === "#export-report" ? <ExportReportPage analysis={getActiveMatch()} />
        : base === "#recent-matches" ? <MatchReportPage matchId={matchId} />
          : base === "#cover-letter" ? <CoverLetterPage />
            : <Dashboard />;

  return <>
    <SignedOut>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-5 py-12">
        <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-brand-300 to-brand-600 opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-brand-400 to-brand-900 opacity-20 blur-3xl" />

        <div className="relative grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_minmax(400px,.95fr)]">
          <div className="animate-rise">
            <img src={logo} alt={APP_NAME} className="mx-auto h-auto w-48 object-contain lg:mx-0 lg:w-56" />

            <h1 className="mt-8 text-center text-4xl font-extrabold leading-[1.1] tracking-tight text-ink lg:text-left lg:text-5xl">
              Know your <span className="bg-gradient-to-r from-brand-500 to-brand-800 bg-clip-text text-transparent">true fit</span>
              <br className="hidden lg:block" /> before you apply.
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-center text-lg leading-relaxed text-ink-500 lg:mx-0 lg:text-left">
              Upload a resume, drop in a job description, and get an honest read on where
              you stand — plus everything you need to close the gap.
            </p>

            <ul className="mt-9 hidden space-y-5 lg:block">
              {highlights.map(([icon, title, copy]) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-brand-600 shadow-card">
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex animate-rise justify-center [animation-delay:120ms]">
            <SignIn routing="virtual" appearance={clerkAppearance()} />
          </div>
        </div>
      </div>
    </SignedOut>

    <SignedIn>
      <div className="min-h-screen bg-canvas text-ink">
        {!isExport && <Sidebar page={base} />}

        {!isExport && (
          <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-white/85 px-5 backdrop-blur-md md:hidden">
            <img src={logo} alt={APP_NAME} className="h-auto w-28 object-contain" />
            <span className="material-symbols-outlined text-ink-500">menu</span>
          </header>
        )}

        <main className={isExport ? "min-h-screen" : "min-h-screen px-5 pb-28 pt-24 md:ml-64 md:px-10 md:pb-24 md:pt-10"}>
          {content}
        </main>

        {!isExport && (
          <footer className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-line bg-white/85 px-5 py-3.5 text-xs text-ink-500 backdrop-blur-md md:left-64 md:px-10">
            <span className="font-semibold text-ink-700">{APP_NAME}</span>
            <div className="flex gap-5">
              <a className="transition hover:text-brand-600" href="#export-report">Export PDF</a>
              <a className="transition hover:text-brand-600" href="#interview-prep">Interview Prep</a>
            </div>
          </footer>
        )}
      </div>
    </SignedIn>
  </>;
}

export default App;
