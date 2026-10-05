import Link from "next/link";

const features = [
  ["Run the whole team", "Contracts, staffing, finance, car development and board expectations all compete for your attention."],
  ["Race under pressure", "Practice, qualifying and live strategy turn management decisions into lap-by-lap consequences."],
  ["Survive the paddock", "Owners, sponsors, staff and rivals have their own leverage, agendas and reactions."],
  ["A world that moves", "Nine championships continue around you with transfers, promotions, rumors and changing team fortunes."],
];

const series = ["F1", "F2", "F3", "F4", "WEC", "GT3", "GT4", "INDYCAR", "RALLY"];

export default function Home() {
  return (
    <main className="tps-shell min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-sm font-black italic text-cyan-300">TP</span>
          <span>
            <span className="block text-sm font-semibold tracking-wide">TEAM PRINCIPAL</span>
            <span className="block text-[10px] uppercase tracking-[.22em] text-zinc-500">Simulator</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <a href="#game" className="hidden rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white sm:block">The game</a>
          <Link href="/game" className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">Enter HQ</Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div className="relative z-10">
          <p className="tps-kicker">Motorsport management · political strategy</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl lg:text-8xl">
            Win the race.
            <span className="block text-zinc-500">Keep the team.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            You are not the driver. You are the person responsible for everything around them:
            performance, people, money, politics and the decisions nobody else wants to make.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/game" className="rounded-xl bg-cyan-300 px-6 py-3.5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200">Start a career</Link>
            <a href="#game" className="rounded-xl border border-slate-700 bg-slate-950/50 px-6 py-3.5 font-semibold text-zinc-200 hover:border-slate-500">See how it plays</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm">
            <div><strong className="tps-number block text-2xl text-white">9</strong><span className="text-zinc-500">championships</span></div>
            <div><strong className="tps-number block text-2xl text-white">116</strong><span className="text-zinc-500">fictional teams</span></div>
            <div><strong className="tps-number block text-2xl text-white">1,600+</strong><span className="text-zinc-500">drivers & staff</span></div>
          </div>
        </div>

        <div className="relative min-h-[460px]">
          <div className="absolute inset-0 translate-x-10 rotate-[-4deg] rounded-[2.5rem] border border-cyan-300/10 bg-cyan-300/[.025]" />
          <div className="tps-panel tps-track-grid relative overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div><p className="tps-kicker">Race control</p><p className="mt-1 font-semibold">Canadian GP · Race 7</p></div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">LIVE</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1.3fr_.7fr]">
              <div className="rounded-2xl border border-slate-800 bg-black/25 p-4">
                <div className="flex h-52 items-center justify-center">
                  <svg viewBox="0 0 400 220" className="h-full w-full" aria-label="Abstract racing circuit">
                    <path d="M52 150 C72 86 120 57 179 69 C232 80 230 27 290 45 C355 63 360 117 314 136 C261 157 236 119 197 145 C156 173 125 190 82 177 C63 171 51 163 52 150Z" fill="none" stroke="rgba(94,231,255,.9)" strokeWidth="11" strokeLinecap="round"/>
                    <path d="M52 150 C72 86 120 57 179 69 C232 80 230 27 290 45 C355 63 360 117 314 136 C261 157 236 119 197 145 C156 173 125 190 82 177 C63 171 51 163 52 150Z" fill="none" stroke="#101722" strokeWidth="5" strokeLinecap="round"/>
                    <circle cx="198" cy="145" r="7" fill="#52e5a3"/>
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500">
                  <span>Lap <b className="block text-base text-white">41/70</b></span>
                  <span>Weather <b className="block text-base text-white">Dry</b></span>
                  <span>Gap <b className="block text-base text-white">+3.8s</b></span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  ["P1","Keller","+0.0"],
                  ["P2","Moretti","+3.8"],
                  ["P3","Sato","+7.1"],
                  ["P4","Vidal","+8.4"],
                  ["P5","Chen","+12.9"],
                ].map(([pos,name,gap],i)=>(
                  <div key={name} className={"flex items-center justify-between rounded-xl border p-3 text-sm "+(i===1?"border-cyan-400/50 bg-cyan-400/10":"border-slate-800 bg-black/20")}>
                    <span className="font-bold">{pos}</span><span className="text-zinc-300">{name}</span><span className="tps-number text-zinc-500">{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="tps-panel absolute -bottom-9 -left-5 w-[72%] p-4 sm:-left-10">
            <p className="tps-kicker">Decision required</p>
            <p className="mt-2 font-semibold">Rain expected in 8–12 minutes</p>
            <p className="mt-1 text-sm text-zinc-500">Pit now and sacrifice track position, or extend the stint?</p>
          </div>
        </div>
      </section>

      <section id="game" className="border-y border-slate-800/80 bg-black/20">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="tps-kicker">The game</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">Every result has a backstory.</h2>
              <p className="mt-5 leading-7 text-zinc-400">The race is only the visible part. Your real job is building the organization that gets there — and handling what happens when interests collide.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map(([title,body],i)=>(
                <article key={title} className="tps-panel p-5">
                  <span className="text-xs font-bold text-cyan-300">0{i+1}</span>
                  <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="tps-kicker">One career, many paddocks</p><h2 className="mt-3 text-3xl font-bold">Choose where your story starts.</h2></div>
          <Link href="/game" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Open championship selector →</Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {series.map((item)=> <span key={item} className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-zinc-300">{item}</span>)}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-5 py-8 text-sm text-zinc-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 lg:px-3">
          <span>Team Principal Simulator</span>
          <span>People · performance · politics</span>
        </div>
      </footer>
    </main>
  );
}
