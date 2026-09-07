import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getActiveMatch, setActiveMatch } from "../utils/activeMatch";
import { apiRequest } from "../api";

function roleFrom(match) { return match?.jobRole || String(match?.jobDescription || "").match(/(?:job\s*title|position|role)\s*[:-]\s*([^\n,|]+)/i)?.[1]?.trim() || "Position"; }
function companyLocation(jobDescription = "") { return String(jobDescription).match(/(?:company\s*location|location|based\s+in)\s*[:-]\s*([^\n,|]+)/i)?.[1]?.trim() || ""; }
function cleanBody(text = "") { const value = String(text).replace(/\*+/g, "").replace(/^\s*#{1,6}\s*/gm, "").trim(); const greeting = value.match(/\bDear\s+(?:Hiring Manager|[A-Za-z .'-]+),/i); return greeting && greeting.index > 0 ? value.slice(greeting.index).trim() : value; }

function isUsableCompany(value) { return Boolean(value) && !/^(?:we|our|us|company|employer|not specified)$/i.test(String(value).trim()); }

function createEditableDocument(match, body) {
  const candidate = match?.candidate_details || {}; const role = roleFrom(match);
  const company = isUsableCompany(match?.companyName) ? match.companyName : "Company Name";
  const contact = [candidate.email, candidate.phone, candidate.location, ...(candidate.links || []).map((link) => link.replace(/^https?:\/\/(?:www\.)?/i, ""))].filter(Boolean).join("  |  ");
  const heading = `${candidate.name || "Applicant"}\n${candidate.title || role}${contact ? `\n${contact}` : ""}\n\n────────────────────────────────────────\n\n${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\n\nHiring Manager\n${company}${companyLocation(match?.jobDescription) ? `\n${companyLocation(match.jobDescription)}` : ""}\n\nSubject: Application for ${role}\n\n`;
  return body.startsWith("Applicant\n") || body.startsWith("Cover Letter\n") || body.includes("\nSubject: Application for ") ? body : `${heading}${cleanBody(body)}`;
}

function initialDocument(match) { return createEditableDocument(match, match?.edited_cover_letter || match?.cover_letter || match?.coverLetter || ""); }
function wordSafe(value = "") { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function CoverLetterPage() {
  const { getToken } = useAuth();
  const [match, setMatch] = useState(getActiveMatch);
  const [documentText, setDocumentText] = useState(() => initialDocument(getActiveMatch()));
  const [saved, setSaved] = useState(() => Boolean(getActiveMatch()?.edited_cover_letter));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = () => {
      const current = getActiveMatch();
      setMatch(current);
      setDocumentText(initialDocument(current));
      setSaved(Boolean(current?.edited_cover_letter));
    };
    window.addEventListener("resumeMatchUpdated", load);
    return () => window.removeEventListener("resumeMatchUpdated", load);
  }, []);

  const saveLetter = async () => {
    if (!documentText.trim() || !match?.id) return;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      await apiRequest(`/matches/${match.id}/cover-letter`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_letter: documentText.trim() }),
      });
      const updated = { ...match, edited_cover_letter: documentText.trim() };
      setActiveMatch(updated);
      setMatch(updated);
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to save your edits.");
    } finally {
      setSaving(false);
    }
  };

  const downloadLetter = () => { if (!documentText.trim()) return; const paragraphs = wordSafe(documentText.trim()).split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join(""); const html = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><style>@page{margin:1in}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#111}p{margin:0 0 14pt;white-space:pre-wrap}</style></head><body contenteditable="true">${paragraphs}</body></html>`; const url = URL.createObjectURL(new Blob([html], { type: "application/msword;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "cover-letter.doc"; link.click(); URL.revokeObjectURL(url); };

  const words = documentText.trim() ? documentText.trim().split(/\s+/).length : 0;

  const heading = (
    <header className="mb-7 animate-rise">
      <p className="text-sm font-semibold text-brand-600">APPLICATION DOCUMENT</p>
      <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl">Cover Letter</h1>
      <p className="mt-2 text-ink-500">
        {match?.jobRole
          ? <>Tailored for <strong className="font-semibold text-ink-700">{match.jobRole}</strong>{match.companyName ? ` at ${match.companyName}` : ""}. Edit anything before you send it.</>
          : "Review, edit, and download your personalized cover letter."}
      </p>
    </header>
  );

  if (!documentText.trim()) {
    return (
      <div className="mx-auto max-w-4xl">
        {heading}
        <section className="rounded-2xl border border-line bg-white px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <span className="material-symbols-outlined text-[28px]">draft</span>
          </span>
          <p className="mt-4 font-semibold text-ink">No cover letter yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">
            Your cover letter is written automatically when you analyze a resume against a job description.
          </p>
          <a
            href="#dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-brand transition hover:brightness-110"
          >
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            Create a Match
          </a>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {heading}

      <section className="animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-canvas px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <span className="material-symbols-outlined text-[20px] text-brand-600">edit_document</span>
            Editable draft
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-500">
            <span>{words} words</span>
            {saved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-50 px-2.5 py-1 font-bold text-ok-700">
                <span className="material-symbols-outlined text-[14px]">check</span>
                Saved
              </span>
            )}
          </div>
        </div>

        <div className="p-4 md:p-7">
          <textarea
            value={documentText}
            onChange={(event) => { setDocumentText(event.target.value); setSaved(false); }}
            aria-label="Editable cover letter document"
            style={{ height: "min(70vh, 740px)", minHeight: "540px" }}
            className="w-full resize-y overflow-y-auto rounded-xl border border-line bg-white p-6 font-[Calibri,Arial,sans-serif] text-[15px] leading-7 text-ink-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 md:p-10"
          />

          {error && (
            <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-bad-600">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={saveLetter}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-ink-700 shadow-card transition hover:bg-line-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[20px] ${saving ? "animate-spin" : ""}`}>
                {saving ? "progress_activity" : "bookmark"}
              </span>
              {saving ? "Saving…" : saved ? "Saved" : "Save"}
            </button>

            <button
              type="button"
              onClick={downloadLetter}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-brand transition hover:brightness-110 active:scale-[.99]"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download Word
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CoverLetterPage;
