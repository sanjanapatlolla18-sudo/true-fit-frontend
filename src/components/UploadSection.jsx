import { useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setActiveMatch } from "../utils/activeMatch";
import { apiRequest } from "../api";

function fileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadSection({ embedded = false }) {
  const { getToken } = useAuth();
  const resumeInputRef = useRef(null);
  const jobDescriptionInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chooseResume = (nextFile) => {
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf") {
      setError("Please upload a PDF resume.");
      return;
    }
    setFile(nextFile);
    setError("");
  };

  const chooseJobDescription = (nextFile) => {
    if (!nextFile) return;
    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(extension)) {
      setError("Please upload the job description as a PDF, DOCX, or TXT file.");
      return;
    }
    setJobDescriptionFile(nextFile);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const pastedDescription = jobDescription.trim();

    if (!file || (!pastedDescription && !jobDescriptionFile)) {
      setError(!file ? "Please select a PDF resume." : "Paste a job description or upload a PDF, DOCX, or TXT file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", pastedDescription);
      if (jobDescriptionFile) formData.append("job_description_file", jobDescriptionFile);

      const token = await getToken();
      const data = await apiRequest("/analyze", token, { method: "POST", body: formData });

      setActiveMatch(data);
      window.dispatchEvent(new Event("resumeMatchUpdated"));
      window.location.hash = `#recent-matches?id=${data.id}`;
    } catch (requestError) {
      setError(requestError.message || "Unable to analyze the resume.");
    } finally {
      setLoading(false);
    }
  };

  const ready = Boolean(file) && Boolean(jobDescription.trim() || jobDescriptionFile);

  return (
    <div className={embedded ? "" : "mx-auto max-w-5xl"}>
      {!embedded && (
        <header className="mb-8">
          <p className="text-sm font-semibold text-brand-600">RESUME ANALYSIS</p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl">Find your job match</h1>
          <p className="mt-2 max-w-2xl text-lg text-ink-500">
            Upload your resume and provide a job description as text or a document.
          </p>
        </header>
      )}

      <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="grid gap-8 p-6 md:grid-cols-2 md:p-7">

          {/* Step 1 — resume */}
          <div>
            <h2 className="mb-4 flex items-center gap-2.5 text-sm font-bold">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">1</span>
              Your Resume
            </h2>

            <div
              role="button"
              tabIndex="0"
              onClick={() => resumeInputRef.current?.click()}
              onKeyDown={(event) => event.key === "Enter" && resumeInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); chooseResume(event.dataTransfer.files[0]); }}
              className={`flex h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragging
                  ? "border-brand-500 bg-brand-50"
                  : file
                    ? "border-brand-200 bg-brand-50/40"
                    : "border-line bg-canvas hover:border-brand-400 hover:bg-brand-50/40"
              }`}
            >
              {file ? (
                <>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-600 shadow-card">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </span>
                  <p className="mt-3 max-w-full truncate px-2 text-sm font-semibold text-ink">{file.name}</p>
                  <p className="mt-1 text-xs text-ink-500">{fileSize(file.size)} · Click to replace</p>
                </>
              ) : (
                <>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <span className="material-symbols-outlined">upload_file</span>
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink">Drop your PDF here</p>
                  <p className="mt-1 text-xs text-ink-500">or click to browse</p>
                </>
              )}
              <input
                ref={resumeInputRef}
                className="hidden"
                type="file"
                accept="application/pdf"
                onChange={(event) => chooseResume(event.target.files[0])}
              />
            </div>
          </div>

          {/* Step 2 — job description */}
          <div>
            <h2 className="mb-4 flex items-center gap-2.5 text-sm font-bold">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">2</span>
              Job Description
            </h2>

            <textarea
              value={jobDescription}
              onChange={(event) => { setJobDescription(event.target.value); setError(""); }}
              className="h-[8.25rem] w-full resize-none rounded-xl border border-line bg-canvas p-4 text-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              placeholder="Paste the complete job description here…"
            />

            <div className="my-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              <span className="h-px flex-1 bg-line" />or upload a document<span className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={() => jobDescriptionInputRef.current?.click()}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                jobDescriptionFile
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-line bg-white text-ink-700 hover:bg-line-soft"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {jobDescriptionFile ? "check_circle" : "attach_file"}
              </span>
              <span className="truncate">{jobDescriptionFile ? jobDescriptionFile.name : "Upload PDF, DOCX, or TXT"}</span>
            </button>

            <input
              ref={jobDescriptionInputRef}
              className="hidden"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => chooseJobDescription(event.target.files[0])}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-line bg-canvas px-6 py-4 sm:flex-row sm:items-center">
          {error ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-bad-600">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </p>
          ) : (
            <p className="text-xs text-ink-500">
              Resume: PDF. Job description: paste text or upload PDF, DOCX, or TXT.
            </p>
          )}

          <button
            disabled={!ready || loading}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-brand transition enabled:hover:brightness-110 enabled:active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}>
              {loading ? "progress_activity" : "auto_awesome"}
            </span>
            {loading ? "Analyzing…" : "Analyze Match"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadSection;
