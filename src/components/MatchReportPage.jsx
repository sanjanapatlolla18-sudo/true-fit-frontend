import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getActiveMatch, setActiveMatch } from "../utils/activeMatch";
import { apiRequest } from "../api";
import { SCORE_TRACK_COLOR, scoreFromText, scoreTone } from "../utils/score";
import { formatCreatedAt } from "../utils/date";

function cleanText(text = "") {
  const lines = String(text).replace(/\*+/g, "").replace(/^\s*#{1,6}\s*/gm, "").trim().split("\n");
  const tableRows = lines
    .filter((line) => line.includes("|"))
    .map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 4 && !cells.every((cell) => /^:?-{2,}:?$/.test(cell)));

  if (tableRows.length < 2) {
    const cleaned = lines.filter((line) => !/^\s*\|?\s*:?-{2,}/.test(line)).join("\n").trim();
    return /^user safety\s*:\s*safe\.?$/i.test(cleaned) ? "" : cleaned;
  }

  const [header, ...rows] = tableRows;
  const positiveTitle = header[1] || "Positive Points";
  const negativeTitle = header[3] || "Negative Points";
  const positive = rows.map((row) => row[1]).filter(Boolean).map((item, index) => `${index + 1}. ${item}`);
  const negative = rows.map((row) => row[3]).filter(Boolean).map((item, index) => `${index + 1}. ${item}`);
  const nonTableLines = lines.filter((line) => !line.includes("|") && !/^\s*\|?\s*:?-{2,}/.test(line));

  return [nonTableLines.join("\n").trim(), positiveTitle, positive.join("\n"), negativeTitle, negative.join("\n")]
    .filter(Boolean)
    .join("\n\n");
}

function isReportHeading(line) {
  const value = line.trim();
  return value.length > 0 && value.length < 100 && !/^(?:[-•*]|\d+[.)])\s/.test(value) && (value.endsWith(":") || /^(?:match score|positive points|negative points|job description red flags|red flags|overall assessment|skill gap analysis|overall match|priority|why it matters|recommended learning topics|estimated learning time|strengths|weaknesses|areas for improvement|recommendations|missing skill)/i.test(value));
}

function EmptyAnalysis() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white px-6 py-14 text-center shadow-card">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <span className="material-symbols-outlined text-[32px]">analytics</span>
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">No match analysis yet</h1>
      <p className="mx-auto mt-2 max-w-sm text-ink-500">
        Upload a resume and a job description to generate your personalized report.
      </p>
      <a
        href="#dashboard"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-brand transition hover:brightness-110"
      >
        <span className="material-symbols-outlined text-[20px]">upload</span>
        Upload Resume
      </a>
    </div>
  );
}

function ReportContent({ text }) {
  const lines = cleanText(text).split("\n");

  return (
    <div className="space-y-1.5 text-[15px] leading-7 text-ink-700">
      {lines.map((line, index) => {
        const value = line.trim();
        if (!value) return <div key={index} className="h-2" />;

        if (isReportHeading(value)) {
          return (
            <h3 key={index} className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.12em] text-ink-400">
              {value.replace(/:$/, "")}
            </h3>
          );
        }

        const bullet = value.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
        if (bullet) {
          return (
            <div key={index} className="flex gap-3">
              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <p className="flex-1">{bullet[1]}</p>
            </div>
          );
        }

        return <p key={index} className="whitespace-pre-wrap">{value}</p>;
      })}
    </div>
  );
}

function TextCard({ title, icon, tone = "brand", children }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    warn: "bg-warn-50 text-warn-600",
  };

  return (
    <section className="animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <h2 className="flex items-center gap-3 border-b border-line px-6 py-4 text-base font-bold tracking-tight">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        {title}
      </h2>
      <div className="px-6 py-5">
        <ReportContent text={children} />
      </div>
    </section>
  );
}

function ScoreRing({ score }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const { color } = scoreTone(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative mx-auto grid h-44 w-44 place-items-center">
      <svg viewBox="0 0 128 128" className="h-44 w-44 -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke={SCORE_TRACK_COLOR} strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-extrabold tracking-tight" style={{ color }}>{shown}%</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.12em] text-ink-400">Match Score</p>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="px-2 py-3">
      <p className="text-xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-ink-500">{label}</p>
    </div>
  );
}

