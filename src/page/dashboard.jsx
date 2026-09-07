import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import UploadSection from "../components/UploadSection";
import { apiRequest } from "../api";
import { HISTORY_LIMIT, RECENT_MATCHES_SHOWN } from "../config";
import { SCORE_TRACK_COLOR, scoreFromMatch, scoreTone } from "../utils/score";

function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const openUploadCenter = () => {
    const uploadCenter = document.getElementById("upload-center");
    uploadCenter?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => uploadCenter?.querySelector('[role="button"]')?.focus(), 500);
  };

  useEffect(() => {
    const openFromSidebar = () => {
      window.sessionStorage.removeItem("openResumeUpload");
      openUploadCenter();
    };
    window.addEventListener("openResumeUpload", openFromSidebar);
    if (window.sessionStorage.getItem("openResumeUpload") === "true") {
      window.requestAnimationFrame(openFromSidebar);
    }
    return () => window.removeEventListener("openResumeUpload", openFromSidebar);
  }, []);

  // Load analysis history from the backend
  useEffect(() => {
    let cancelled = false;
    const loadMatches = async () => {
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        const data = await apiRequest(`/matches?limit=${HISTORY_LIMIT}`, token);
        if (!cancelled) setRecentMatches(data || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Unable to load match history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMatches();
    window.addEventListener("resumeMatchUpdated", loadMatches);
    return () => {
      cancelled = true;
      window.removeEventListener("resumeMatchUpdated", loadMatches);
    };
  }, [getToken]);

  const deleteMatch = async (id, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Delete this match from your history? This cannot be undone.")) return;
    try {
      const token = await getToken();
      await apiRequest(`/matches/${id}`, token, { method: "DELETE" });
      setRecentMatches((current) => current.filter((match) => match.id !== id));
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this match.");
    }
  };

  const resumesAnalyzed = recentMatches.length;
  const scores = recentMatches.map(scoreFromMatch).filter((score) => score > 0);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const bestMatch = bestScore > 0 ? recentMatches.find((match) => scoreFromMatch(match) === bestScore) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div className="animate-rise">
          <p className="text-sm font-semibold text-brand-600">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-ink-500">
            Upload a resume and a job description to see exactly where you stand — scored,
            gap-analyzed, and ready to apply.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => document.getElementById("recent-matches")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-card transition hover:bg-line-soft"
          >
            View History
          </button>

          <button
            type="button"
            onClick={openUploadCenter}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:brightness-110 active:scale-[.99]"
          >
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            New Match
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          icon="description"
          label="Resumes Analyzed"
          value={loading ? "—" : resumesAnalyzed}
          hint="All time"
          delay={0}
        />
        <Stat
          icon="monitoring"
          label="Average Match"
          value={averageScore > 0 ? `${averageScore}%` : "—"}
          hint={scores.length > 0 ? `Across ${scores.length} ${scores.length === 1 ? "analysis" : "analyses"}` : "No scores yet"}
          delay={70}
        />
        <Stat
          icon="workspace_premium"
          label="Best Match"
          value={bestScore > 0 ? `${bestScore}%` : "—"}
          hint={bestMatch?.jobRole || "Your strongest fit so far"}
          delay={140}
          featured
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">

        {/* Upload */}
        <section id="upload-center" className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Upload Center</h2>
            <p className="mt-1 text-sm text-ink-500">Resume as PDF, job description as text or a document.</p>
          </div>
          <UploadSection embedded stayOnPage />
        </section>

        {/* Recent Matches */}
        <section id="recent-matches" className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Recent Matches</h2>
              <p className="mt-1 text-sm text-ink-500">Your latest analyses.</p>
            </div>
            {recentMatches.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                {recentMatches.length}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 border-b border-line p-4 last:border-0">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-line-soft" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-line-soft" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-line-soft" />
                  </div>
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-line-soft" />
                </div>
              ))
            ) : error ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-bad-600">error</span>
                <p className="mt-2 text-sm text-bad-600">{error}</p>
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <span className="material-symbols-outlined text-[28px]">analytics</span>
                </span>
                <p className="mt-4 font-semibold text-ink">No matches yet</p>
                <p className="mx-auto mt-1.5 max-w-[15rem] text-sm text-ink-500">
                  Upload a resume to generate your first match report.
                </p>
                <button
                  type="button"
                  onClick={openUploadCenter}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:brightness-110"
                >
                  <span className="material-symbols-outlined text-[20px]">upload</span>
                  Upload Resume
                </button>
              </div>
            ) : (
              recentMatches.slice(0, RECENT_MATCHES_SHOWN).map((match) => (
                <a
                  key={match.id}
                  href={`#recent-matches?id=${match.id}`}
                  className="group flex items-center gap-3 border-b border-line p-4 transition last:border-0 hover:bg-line-soft"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink">
                      {match.jobRole || match.resumeName || "Resume"}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {match.companyName ? `${match.companyName} · ` : ""}{match.resumeName || "Resume"}
                    </p>
                    <p className="mt-1.5 truncate text-[11px] text-ink-400">{match.createdAt || "Recently"}</p>
                  </div>

                  <Score score={scoreFromMatch(match)} />

                  <button
                    type="button"
                    onClick={(event) => deleteMatch(match.id, event)}
                    aria-label="Delete match"
                    className="shrink-0 rounded-lg p-2 text-ink-400 opacity-0 transition hover:bg-bad-50 hover:text-bad-600 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </a>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* --------------------------------
   Statistics Card
-------------------------------- */

function Stat({ icon, label, value, hint, featured, delay = 0 }) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-rise rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
        featured
          ? "border-brand-700 bg-gradient-to-br from-brand-600 to-brand-900 text-white shadow-brand"
          : "border-line bg-white shadow-card hover:shadow-lift"
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            featured ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      </div>

      <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[.12em] ${featured ? "text-brand-200" : "text-ink-400"}`}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && (
        <p className={`mt-1 truncate text-xs ${featured ? "text-brand-200" : "text-ink-500"}`}>{hint}</p>
      )}
    </div>
  );
}

/* --------------------------------
   Score Ring
-------------------------------- */

function Score({ score }) {
  const { color } = scoreTone(score);

  return (
    <div
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${score}%, ${SCORE_TRACK_COLOR} 0)` }}
    >
      <span
        className="grid h-[34px] w-[34px] place-items-center rounded-full bg-white text-[11px] font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export default Dashboard;
