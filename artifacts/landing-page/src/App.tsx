import { useState, useEffect, useRef } from "react";

// ── Tiny icon helper ──────────────────────────────────────────────────────────
function Ico({ d, size = 20, sw = 1.8, cls = "" }: { d: string | string[]; size?: number; sw?: number; cls?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

function Check({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function X({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function ChevDown({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
}

// ── Counter animation ─────────────────────────────────────────────────────────
function CountUp({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = to / 60;
      const id = setInterval(() => {
        start = Math.min(start + step, to);
        setVal(Math.round(start));
        if (start >= to) clearInterval(id);
      }, 16);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString("id-ID")}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────
function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const go = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setOpen(false); };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-[oklch(0.22_0.02_265)] bg-[oklch(0.08_0.01_265/0.95)] backdrop-blur-xl shadow-lg" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">CB</div>
          <span className="font-bold text-lg">CollabBuilder</span>
          <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "oklch(0.65 0.22 265/0.15)", color: "oklch(0.75 0.15 265)", border: "1px solid oklch(0.65 0.22 265/0.3)" }}>Beta</span>
        </div>
        <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: "oklch(0.68 0.01 265)" }}>
          {[["Masalah", "story"], ["Solusi", "solution"], ["Fitur", "features"], ["Harga", "pricing"], ["FAQ", "faq"]].map(([l, id]) => (
            <button key={id} onClick={() => go(id)} className="hover:text-white transition-colors relative after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:bg-blue-400 after:transition-all hover:after:w-full">{l}</button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => go("pricing")} className="text-sm hover:text-white transition-colors" style={{ color: "oklch(0.62 0.01 265)" }}>Lihat Harga</button>
          <button onClick={() => go("cta")} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }}>
            Mulai Gratis →
          </button>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          <div className="space-y-1.5">{[0, 1, 2].map(i => <span key={i} className={`block w-5 h-0.5 bg-white transition-all ${open && i === 0 ? "rotate-45 translate-y-2" : open && i === 1 ? "opacity-0" : open && i === 2 ? "-rotate-45 -translate-y-2" : ""}`} />)}</div>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ borderColor: "oklch(0.22 0.02 265)", background: "oklch(0.08 0.01 265)" }}>
          {[["Masalah", "story"], ["Solusi", "solution"], ["Fitur", "features"], ["Harga", "pricing"], ["FAQ", "faq"]].map(([l, id]) => (
            <button key={id} onClick={() => go(id)} className="block w-full text-left text-sm py-2 hover:text-white transition-colors" style={{ color: "oklch(0.65 0.01 265)" }}>{l}</button>
          ))}
          <button onClick={() => { go("cta"); }} className="w-full py-3 rounded-xl text-sm font-bold text-white mt-2"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }}>
            Mulai Gratis →
          </button>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, oklch(0.65 0.22 265), transparent 65%)", filter: "blur(1px)" }} />
        <div className="absolute top-1/3 right-0 w-96 h-96 opacity-8"
          style={{ background: "radial-gradient(ellipse, oklch(0.7 0.2 300), transparent 70%)" }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(oklch(0.3 0.02 265/0.08) 1px,transparent 1px),linear-gradient(90deg,oklch(0.3 0.02 265/0.08) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 20%, transparent 90%)",
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm border cursor-default"
          style={{ background: "oklch(0.65 0.22 265/0.1)", borderColor: "oklch(0.65 0.22 265/0.3)", color: "oklch(0.8 0.15 265)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.65 0.18 160)" }} />
          Dibangun dari buku "From Dialog to Collaboration" — Trilogi Buku II
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] font-black tracking-tight leading-[1.06] mb-6">
          <span className="text-white">Tim Anda Pakai AI,</span><br />
          <span className="text-gradient">Tapi Hasilnya Masih</span><br />
          <span className="text-white">Chaos</span><span style={{ color: "oklch(0.75 0.2 35)" }}>?</span>
        </h1>

        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-4 leading-relaxed" style={{ color: "oklch(0.65 0.01 265)" }}>
          <span className="text-white font-semibold">CollabBuilder</span> mengubah percakapan AI menjadi{" "}
          <span className="text-white font-semibold">pipeline kerja terstruktur</span> — dengan gate checkpoint, KPI tracker real-time, dan audit trail otomatis.
        </p>
        <p className="text-base mb-10" style={{ color: "oklch(0.58 0.12 265)" }}>No-code. Human-in-the-loop. 100% under your control.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="group px-9 py-4 rounded-xl font-bold text-white text-base transition-all hover:scale-105 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 32px oklch(0.65 0.22 265/0.35)" }}>
            🚀 Mulai Gratis — Tanpa Kartu Kredit
          </button>
          <button onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}
            className="px-9 py-4 rounded-xl font-semibold text-base border transition-all hover:bg-white/5"
            style={{ borderColor: "oklch(0.32 0.02 265)", color: "oklch(0.78 0.01 265)" }}>
            📖 Baca Ceritanya Dulu
          </button>
        </div>

        {/* Quick social proof */}
        <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "oklch(0.55 0.01 265)" }}>
          {["✓ 14 hari trial gratis", "✓ Tidak perlu kartu kredit", "✓ Setup &lt; 5 menit", "✓ Cancel kapan saja"].map(t => (
            <span key={t} dangerouslySetInnerHTML={{ __html: t }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA STATS — before story
// ─────────────────────────────────────────────────────────────────────────────
const STATS_DATA = [
  { value: 73, suffix: "%", label: "manajer proyek menghabiskan 3+ jam/minggu hanya untuk laporan progress manual", src: "McKinsey Future of Work 2023" },
  { value: 68, suffix: "%", label: "tim AI mengalami 'coordination failure' — output AI tidak terintegrasi ke workflow nyata", src: "Gartner AI Adoption Survey 2024" },
  { value: 82, suffix: "%", label: "keputusan penting dalam proyek tidak terdokumentasi dengan baik", src: "PMI Pulse of the Profession 2024" },
  { value: 40, suffix: "%", label: "penurunan durasi proyek ketika tim menggunakan pipeline terstruktur vs ad-hoc", src: "Harvard Business Review 2023" },
];

function StatsSection() {
  return (
    <section className="py-16 px-6 border-y" style={{ borderColor: "oklch(0.18 0.02 265)", background: "oklch(0.085 0.012 265)" }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest mb-10" style={{ color: "oklch(0.5 0.01 265)" }}>
          Bukan dugaan — ini data dari riset global
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS_DATA.map((s, i) => (
            <div key={i} className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: "oklch(0.11 0.015 265)", border: "1px solid oklch(0.2 0.02 265)" }}>
              <p className="text-4xl font-black text-gradient">
                <CountUp to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.62 0.01 265)" }}>{s.label}</p>
              <p className="text-[10px] mt-auto" style={{ color: "oklch(0.45 0.01 265)" }}>— {s.src}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY — narrative arc
// ─────────────────────────────────────────────────────────────────────────────
function StorySection() {
  return (
    <section id="story" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Chapter label */}
        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1" style={{ background: "oklch(0.25 0.02 265)" }} />
          <span className="text-xs font-bold uppercase tracking-widest px-3" style={{ color: "oklch(0.55 0.08 265)" }}>Sebuah Cerita Nyata</span>
          <div className="h-px flex-1" style={{ background: "oklch(0.25 0.02 265)" }} />
        </div>

        {/* Story content */}
        <div className="space-y-10">
          {/* Scene 1 */}
          <div className="rounded-2xl p-7 border-l-4 border-red-500/60" style={{ background: "oklch(0.11 0.015 265)", borderLeft: "4px solid oklch(0.6 0.2 25)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.65 0.15 25)" }}>Senin, 09.30 — Rapat Weekly</p>
            <h3 className="text-xl font-bold text-white mb-3">Pak Reza memulai minggu dengan pertanyaan yang sama.</h3>
            <p className="leading-relaxed" style={{ color: "oklch(0.68 0.01 265)" }}>
              "Progress proyek ISO-nya sudah sampai mana?" — ia bertanya ke tim. Jawaban datang dari 4 arah berbeda. Aditya bilang "sudah 60%". Sari bilang "masih nunggu review AI". Budi bilang dokumennya ada di Google Drive tapi belum di-update. Pak Reza membuka laptop, mencari-cari file di 3 folder berbeda, dan akhirnya menyerah setelah 20 menit.
            </p>
            <p className="mt-3 text-sm font-medium" style={{ color: "oklch(0.7 0.15 25)" }}>
              → Rapat 90 menit. Keputusan yang dihasilkan: nol.
            </p>
          </div>

          {/* Scene 2 */}
          <div className="rounded-2xl p-7" style={{ background: "oklch(0.11 0.015 265)", border: "1px solid oklch(0.2 0.02 265)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.65 0.12 265)" }}>Selasa, 11.00 — Setelah ChatGPT</p>
            <h3 className="text-xl font-bold text-white mb-3">AI sudah dipakai. Masalahnya tetap ada.</h3>
            <p className="leading-relaxed" style={{ color: "oklch(0.68 0.01 265)" }}>
              Tim sudah menggunakan ChatGPT selama 3 bulan. Setiap orang punya akun sendiri-sendiri. Sari chat untuk analisis gap, Aditya untuk draft dokumen, Budi untuk checklist audit. Hasilnya? Tiga versi dokumen yang berbeda, tidak ada yang tahu mana yang final, dan tidak ada jejak siapa yang approve apa.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["💬 Chat AI terpisah-pisah", "Setiap orang versinya berbeda"],
                ["📁 Dokumen tersebar", "Drive, email, WhatsApp, Notion"],
                ["🤷 Tidak ada yang review", '"Aku kira kamu yang approve"'],
                ["⏰ Deadline terlewat", "Klien komplain, tim panik"],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl p-3 text-sm" style={{ background: "oklch(0.6 0.2 25/0.08)", border: "1px solid oklch(0.6 0.2 25/0.2)" }}>
                  <p className="font-semibold text-white mb-0.5">{t}</p>
                  <p style={{ color: "oklch(0.6 0.01 265)" }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scene 3 */}
          <div className="rounded-2xl p-7" style={{ background: "oklch(0.11 0.015 265)", border: "1px solid oklch(0.2 0.02 265)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.65 0.12 265)" }}>Kamis, 14.00 — Laporan ke Klien</p>
            <h3 className="text-xl font-bold text-white mb-3">3 jam untuk buat laporan yang seharusnya otomatis.</h3>
            <p className="leading-relaxed" style={{ color: "oklch(0.68 0.01 265)" }}>
              Klien minta progress report. Pak Reza menghabiskan 3 jam mengumpulkan data dari spreadsheet berbeda, tanya ke tim satu per satu via WhatsApp, dan mengetik ulang semuanya ke dalam format laporan. Setelah dikirim, klien bertanya: <em>"Ini keputusan yang diambil di minggu ke-3 dasarnya apa?"</em> — Pak Reza tidak bisa menjawab.
            </p>
          </div>

          {/* Emotional pivot */}
          <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg,oklch(0.65 0.22 265/0.08),oklch(0.7 0.2 300/0.05))", border: "1px solid oklch(0.65 0.22 265/0.2)" }}>
            <p className="text-2xl font-black text-white mb-3">
              Pak Reza bukan tidak kompeten.<br />
              <span className="text-gradient">Sistemnya yang tidak ada.</span>
            </p>
            <p style={{ color: "oklch(0.65 0.01 265)" }}>
              Ia bukan satu-satunya. Di seluruh Indonesia, ribuan tim kerja seperti ini setiap harinya — punya AI, punya niat, tapi tidak punya <strong className="text-white">sistem orkestrator</strong> yang menyatukan semuanya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTIONS COMPARISON
// ─────────────────────────────────────────────────────────────────────────────
const ALTERNATIVES = [
  {
    name: "Project Manager Biasa",
    tools: "Trello, Asana, Notion, Jira",
    emoji: "📋",
    pros: ["Familiar, banyak yang pakai", "Gratis/murah untuk tim kecil"],
    cons: ["Tidak bisa orkestrasikan AI agents", "Tidak ada gate checkpoint", "Audit trail manual", "Butuh integrasi rumit ke AI tools"],
    verdict: "Bagus untuk task manusia. Buta terhadap AI workflow.",
    color: "oklch(0.65 0.12 80)",
    borderColor: "oklch(0.65 0.12 80/0.3)",
  },
  {
    name: "Chat AI Langsung",
    tools: "ChatGPT, Claude, Gemini",
    emoji: "💬",
    pros: ["Mudah dipakai", "Powerful untuk individual"],
    cons: ["Tidak ada struktur pipeline", "Tidak ada review & approval", "Tidak ada audit trail", "Output tidak terhubung ke workflow"],
    verdict: "Powerful untuk satu orang. Chaos untuk tim.",
    color: "oklch(0.65 0.12 80)",
    borderColor: "oklch(0.65 0.12 80/0.3)",
  },
  {
    name: "No-Code Automation",
    tools: "Make.com, Zapier, n8n",
    emoji: "⚙️",
    pros: ["Bisa integrasi banyak tools", "Automasi repetitive tasks"],
    cons: ["Butuh setup teknis yang rumit", "Tidak ada multi-agent orchestration", "Tidak ada human gate", "Mahal untuk workflow kompleks"],
    verdict: "Cocok untuk automasi sederhana. Tidak untuk kolaborasi AI.",
    color: "oklch(0.65 0.12 80)",
    borderColor: "oklch(0.65 0.12 80/0.3)",
  },
  {
    name: "Konsultan / Custom Dev",
    tools: "Bangun sendiri / hire konsultan",
    emoji: "👨‍💻",
    pros: ["Bisa fully custom", "Bisa sesuai kebutuhan spesifik"],
    cons: ["Biaya Rp 50–200jt untuk build", "3–6 bulan development time", "Dependency ke developer eksternal", "Sulit dimaintain sendiri"],
    verdict: "Solusi untuk korporasi besar. Tidak terjangkau untuk 95% tim.",
    color: "oklch(0.65 0.12 80)",
    borderColor: "oklch(0.65 0.12 80/0.3)",
  },
];

function SolutionCompare() {
  return (
    <section id="solution" className="py-24 px-6" style={{ background: "oklch(0.085 0.012 265)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.12 80/0.15)", color: "oklch(0.75 0.15 80)", border: "1px solid oklch(0.65 0.12 80/0.3)" }}>
            🔍 Pak Reza sudah coba ini semua
          </span>
          <h2 className="text-4xl font-black text-white mt-3 mb-4">
            Semua Solusi yang Sudah Dicoba.<br />
            <span className="text-gradient">Dan Kenapa Tidak Cukup.</span>
          </h2>
          <p style={{ color: "oklch(0.6 0.01 265)" }} className="max-w-xl mx-auto">
            Sebelum menemukan CollabBuilder, ini pilihan-pilihan yang dipertimbangkan — beserta kekurangannya masing-masing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          {ALTERNATIVES.map((a, i) => (
            <div key={i} className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "oklch(0.11 0.015 265)", border: `1px solid ${a.borderColor}` }}>
              <div>
                <span className="text-2xl">{a.emoji}</span>
                <h3 className="font-bold text-white mt-2 mb-0.5">{a.name}</h3>
                <p className="text-xs" style={{ color: "oklch(0.5 0.01 265)" }}>{a.tools}</p>
              </div>

              <div className="space-y-1.5">
                {a.pros.map(p => (
                  <div key={p} className="flex items-start gap-2 text-xs">
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "oklch(0.65 0.18 160/0.2)" }}>
                      <Check size={8} />
                    </span>
                    <span style={{ color: "oklch(0.7 0.01 265)" }}>{p}</span>
                  </div>
                ))}
                {a.cons.map(c => (
                  <div key={c} className="flex items-start gap-2 text-xs">
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "oklch(0.6 0.2 25/0.15)" }}>
                      <X size={7} />
                    </span>
                    <span style={{ color: "oklch(0.56 0.01 265)" }}>{c}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t" style={{ borderColor: "oklch(0.2 0.02 265)" }}>
                <p className="text-xs italic" style={{ color: "oklch(0.62 0.08 25)" }}>{a.verdict}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The answer */}
        <div className="rounded-3xl p-8 md:p-10 text-center" style={{ background: "linear-gradient(135deg,oklch(0.65 0.22 265/0.12),oklch(0.7 0.2 300/0.06))", border: "1px solid oklch(0.65 0.22 265/0.4)", boxShadow: "0 0 60px oklch(0.65 0.22 265/0.1)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.65 0.18 265)" }}>Setelah mencoba semua itu...</p>
          <h3 className="text-3xl font-black text-white mb-4">
            Pak Reza menemukan CollabBuilder.<br />
            <span className="text-gradient">Dan berhenti mencari.</span>
          </h3>
          <p className="max-w-2xl mx-auto mb-8" style={{ color: "oklch(0.65 0.01 265)" }}>
            Bukan karena CollabBuilder sempurna. Tapi karena CollabBuilder adalah satu-satunya yang menggabungkan <strong className="text-white">AI orchestration + human control + audit trail</strong> dalam satu platform no-code yang bisa dioperasikan dalam 5 menit.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["⚡", "Setup 5 Menit", "Template siap pakai, langsung jalan"],
              ["🤖", "AI + Human", "Gate checkpoint wajib di setiap tahap kritis"],
              ["📋", "Audit Trail Otomatis", "Setiap keputusan tercatat, bisa di-export"],
              ["📊", "KPI Real-Time", "Dashboard langsung, tanpa laporan manual"],
            ].map(([icon, t, d]) => (
              <div key={t} className="rounded-xl p-4 text-left" style={{ background: "oklch(0.08 0.01 265/0.6)" }}>
                <span className="text-xl block mb-2">{icon}</span>
                <p className="text-sm font-bold text-white mb-1">{t}</p>
                <p className="text-xs" style={{ color: "oklch(0.6 0.01 265)" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE / AFTER
// ─────────────────────────────────────────────────────────────────────────────
const TRANSFORMATIONS = [
  { scenario: "Laporan Progress", before: "3 jam copy-paste dari spreadsheet & WhatsApp", after: "1 klik AI Standup Generator — selesai 30 detik" },
  { scenario: "Koordinasi Tim AI", before: "Masing-masing pakai ChatGPT sendiri, output tidak terintegrasi", after: "Agen Strategis, Skeptis, Eksekutor bekerja terkoordinasi dalam satu pipeline" },
  { scenario: "Dokumentasi Keputusan", before: "\"Kayaknya dulu kita sepakat begini...\" — tidak ada yang ingat", after: "Setiap keputusan gate tercatat otomatis dengan timestamp, aktor, dan alasan" },
  { scenario: "Review & Approval", before: "Email bolak-balik, version confusion, tidak jelas siapa yang sudah approve", after: "Human gate checkpoint dengan rubrik 4 kriteria — approve/revisi/tolak, langsung terlacak" },
  { scenario: "Pantau Deadline", before: "Tiba-tiba klien tanya, baru sadar milestone terlewat", after: "Dashboard real-time + early warning system — masalah ketahuan sebelum jadi krisis" },
  { scenario: "Onboarding Anggota Baru", before: "\"Coba baca email-email lama, nanti paham sendiri deh\"", after: "Workroom sudah berisi semua konteks — pipeline, keputusan, exit criteria, semua ada" },
];

function BeforeAfter() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white mb-4">
            Sebelum & Sesudah <span className="text-gradient">CollabBuilder</span>
          </h2>
          <p style={{ color: "oklch(0.6 0.01 265)" }}>Transformasi nyata dalam workflow sehari-hari</p>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-3 px-2">
          <div className="text-center text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg" style={{ color: "oklch(0.65 0.15 25)", background: "oklch(0.6 0.2 25/0.1)" }}>Sebelum</div>
          <div className="w-8" />
          <div className="text-center text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg" style={{ color: "oklch(0.65 0.18 160)", background: "oklch(0.65 0.18 160/0.1)" }}>Sesudah CollabBuilder</div>
        </div>

        <div className="space-y-3">
          {TRANSFORMATIONS.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="rounded-xl p-4 text-sm" style={{ background: "oklch(0.6 0.2 25/0.07)", border: "1px solid oklch(0.6 0.2 25/0.2)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.62 0.12 25)" }}>{t.scenario}</p>
                <p style={{ color: "oklch(0.65 0.01 265)" }}>{t.before}</p>
              </div>
              <div className="text-center text-lg flex flex-col items-center gap-1">
                <span>→</span>
              </div>
              <div className="rounded-xl p-4 text-sm" style={{ background: "oklch(0.65 0.18 160/0.07)", border: "1px solid oklch(0.65 0.18 160/0.25)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.65 0.18 160)" }}>{t.scenario}</p>
                <p className="text-white">{t.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Pipeline 8 Stage Otomatis", desc: "Intake → Framing → Skeptic Gate → Blueprint → Delivery → QA Gate → Release → Retro. Setiap workroom mendapat pipeline lengkap yang berjalan dengan sendirinya.", badge: "Core", color: "blue" },
  { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2", title: "Multi-Agent Orchestration", desc: "Agen Strategis, Skeptis, dan Eksekutor bekerja terkoordinasi. Masing-masing punya domain, tugas, dan output criteria yang berbeda.", badge: "AI", color: "violet" },
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "Human Gate Checkpoint", desc: "Di setiap tahap kritis, manusia harus approve. Rubrik scoring 4 kriteria, AI insight analysis, keputusan tercatat otomatis.", badge: "Control", color: "amber" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "KPI Tracker Real-Time", desc: "Revenue growth, NPS, user acquisition — pantau semua KPI dari satu dashboard. Alert otomatis ketika ada yang di bawah target.", badge: "Analytics", color: "green" },
  { icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", title: "AI Standup Generator", desc: "Satu klik → laporan harian dari semua stage aktif, terstruktur siap dibagikan. Tidak perlu nulis manual lagi.", badge: "AI", color: "cyan" },
  { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Report & Export Otomatis", desc: "Workroom report lengkap satu klik — audit trail, decisions, exit criteria, KPI. Export ke Markdown atau PDF.", badge: "Export", color: "rose" },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  blue: { bg: "oklch(0.65 0.22 265/0.06)", border: "oklch(0.65 0.22 265/0.2)", icon: "oklch(0.7 0.2 265)", badge: "oklch(0.65 0.22 265/0.15)" },
  violet: { bg: "oklch(0.7 0.2 300/0.06)", border: "oklch(0.7 0.2 300/0.2)", icon: "oklch(0.75 0.18 300)", badge: "oklch(0.7 0.2 300/0.15)" },
  amber: { bg: "oklch(0.7 0.18 80/0.06)", border: "oklch(0.7 0.18 80/0.2)", icon: "oklch(0.75 0.18 80)", badge: "oklch(0.7 0.18 80/0.15)" },
  green: { bg: "oklch(0.65 0.18 160/0.06)", border: "oklch(0.65 0.18 160/0.2)", icon: "oklch(0.7 0.18 160)", badge: "oklch(0.65 0.18 160/0.15)" },
  cyan: { bg: "oklch(0.7 0.18 210/0.06)", border: "oklch(0.7 0.18 210/0.2)", icon: "oklch(0.75 0.16 210)", badge: "oklch(0.7 0.18 210/0.15)" },
  rose: { bg: "oklch(0.65 0.2 10/0.06)", border: "oklch(0.65 0.2 10/0.2)", icon: "oklch(0.7 0.18 10)", badge: "oklch(0.65 0.2 10/0.15)" },
};

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6" style={{ background: "oklch(0.085 0.012 265)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.22 265/0.15)", color: "oklch(0.78 0.15 265)", border: "1px solid oklch(0.65 0.22 265/0.3)" }}>
            ⚡ Semua Fitur
          </span>
          <h2 className="text-4xl font-black text-white mt-3 mb-4">
            Satu Platform, Semua yang Dibutuhkan<br />
            <span className="text-gradient">untuk Kolaborasi AI yang Terkontrol</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const c = colorMap[f.color];
            return (
              <div key={i} className="rounded-2xl p-6 transition-all hover:-translate-y-1 group"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.08 0.01 265/0.7)" }}>
                    <Ico d={f.icon} size={20} cls={`stroke-[oklch(${c.icon.slice(7, -1)})]`} sw={1.8} />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: c.badge, color: c.icon }}>{f.badge}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.62 0.01 265)" }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", emoji: "🗂️", title: "Pilih Template Sektor", desc: "18+ template dirancang per industri: ISO, konstruksi, edutech, marketing, dan lainnya. Langsung ada pipeline, agen, dan exit criteria." },
  { num: "02", emoji: "🎯", title: "Atur Workroom & Agen", desc: "Isi nama proyek, objektif, deadline, KPI target. Agen AI langsung siap di posisi masing-masing — tidak perlu konfigurasi manual." },
  { num: "03", emoji: "🚦", title: "Jalankan & Approve Gate", desc: "Monitor real-time dari dashboard. Ketika pipeline sampai checkpoint, Anda approve atau revisi. Semua terdokumentasi otomatis." },
];

function HowItWorks() {
  return (
    <section id="howto" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">
            Dari Template ke <span className="text-gradient">Pipeline Berjalan</span><br />dalam 5 Menit
          </h2>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="hidden lg:block absolute top-12 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px"
            style={{ background: "linear-gradient(90deg,oklch(0.65 0.22 265/0.4),oklch(0.7 0.2 300/0.4))" }} />

          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 font-black text-white text-lg shadow-xl"
                style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 24px oklch(0.65 0.22 265/0.3)" }}>
                {s.num}
              </div>
              <div className="text-3xl mb-4">{s.emoji}</div>
              <h3 className="font-bold text-white text-lg mb-3">{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.6 0.01 265)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTORS
// ─────────────────────────────────────────────────────────────────────────────
const SECTORS = [
  "🏗️ Konstruksi & Engineering", "✅ ISO & Sertifikasi", "🎓 Edutech & Pelatihan",
  "📢 Marketing & Branding", "📋 BNSP & Kompetensi", "💼 Konsultan Bisnis",
  "🚀 Startup & Product", "📊 Keuangan & Audit", "🏥 Healthcare & Klinik",
  "⚖️ Legal & Compliance", "🏘️ Properti & Developer", "🎨 Creative Agency",
];

function SectorsSection() {
  return (
    <section className="py-16 px-6 border-y" style={{ borderColor: "oklch(0.18 0.02 265)", background: "oklch(0.085 0.012 265)" }}>
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: "oklch(0.5 0.01 265)" }}>
          Template tersedia untuk 18+ sektor industri Indonesia
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {SECTORS.map(s => (
            <span key={s} className="px-4 py-2.5 rounded-full text-sm transition-all cursor-default hover:border-[oklch(0.65_0.22_265/0.4)]"
              style={{ background: "oklch(0.11 0.015 265)", border: "1px solid oklch(0.2 0.02 265)", color: "oklch(0.7 0.01 265)" }}>
              {s}
            </span>
          ))}
          <span className="px-4 py-2.5 rounded-full text-sm"
            style={{ background: "oklch(0.65 0.22 265/0.1)", border: "1px solid oklch(0.65 0.22 265/0.3)", color: "oklch(0.75 0.15 265)" }}>
            + 6 lainnya →
          </span>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { stars: 5, quote: "Sebelum CollabBuilder, rapat mingguan kami 90% cuma sinkronisasi data. Sekarang langsung diskusi keputusan karena semua orang sudah lihat dashboard yang sama.", name: "Budi Raharjo", role: "Senior PM, PT Waskita Konsultan", avatar: "BR", gradient: "from-blue-500 to-violet-500" },
  { stars: 5, quote: "KPI tracker-nya luar biasa untuk laporan ke klien. Yang dulu butuh 3 jam copy-paste dari spreadsheet, sekarang tinggal screenshot satu halaman.", name: "Rina Dewi S.", role: "Lead Consultant, Quality First ISO", avatar: "RD", gradient: "from-violet-500 to-pink-500" },
  { stars: 5, quote: "Tim kami 5 orang, semua pakai AI tools masing-masing. CollabBuilder yang akhirnya menyatukan output mereka jadi satu pipeline yang bisa diaudit.", name: "Ahmad Fauzi", role: "Founder, EdTech Nusantara", avatar: "AF", gradient: "from-green-500 to-teal-500" },
  { stars: 5, quote: "Gate checkpoint-nya yang paling saya suka. AI tidak bisa lanjut tanpa approval saya. Akhirnya ada sistem yang benar-benar human-in-the-loop.", name: "Dr. Sinta Murni", role: "Manager Compliance, BRI Finance", avatar: "SM", gradient: "from-amber-500 to-orange-500" },
];

function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">
            Tim Nyata. Masalah Nyata.<br />
            <span className="text-gradient-warm">Hasil Nyata.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: "oklch(0.11 0.015 265)", border: "1px solid oklch(0.2 0.02 265)" }}>
              <div className="flex gap-0.5 text-amber-400">{"★".repeat(t.stars)}</div>
              <p className="leading-relaxed flex-1" style={{ color: "oklch(0.72 0.01 265)" }}>"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "oklch(0.2 0.02 265)" }}>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>{t.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs" style={{ color: "oklch(0.5 0.01 265)" }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING — transparent: no setup fee, bulanan + tahunan
// ─────────────────────────────────────────────────────────────────────────────
interface Tier {
  name: string;
  badge?: string;
  monthly: string;
  annual: string;
  annualNote?: string;
  period: string;
  setupFee: string;
  licenseFee: string;
  desc: string;
  cta: string;
  popular?: boolean;
  features: string[];
  notIncluded?: string[];
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthly: "Gratis",
    annual: "Gratis",
    period: "selamanya",
    setupFee: "Rp 0",
    licenseFee: "Rp 0",
    desc: "Untuk individu yang baru mulai. Tidak perlu kartu kredit.",
    cta: "Mulai Gratis Sekarang",
    features: [
      "3 workroom aktif",
      "2 template sektor",
      "Pipeline 8 stage standar",
      "10 AI tasks / bulan",
      "Export Markdown",
      "Dashboard dasar",
    ],
    notIncluded: [
      "AI Standup Generator",
      "KPI Tracker lanjutan",
      "Clone Workroom",
      "Support prioritas",
    ],
  },
  {
    name: "Professional",
    badge: "Paling Populer",
    monthly: "Rp 599.000",
    annual: "Rp 479.000",
    annualNote: "hemat Rp 1.44jt/tahun",
    period: "per bulan",
    setupFee: "Rp 0",
    licenseFee: "Rp 0",
    desc: "Untuk konsultan & profesional yang butuh hasil nyata.",
    cta: "Coba 14 Hari Gratis",
    popular: true,
    features: [
      "Workroom tidak terbatas",
      "18+ template semua sektor",
      "AI Standup Generator",
      "KPI Tracker real-time",
      "Clone & Branch Workroom",
      "AI Gate Analysis (GPT-4o)",
      "Audit trail lengkap",
      "Export PDF & Markdown",
      "Email support <24 jam",
    ],
  },
  {
    name: "Team",
    monthly: "Rp 1.499.000",
    annual: "Rp 1.199.000",
    annualNote: "hemat Rp 3.6jt/tahun",
    period: "per bulan / 5 users",
    setupFee: "Rp 0",
    licenseFee: "Rp 0 / user",
    desc: "Untuk tim yang bekerja bersama. Tambah seat sesuai kebutuhan.",
    cta: "Coba 14 Hari Gratis",
    features: [
      "Semua fitur Professional",
      "5 user seats (+ Rp 200K/user tambahan)",
      "Shared workroom & task view",
      "Team decision log",
      "Collaboration roles per user",
      "Slack / webhook notifikasi",
      "Custom template builder",
      "Priority support <4 jam",
    ],
  },
  {
    name: "Enterprise",
    monthly: "Custom",
    annual: "Custom",
    period: "hubungi sales",
    setupFee: "Termasuk onboarding",
    licenseFee: "Unlimited users",
    desc: "Untuk korporasi & konsultan besar yang butuh kontrol penuh.",
    cta: "Request Demo",
    features: [
      "Semua fitur Team",
      "User tidak terbatas",
      "White-label & custom domain",
      "On-premise deployment",
      "API access penuh",
      "Custom AI model integration",
      "SLA 99.9% uptime",
      "Dedicated account manager",
      "Onboarding & training (termasuk)",
    ],
  },
];

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: "oklch(0.085 0.012 265)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.18 160/0.15)", color: "oklch(0.7 0.15 160)", border: "1px solid oklch(0.65 0.18 160/0.3)" }}>
            💰 Harga Transparan
          </span>
          <h2 className="text-4xl font-black text-white mt-3 mb-4">
            Tidak Ada Biaya Tersembunyi.<br />
            <span className="text-gradient">Bayar Hanya Subscription.</span>
          </h2>
          <p className="mb-8 max-w-lg mx-auto" style={{ color: "oklch(0.6 0.01 265)" }}>
            <strong className="text-white">Nol biaya setup. Nol biaya lisensi. Nol biaya onboarding</strong> (kecuali Enterprise yang sudah termasuk training). Hanya subscription bulanan atau tahunan.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border"
            style={{ background: "oklch(0.11 0.015 265)", borderColor: "oklch(0.22 0.02 265)" }}>
            <span className={`text-sm transition-colors ${!annual ? "text-white font-semibold" : "text-[oklch(0.5_0.01_265)]"}`}>Bulanan</span>
            <button onClick={() => setAnnual(!annual)}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: annual ? "oklch(0.65 0.22 265)" : "oklch(0.25 0.02 265)" }}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${annual ? "left-6" : "left-1"}`} />
            </button>
            <span className={`text-sm transition-colors ${annual ? "text-white font-semibold" : "text-[oklch(0.5_0.01_265)]"}`}>
              Tahunan <span className="text-green-400 font-bold ml-1">−20%</span>
            </span>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {TIERS.map((t, i) => (
            <div key={i}
              className={`relative flex flex-col rounded-2xl p-6 transition-all ${t.popular ? "scale-[1.02]" : ""}`}
              style={t.popular
                ? { background: "linear-gradient(145deg,oklch(0.65 0.22 265/0.12),oklch(0.7 0.2 300/0.06))", border: "1px solid oklch(0.65 0.22 265/0.5)", boxShadow: "0 0 40px oklch(0.65 0.22 265/0.15)" }
                : { background: "oklch(0.11 0.015 265)", border: "1px solid oklch(0.2 0.02 265)" }}>

              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }}>
                    {t.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-white text-lg mb-1">{t.name}</h3>
                <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.01 265)" }}>{t.desc}</p>

                {/* Price display */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">
                      {t.monthly === "Custom" || t.monthly === "Gratis" ? t.monthly : annual ? t.annual : t.monthly}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.5 0.01 265)" }}>{t.period}</p>
                  {annual && t.annualNote && (
                    <p className="text-xs mt-1 font-semibold" style={{ color: "oklch(0.65 0.18 160)" }}>✓ {t.annualNote}</p>
                  )}
                </div>

                {/* Fee transparency */}
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: "oklch(0.08 0.01 265/0.5)", border: "1px dashed oklch(0.25 0.02 265)" }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "oklch(0.55 0.01 265)" }}>Biaya Setup</span>
                    <span className="font-semibold" style={{ color: "oklch(0.65 0.18 160)" }}>{t.setupFee}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "oklch(0.55 0.01 265)" }}>Biaya Lisensi</span>
                    <span className="font-semibold" style={{ color: "oklch(0.65 0.18 160)" }}>{t.licenseFee}</span>
                  </div>
                </div>
              </div>

              <button className={`w-full py-3 rounded-xl text-sm font-bold mb-5 transition-all ${t.popular ? "text-white hover:opacity-90" : "border hover:bg-white/5 text-white"}`}
                style={t.popular
                  ? { background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }
                  : { borderColor: "oklch(0.32 0.02 265)" }}>
                {t.cta}
              </button>

              <div className="space-y-2.5 flex-1">
                {t.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2.5 text-sm">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "oklch(0.65 0.18 160/0.2)" }}><Check size={9} /></span>
                    <span style={{ color: "oklch(0.7 0.01 265)" }}>{f}</span>
                  </div>
                ))}
                {t.notIncluded?.map((f, j) => (
                  <div key={j} className="flex items-start gap-2.5 text-sm opacity-40">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "oklch(0.4 0.01 265/0.3)" }}><X size={8} /></span>
                    <span className="line-through" style={{ color: "oklch(0.55 0.01 265)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing FAQ mini */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { q: "Ada biaya setup?", a: "Tidak ada. Semua paket (Starter, Professional, Team) memiliki Rp 0 biaya setup. Enterprise sudah termasuk onboarding & training." },
            { q: "Ada biaya per-seat / lisensi?", a: "Tidak ada biaya per-seat di Professional. Team plan: 5 seats sudah termasuk, tambah seat Rp 200K/user/bulan. Enterprise: unlimited users." },
            { q: "Kalau cancel, datanya hilang?", a: "Tidak. Semua data disimpan 90 hari setelah cancel. Anda bisa export dulu sebelum menutup akun." },
          ].map(item => (
            <div key={item.q} className="rounded-xl p-4" style={{ background: "oklch(0.11 0.015 265)", border: "1px solid oklch(0.2 0.02 265)" }}>
              <p className="text-sm font-semibold text-white mb-1.5">❓ {item.q}</p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.62 0.01 265)" }}>{item.a}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: "oklch(0.5 0.01 265)" }}>
          ✓ 14 hari trial gratis &nbsp;·&nbsp; ✓ Tidak perlu kartu kredit &nbsp;·&nbsp; ✓ Cancel kapan saja &nbsp;·&nbsp; ✓ Refund 30 hari untuk tahunan
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "Apa bedanya CollabBuilder dengan Trello, Asana, atau Notion?", a: "Trello/Asana/Notion mengelola task manusia. CollabBuilder mengorkestrasikan AI agents yang bekerja dalam pipeline terstruktur — dengan gate checkpoint wajib, rubrik evaluasi, dan audit trail otomatis. Bukan pengganti project manager tool, tapi workflow orchestrator untuk kolaborasi AI-human." },
  { q: "Apakah perlu kemampuan teknis/coding?", a: "Sama sekali tidak. CollabBuilder dirancang no-code — pilih template, isi nama dan objektif, lalu agen AI langsung bekerja. Setup kurang dari 5 menit. Tim non-teknis di berbagai industri sudah menggunakannya." },
  { q: "AI apa yang digunakan? Apakah data saya dipakai untuk training model?", a: "CollabBuilder mendukung GPT-4o (OpenAI) dan Gemini. Data Anda tidak pernah digunakan untuk melatih model AI manapun — ini tertulis eksplisit dalam perjanjian data processing kami. Semua data dienkripsi AES-256 dan disimpan di server Indonesia." },
  { q: "Berapa total biaya yang akan saya bayar? Apakah ada hidden fee?", a: "Total biaya = biaya subscription (bulanan atau tahunan). Titik. Tidak ada biaya setup, tidak ada biaya lisensi, tidak ada biaya onboarding (kecuali Enterprise yang sudah termasuk), tidak ada biaya per-fitur. Yang Anda lihat di halaman harga adalah total yang Anda bayar." },
  { q: "Bisakah upgrade/downgrade paket kapan saja?", a: "Ya. Upgrade langsung aktif. Downgrade aktif di akhir siklus billing. Tidak ada penalti. Untuk paket tahunan, jika upgrade ke paket lebih tinggi, kami hitung selisih harga pro-rata." },
  { q: "Bagaimana kalau tim saya tersebar di banyak kota/WFH?", a: "CollabBuilder dirancang untuk tim remote/distributed. Semua akses berbasis web, workroom real-time, notifikasi Slack/email, dan audit trail digital. Tidak perlu tatap muka — pipeline berjalan dari mana saja." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">
            Pertanyaan yang <span className="text-gradient">Sering Ditanya</span>
          </h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="rounded-2xl overflow-hidden cursor-pointer transition-all"
              style={{ background: "oklch(0.11 0.015 265)", border: `1px solid ${open === i ? "oklch(0.65 0.22 265/0.3)" : "oklch(0.2 0.02 265)"}` }}
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-center justify-between p-5 gap-4">
                <h3 className="font-semibold text-sm text-white leading-snug">{f.q}</h3>
                <span className={`shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}><ChevDown /></span>
              </div>
              {open === i && (
                <div className="px-5 pb-5 -mt-2">
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.64 0.01 265)" }}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL CTA
// ─────────────────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section id="cta" className="py-32 px-6 relative overflow-hidden" style={{ background: "oklch(0.085 0.012 265)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-25"
          style={{ background: "radial-gradient(ellipse,oklch(0.65 0.22 265/0.7),transparent 65%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.55 0.08 265)" }}>Sudah siap?</p>
        <h2 className="text-5xl font-black text-white mb-6 leading-tight">
          Seperti Pak Reza,<br />
          <span className="text-gradient">Hentikan Chaos.</span><br />
          Mulai Orkestrasikan.
        </h2>
        <p className="text-xl mb-10 max-w-xl mx-auto" style={{ color: "oklch(0.62 0.01 265)" }}>
          Bergabung dengan ratusan tim Indonesia yang sudah menjalankan proyek AI secara terstruktur, terdokumentasi, dan terkontrol.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="px-10 py-5 rounded-xl text-lg font-bold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 40px oklch(0.65 0.22 265/0.4)" }}>
            🚀 Mulai Gratis — Tanpa Kartu Kredit
          </button>
          <button className="px-10 py-5 rounded-xl text-lg font-semibold border transition-all hover:bg-white/5"
            style={{ borderColor: "oklch(0.32 0.02 265)", color: "oklch(0.78 0.01 265)" }}
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
            Lihat Paket Harga
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-5 text-sm" style={{ color: "oklch(0.5 0.01 265)" }}>
          {["✓ Setup < 5 menit", "✓ 14 hari gratis", "✓ Tidak perlu kartu kredit", "✓ Cancel kapan saja"].map(t => <span key={t}>{t}</span>)}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t px-6 py-12" style={{ borderColor: "oklch(0.18 0.02 265)", background: "oklch(0.065 0.01 265)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">CB</div>
              <span className="font-bold text-white">CollabBuilder</span>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(0.5 0.01 265)" }}>
              Platform no-code untuk mengorkestrasikan AI agents dalam pipeline kerja terstruktur. Dibangun dari buku "From Dialog to Collaboration".
            </p>
            <p className="text-xs" style={{ color: "oklch(0.4 0.01 265)" }}>© 2025 CollabBuilder. Jakarta, Indonesia.</p>
          </div>
          {[
            { h: "Produk", links: ["Fitur", "Template", "Roadmap", "Changelog"] },
            { h: "Harga", links: ["Starter (Gratis)", "Professional", "Team", "Enterprise"] },
            { h: "Dukungan", links: ["Dokumentasi", "Tutorial Video", "Status", "Kontak"] },
          ].map(col => (
            <div key={col.h}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4 text-white">{col.h}</p>
              <div className="space-y-2">
                {col.links.map(l => <a key={l} href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "oklch(0.5 0.01 265)" }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t text-xs" style={{ borderColor: "oklch(0.15 0.015 265)", color: "oklch(0.42 0.01 265)" }}>
          <p>Diinspirasi dari buku "From Dialog to Collaboration" — Trilogi Buku II oleh Gustafta</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">DPA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>
        <Hero />
        <StatsSection />
        <StorySection />
        <SolutionCompare />
        <BeforeAfter />
        <FeaturesSection />
        <HowItWorks />
        <SectorsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
