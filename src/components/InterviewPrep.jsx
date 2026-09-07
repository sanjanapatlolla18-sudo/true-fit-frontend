import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "../api";

function InterviewPrep() {
  const { getToken } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [jobRole, setJobRole] = useState("");

  const [results, setResults] = useState([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setError("Please enter a company name.");
      return;
    }

    if (!jobRole.trim()) {
      setError("Please enter a job role.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setNotice("");

    const formData = new FormData();

    formData.append("company_name", companyName);
    formData.append("job_role", jobRole);

    try {
      const token = await getToken();
      const data = await apiRequest("/interview-prep", token, { method: "POST", body: formData });

      setResults(data.interview_questions || []);
      setNotice(data.message || "");

    } catch (requestError) {
      setError(requestError.message || "Failed to get interview questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-ink-400">
            Company
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-ink-400">
              apartment
            </span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Google"
              className="w-full rounded-xl border border-line bg-canvas py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-ink-400">
            Job Role
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-ink-400">
              work
            </span>
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="Software Developer"
              className="w-full rounded-xl border border-line bg-canvas py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-brand transition enabled:hover:brightness-110 enabled:active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:col-span-2"
        >
          <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}>
            {loading ? "progress_activity" : "search"}
          </span>
          {loading ? "Searching…" : "Search Interview Questions"}
        </button>
      </form>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-bad-600/20 bg-bad-50 p-4 text-sm font-medium text-bad-600">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {notice && !error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-4 text-sm text-ink-500">
          <span className="material-symbols-outlined text-[20px] text-ink-400">info</span>
          {notice}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-bold tracking-tight">Source-Backed Preparation</h3>
          <p className="mt-1 text-sm text-ink-500">
            Unedited excerpts from the linked sources. Verify each source before relying on it.
          </p>

          <div className="mt-5 space-y-4">
            {results.map((item, index) => (
              <div
                key={index}
                className="animate-rise rounded-2xl border border-line bg-white p-5 shadow-card transition hover:shadow-lift"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold leading-6 text-ink">{item.title}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">{item.content}</p>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-800"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        View Source
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewPrep;
