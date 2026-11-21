import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import ScoreBars from "../components/ScoreBars";
import Logo from "../components/ui/Logo";

const STEPS = [
  ["Choose the interview", "Pick a role and difficulty, and add your resume for questions about your own projects."],
  ["Answer out loud or in text", "A weak answer earns a follow-up, just as it would with a real interviewer."],
  ["See what to fix", "Get scores across four skills, specific feedback, and a trend across every session."],
];
const SAMPLE = { technical_depth: 7, problem_solving: 8, communication: 9, confidence: 6 };

function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-quiet">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div>
            <p className="eyebrow text-accent-dark">Mock interviews that push back</p>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Practice the part of the interview you can&apos;t grind on a problem set.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              NexHire asks, listens, follows up on the weak spots, and tells you exactly what to improve before the
              real conversation.
            </p>
            <Link to="/register" className="btn-primary mt-7 px-5 py-3">
              Start a free interview <ArrowRight size={16} />
            </Link>
          </div>

          <div className="card" aria-label="Example feedback report">
            <p className="eyebrow">Example report</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold">7.6</span>
              <span className="text-muted">/10</span>
            </div>
            <div className="mt-5">
              <ScoreBars scores={SAMPLE} />
            </div>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-muted">
              Clear structure. Next, quantify the trade-off between cache freshness and latency.
            </p>
          </div>
        </section>

        <section className="grid gap-8 border-t border-line py-12 md:grid-cols-3">
          {STEPS.map(([title, body], index) => (
            <div key={title}>
              <span className="font-display text-2xl text-accent">{index + 1}</span>
              <h2 className="mt-2 text-lg">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