function MatchReportPage({ matchId }) {
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState(() => (matchId ? null : getActiveMatch()));
  const [loading, setLoading] = useState(Boolean(matchId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!matchId) {
      setAnalysis(getActiveMatch());
      setLoading(false);
      setError("");
      return undefined;
    }
    const active = getActiveMatch();
    if (active?.id === matchId) {
      setAnalysis(active);
      setLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const token = await getToken();
        const data = await apiRequest(`/matches/${matchId}`, token);
        if (cancelled) return;
        setActiveMatch(data);
        setAnalysis(data);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Unable to load this match.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, getToken]);

  useEffect(() => {
    const loadActive = () => {
      if (!matchId) setAnalysis(getActiveMatch());
    };
    window.addEventListener("resumeMatchUpdated", loadActive);
    return () => window.removeEventListener("resumeMatchUpdated", loadActive);
  }, [matchId]);

  const handleDelete = async () => {
    if (!analysis?.id) return;
    if (!window.confirm("Delete this match from your history? This cannot be undone.")) return;
    try {
      const token = await getToken();
      await apiRequest(`/matches/${analysis.id}`, token, { method: "DELETE" });
      window.location.hash = "#dashboard";
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this match.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white px-6 py-16 text-center shadow-card">
        <span className="material-symbols-outlined animate-spin text-4xl text-brand-600">progress_activity</span>
        <p className="mt-4 font-medium text-ink-500">Loading report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white px-6 py-14 text-center shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-bad-50 text-bad-600">
          <span className="material-symbols-outlined text-[28px]">error</span>
        </span>
        <p className="mt-4 font-semibold text-ink">{error}</p>
        <a
          href="#dashboard"
          className="mt-6 inline-flex rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-brand transition hover:brightness-110"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  if (!analysis) return <EmptyAnalysis />;

  const score = scoreFromText(analysis.match_analysis);
  const { label: scoreLabel, badge: toneClass } = scoreTone(score);
  const jdRedFlags = cleanText(analysis.jd_redflags);

  const gapLines = cleanText(analysis.skill_gap_analysis).split("\n");
  const gaps = gapLines.filter((line) => /^[-•\d]/.test(line.trim())).length;
  const actions = gapLines.filter((line) => /recommend|improve|learn|add|focus/i.test(line)).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <header className="animate-rise">
        <a href="#dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-brand-600">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Dashboard
        </a>

        <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                {scoreLabel}
              </span>
              <span className="text-xs text-ink-400">{formatCreatedAt(analysis.createdAt)}</span>
            </div>

            <h1 className="mt-3 truncate text-3xl font-extrabold tracking-tight md:text-4xl">
              {analysis.jobRole || "Match Analysis"}
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
              {analysis.companyName && (
                <>
                  <span className="inline-flex items-center gap-1 font-medium text-ink-700">
                    <span className="material-symbols-outlined text-[18px]">apartment</span>
                    {analysis.companyName}
                  </span>
                  <span className="text-ink-400">·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">description</span>
                {analysis.resumeName}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href="#cover-letter"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-card transition hover:bg-line-soft"
            >
              <span className="material-symbols-outlined text-[20px]">draft</span>
              Cover Letter
            </a>
            <a
              href="#export-report"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-card transition hover:bg-line-soft"
            >
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              Export PDF
            </a>
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete match"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink-400 shadow-card transition hover:bg-bad-50 hover:text-bad-600"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>
      </header>

      {/* Score + analysis */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="animate-rise self-start rounded-2xl border border-line bg-white p-6 shadow-card">
          <h2 className="text-base font-bold tracking-tight">Overall Match</h2>

          <div className="my-4">
            <ScoreRing score={score} />
          </div>

          <p className="text-sm leading-6 text-ink-500">
            Your resume matches <strong className="font-bold text-ink">{score}%</strong> of the target job
            criteria. Review the adjustments below to strengthen your application.
          </p>

          <div className="mt-5 grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-canvas text-center">
            <SummaryItem label="Match Score" value={`${score}%`} />
            <SummaryItem label="Skill Gaps" value={gaps} />
            <SummaryItem label="Actions" value={actions} />
          </div>
        </section>

        <div className="lg:col-span-2">
          <TextCard title="AI Match Analysis" icon="auto_awesome">
            {analysis.match_analysis || "No match analysis was returned."}
          </TextCard>
        </div>
      </div>

      <TextCard title="Skill Gap Analysis" icon="school">
        {analysis.skill_gap_analysis || "No skill-gap analysis was returned."}
      </TextCard>

      {jdRedFlags && (
        <TextCard title="Job Description Notes" icon="flag" tone="warn">
          {jdRedFlags}
        </TextCard>
      )}
    </div>
  );
}

export default MatchReportPage;
