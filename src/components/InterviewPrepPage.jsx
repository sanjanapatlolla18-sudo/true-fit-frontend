import InterviewPrep from "./InterviewPrep";

function InterviewPrepPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-7 animate-rise">
        <p className="text-sm font-semibold text-brand-600">INTERVIEW PREP</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl">
          Walk in prepared
        </h1>
        <p className="mt-2 max-w-2xl text-ink-500">
          Pull real, source-backed interview questions for a specific company and role — then
          build a focused preparation plan around them.
        </p>
      </header>

      <section className="animate-rise rounded-2xl border border-line bg-white p-6 shadow-card md:p-7">
        <InterviewPrep />
      </section>
    </div>
  );
}

export default InterviewPrepPage;
