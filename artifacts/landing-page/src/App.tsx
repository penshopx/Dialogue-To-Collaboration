import { useState, useEffect, useRef, useCallback } from "react";

// ── Theme ─────────────────────────────────────────────────────────────────────
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(d => !d), []);
  return { isDark, toggle };
}

// ── Tiny SVG helpers ──────────────────────────────────────────────────────────
function Ico({ d, size = 20, sw = 1.8, style }: { d: string | string[]; size?: number; sw?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const SunIcon = () => <Ico d={["M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42", "M12 17a5 5 0 100-10 5 5 0 000 10z"]} size={18} sw={1.8} />;
const MoonIcon = () => <Ico d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" size={18} sw={1.8} />;
function Check({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function X({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function ChevDown() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let n = 0;
      const step = to / 60;
      const id = setInterval(() => {
        n = Math.min(n + step, to);
        setVal(Math.round(n));
        if (n >= to) clearInterval(id);
      }, 16);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────
function NavBar({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const go = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setOpen(false); };

  const navLinks = [["Masalah", "story"], ["Solusi", "solution"], ["Fitur", "features"], ["Harga", "pricing"], ["FAQ", "faq"]] as const;

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={scrolled ? { borderBottom: "1px solid var(--bd-soft)", background: "var(--nav-bg)", backdropFilter: "blur(20px)" } : { background: "transparent" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }}>CB</div>
          <span className="font-bold text-lg" style={{ color: "var(--tx)" }}>CollabBuilder</span>
          <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "oklch(0.65 0.22 265/0.12)", color: "oklch(0.72 0.18 265)", border: "1px solid oklch(0.65 0.22 265/0.3)" }}>Beta</span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: "var(--tx-muted)" }}>
          {navLinks.map(([l, id]) => (
            <button key={id} onClick={() => go(id)}
              className="hover:text-[oklch(0.65_0.22_265)] transition-colors relative after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:transition-all hover:after:w-full"
              style={{ "--tw-after-bg": "oklch(0.65 0.22 265)" } as React.CSSProperties}>{l}</button>
          ))}
        </div>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <button onClick={onToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", color: "var(--tx-muted)" }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={() => go("pricing")} className="text-sm transition-colors" style={{ color: "var(--tx-muted)" }}>Lihat Harga</button>
          <button onClick={() => go("cta")}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 4px 16px oklch(0.65 0.22 265/0.25)" }}>
            Mulai Gratis →
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={onToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", color: "var(--tx-muted)" }}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="p-2" onClick={() => setOpen(!open)}>
            <div className="space-y-1.5">
              {[0,1,2].map(i => <span key={i} className={`block w-5 h-0.5 transition-all ${open && i===0 ? "rotate-45 translate-y-2" : open && i===1 ? "opacity-0" : open && i===2 ? "-rotate-45 -translate-y-2" : ""}`}
                style={{ background: "var(--tx)" }} />)}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-6 py-4 space-y-2"
          style={{ borderColor: "var(--bd)", background: "var(--nav-bg)", backdropFilter: "blur(20px)" }}>
          {navLinks.map(([l, id]) => (
            <button key={id} onClick={() => go(id)} className="block w-full text-left text-sm py-2.5 transition-colors"
              style={{ color: "var(--tx-muted)" }}>{l}</button>
          ))}
          <button onClick={() => { go("cta"); setOpen(false); }}
            className="w-full py-3 rounded-xl text-sm font-bold text-white mt-2"
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
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse,oklch(0.65 0.22 265),transparent 65%)" }} />
        <div className="absolute top-1/3 right-0 w-80 h-80 opacity-10"
          style={{ background: "radial-gradient(ellipse,oklch(0.7 0.2 300),transparent 70%)" }} />
        <div className="absolute inset-0 hero-grid" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm border"
          style={{ background: "oklch(0.65 0.22 265/0.1)", borderColor: "oklch(0.65 0.22 265/0.35)", color: "oklch(0.78 0.15 265)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.65 0.18 160)" }} />
          Dibangun dari buku "From Dialog to Collaboration" — Trilogi Buku II
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] font-black tracking-tight leading-[1.06] mb-6">
          <span style={{ color: "var(--tx)" }}>Tim Anda Pakai AI,</span><br />
          <span className="text-gradient">Tapi Hasilnya Masih</span><br />
          <span style={{ color: "var(--tx)" }}>Chaos</span><span style={{ color: "oklch(0.72 0.2 35)" }}>?</span>
        </h1>

        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-4 leading-relaxed" style={{ color: "var(--tx-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--tx)" }}>CollabBuilder</span> mengubah percakapan AI menjadi{" "}
          <span className="font-semibold" style={{ color: "var(--tx)" }}>pipeline kerja terstruktur</span> — dengan gate checkpoint, KPI tracker real-time, dan audit trail otomatis.
        </p>
        <p className="text-base mb-10" style={{ color: "oklch(0.6 0.12 265)" }}>No-code. Human-in-the-loop. 100% under your control.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="px-9 py-4 rounded-xl font-bold text-white text-base transition-all hover:scale-105 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 32px oklch(0.65 0.22 265/0.35)" }}>
            🚀 Mulai Gratis — Tanpa Kartu Kredit
          </button>
          <button onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}
            className="px-9 py-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.02]"
            style={{ border: "1px solid var(--bd-btn)", color: "var(--tx-muted)", background: "var(--bg-card)" }}>
            📖 Baca Ceritanya Dulu
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--bd)", background: "var(--bd)" }}>
          {[
            { v: "18+", l: "Template Sektor" }, { v: "32", l: "AI Agents Tersedia" },
            { v: "8", l: "Stage Pipeline" },     { v: "100%", l: "No-Code" },
          ].map(s => (
            <div key={s.l} className="py-6 px-4 text-center" style={{ background: "var(--bg-card)" }}>
              <p className="text-3xl font-black text-gradient mb-1">{s.v}</p>
              <p className="text-xs" style={{ color: "var(--tx-faint)" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────
const STATS_DATA = [
  { value: 73, suffix: "%", label: "manajer proyek menghabiskan 3+ jam/minggu hanya untuk laporan progress manual", src: "McKinsey Future of Work 2023" },
  { value: 68, suffix: "%", label: "tim AI mengalami 'coordination failure' — output AI tidak terintegrasi ke workflow nyata", src: "Gartner AI Adoption Survey 2024" },
  { value: 82, suffix: "%", label: "keputusan penting dalam proyek tidak terdokumentasi dengan baik", src: "PMI Pulse of the Profession 2024" },
  { value: 40, suffix: "%", label: "penurunan durasi proyek ketika tim menggunakan pipeline terstruktur vs ad-hoc", src: "Harvard Business Review 2023" },
];

function StatsSection() {
  return (
    <section className="py-16 px-6 border-y" style={{ borderColor: "var(--bd-sub)", background: "var(--bg-alt)" }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest mb-10" style={{ color: "var(--tx-faint)" }}>
          Bukan dugaan — ini data dari riset global
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS_DATA.map((s, i) => (
            <div key={i} className="rounded-2xl p-5 flex flex-col gap-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
              <p className="text-4xl font-black text-gradient">
                <CountUp to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--tx-dim)" }}>{s.label}</p>
              <p className="text-[10px] mt-auto" style={{ color: "var(--tx-ghost)" }}>— {s.src}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY
// ─────────────────────────────────────────────────────────────────────────────
function StorySection() {
  return (
    <section id="story" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1" style={{ background: "var(--bd-mid)" }} />
          <span className="text-xs font-bold uppercase tracking-widest px-3" style={{ color: "oklch(0.55 0.08 265)" }}>Sebuah Cerita Nyata</span>
          <div className="h-px flex-1" style={{ background: "var(--bd-mid)" }} />
        </div>

        <div className="space-y-8">
          {/* Scene 1 */}
          <div className="rounded-2xl p-7" style={{ background: "var(--bg-card)", borderLeft: "4px solid oklch(0.6 0.2 25)", border: "1px solid var(--bd)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.65 0.15 25)" }}>Senin, 09.30 — Rapat Weekly</p>
            <h3 className="text-xl font-bold mb-3" style={{ color: "var(--tx)" }}>Pak Reza memulai minggu dengan pertanyaan yang sama.</h3>
            <p className="leading-relaxed" style={{ color: "var(--tx-muted)" }}>
              "Progress proyek ISO-nya sudah sampai mana?" — ia bertanya ke tim. Jawaban datang dari 4 arah berbeda. Aditya bilang "sudah 60%". Sari bilang "masih nunggu review AI". Budi bilang dokumennya ada di Google Drive tapi belum di-update. Pak Reza membuka laptop, mencari-cari file di 3 folder berbeda, dan akhirnya menyerah setelah 20 menit.
            </p>
            <p className="mt-3 text-sm font-medium" style={{ color: "oklch(0.68 0.15 25)" }}>→ Rapat 90 menit. Keputusan yang dihasilkan: nol.</p>
          </div>

          {/* Scene 2 */}
          <div className="rounded-2xl p-7" style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.65 0.12 265)" }}>Selasa, 11.00 — Setelah ChatGPT</p>
            <h3 className="text-xl font-bold mb-3" style={{ color: "var(--tx)" }}>AI sudah dipakai. Masalahnya tetap ada.</h3>
            <p className="leading-relaxed mb-4" style={{ color: "var(--tx-muted)" }}>
              Tim sudah menggunakan ChatGPT selama 3 bulan. Setiap orang punya akun sendiri-sendiri. Sari chat untuk analisis gap, Aditya untuk draft dokumen, Budi untuk checklist audit. Hasilnya? Tiga versi dokumen yang berbeda, tidak ada yang tahu mana yang final, dan tidak ada jejak siapa yang approve apa.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["💬 Chat AI terpisah-pisah", "Setiap orang versinya berbeda"],
                ["📁 Dokumen tersebar", "Drive, email, WhatsApp, Notion"],
                ["🤷 Tidak ada yang review", '"Aku kira kamu yang approve"'],
                ["⏰ Deadline terlewat", "Klien komplain, tim panik"],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl p-3 text-sm"
                  style={{ background: "oklch(0.6 0.2 25/0.07)", border: "1px solid oklch(0.6 0.2 25/0.2)" }}>
                  <p className="font-semibold mb-0.5" style={{ color: "var(--tx)" }}>{t}</p>
                  <p style={{ color: "var(--tx-dim)" }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scene 3 */}
          <div className="rounded-2xl p-7" style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.65 0.12 265)" }}>Kamis, 14.00 — Laporan ke Klien</p>
            <h3 className="text-xl font-bold mb-3" style={{ color: "var(--tx)" }}>3 jam untuk buat laporan yang seharusnya otomatis.</h3>
            <p className="leading-relaxed" style={{ color: "var(--tx-muted)" }}>
              Klien minta progress report. Pak Reza menghabiskan 3 jam mengumpulkan data dari spreadsheet berbeda, tanya ke tim satu per satu via WhatsApp, dan mengetik ulang semuanya ke dalam format laporan. Setelah dikirim, klien bertanya: <em>"Ini keputusan yang diambil di minggu ke-3 dasarnya apa?"</em> — Pak Reza tidak bisa menjawab.
            </p>
          </div>

          {/* Pivot */}
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg,oklch(0.65 0.22 265/0.08),oklch(0.7 0.2 300/0.05))", border: "1px solid oklch(0.65 0.22 265/0.25)" }}>
            <p className="text-2xl font-black mb-3" style={{ color: "var(--tx)" }}>
              Pak Reza bukan tidak kompeten.<br />
              <span className="text-gradient">Sistemnya yang tidak ada.</span>
            </p>
            <p style={{ color: "var(--tx-muted)" }}>
              Ia bukan satu-satunya. Di seluruh Indonesia, ribuan tim kerja seperti ini setiap harinya — punya AI, punya niat, tapi tidak punya <strong style={{ color: "var(--tx)" }}>sistem orkestrator</strong> yang menyatukan semuanya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALTERNATIVES COMPARE
// ─────────────────────────────────────────────────────────────────────────────
const ALTS = [
  {
    name: "Project Manager Biasa", tools: "Trello, Asana, Notion, Jira", emoji: "📋",
    pros: ["Familiar, banyak yang pakai", "Gratis/murah untuk tim kecil"],
    cons: ["Tidak bisa orkestrasikan AI", "Tidak ada gate checkpoint", "Audit trail manual", "Butuh integrasi rumit ke AI"],
    verdict: "Bagus untuk task manusia. Buta terhadap AI workflow.",
  },
  {
    name: "Chat AI Langsung", tools: "ChatGPT, Claude, Gemini", emoji: "💬",
    pros: ["Mudah dipakai", "Powerful untuk individual"],
    cons: ["Tidak ada pipeline terstruktur", "Tidak ada review & approval", "Tidak ada audit trail", "Output tidak terhubung ke workflow"],
    verdict: "Powerful untuk satu orang. Chaos untuk tim.",
  },
  {
    name: "No-Code Automation", tools: "Make.com, Zapier, n8n", emoji: "⚙️",
    pros: ["Bisa integrasi banyak tools", "Automasi repetitive tasks"],
    cons: ["Setup teknis yang rumit", "Tidak ada multi-agent orchestration", "Tidak ada human gate", "Mahal untuk workflow kompleks"],
    verdict: "Cocok untuk automasi sederhana. Tidak untuk kolaborasi AI.",
  },
  {
    name: "Custom Dev / Konsultan", tools: "Bangun sendiri / hire konsultan", emoji: "👨‍💻",
    pros: ["Bisa fully custom", "Sesuai kebutuhan spesifik"],
    cons: ["Biaya Rp 50–200jt untuk build", "3–6 bulan development time", "Dependency ke developer eksternal", "Sulit dimaintain sendiri"],
    verdict: "Untuk korporasi besar. Tidak terjangkau untuk 95% tim.",
  },
];

function SolutionCompare() {
  return (
    <section id="solution" className="py-24 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.12 80/0.15)", color: "oklch(0.62 0.15 80)", border: "1px solid oklch(0.65 0.12 80/0.35)" }}>
            🔍 Pak Reza sudah coba ini semua
          </span>
          <h2 className="text-4xl font-black mt-3 mb-4" style={{ color: "var(--tx)" }}>
            Semua Solusi yang Sudah Dicoba.<br />
            <span className="text-gradient">Dan Kenapa Tidak Cukup.</span>
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "var(--tx-muted)" }}>
            Sebelum menemukan CollabBuilder, ini pilihan-pilihan yang dipertimbangkan — beserta kekurangannya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          {ALTS.map((a, i) => (
            <div key={i} className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
              <div>
                <span className="text-2xl">{a.emoji}</span>
                <h3 className="font-bold mt-2 mb-0.5" style={{ color: "var(--tx)" }}>{a.name}</h3>
                <p className="text-xs" style={{ color: "var(--tx-ghost)" }}>{a.tools}</p>
              </div>
              <div className="space-y-1.5">
                {a.pros.map(p => (
                  <div key={p} className="flex items-start gap-2 text-xs">
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-green-500" style={{ background: "oklch(0.65 0.18 160/0.15)" }}><Check size={8} /></span>
                    <span style={{ color: "var(--tx-muted)" }}>{p}</span>
                  </div>
                ))}
                {a.cons.map(c => (
                  <div key={c} className="flex items-start gap-2 text-xs">
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-red-400" style={{ background: "oklch(0.6 0.2 25/0.12)" }}><X size={7} /></span>
                    <span style={{ color: "var(--tx-dim)" }}>{c}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-3 border-t" style={{ borderColor: "var(--bd)" }}>
                <p className="text-xs italic" style={{ color: "oklch(0.62 0.08 25)" }}>{a.verdict}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bridge to CollabBuilder */}
        <div className="rounded-3xl p-8 md:p-10 text-center"
          style={{ background: "linear-gradient(135deg,oklch(0.65 0.22 265/0.1),oklch(0.7 0.2 300/0.06))", border: "1px solid oklch(0.65 0.22 265/0.35)", boxShadow: "0 0 60px oklch(0.65 0.22 265/0.08)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.65 0.18 265)" }}>Setelah mencoba semua itu...</p>
          <h3 className="text-3xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Pak Reza menemukan CollabBuilder.<br />
            <span className="text-gradient">Dan berhenti mencari.</span>
          </h3>
          <p className="max-w-2xl mx-auto mb-8" style={{ color: "var(--tx-muted)" }}>
            Bukan karena CollabBuilder sempurna. Tapi karena CollabBuilder adalah satu-satunya yang menggabungkan <strong style={{ color: "var(--tx)" }}>AI orchestration + human control + audit trail</strong> dalam satu platform no-code.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["⚡", "Setup 5 Menit", "Template siap pakai, langsung jalan"],
              ["🤖", "AI + Human", "Gate checkpoint wajib di setiap tahap kritis"],
              ["📋", "Audit Trail Otomatis", "Setiap keputusan tercatat, bisa di-export"],
              ["📊", "KPI Real-Time", "Dashboard langsung, tanpa laporan manual"],
            ].map(([icon, t, d]) => (
              <div key={t} className="rounded-xl p-4 text-left" style={{ background: "var(--bg-card)" }}>
                <span className="text-xl block mb-2">{icon}</span>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--tx)" }}>{t}</p>
                <p className="text-xs" style={{ color: "var(--tx-dim)" }}>{d}</p>
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
const TRANSFORMS = [
  { s: "Laporan Progress", b: "3 jam copy-paste dari spreadsheet & WhatsApp", a: "1 klik AI Standup Generator — selesai 30 detik" },
  { s: "Koordinasi Tim AI", b: "Masing-masing pakai ChatGPT sendiri, output tidak terintegrasi", a: "Agen Strategis, Skeptis, Eksekutor terkoordinasi dalam satu pipeline" },
  { s: "Dokumentasi Keputusan", b: '"Kayaknya dulu kita sepakat begini..." — tidak ada yang ingat', a: "Setiap keputusan gate tercatat otomatis dengan timestamp & aktor" },
  { s: "Review & Approval", b: "Email bolak-balik, version confusion, tidak jelas siapa yang approve", a: "Human gate checkpoint dengan rubrik 4 kriteria — tercatat langsung" },
  { s: "Pantau Deadline", b: "Tiba-tiba klien tanya, baru sadar milestone terlewat", a: "Dashboard real-time + early warning — masalah ketahuan sebelum jadi krisis" },
  { s: "Onboarding Anggota Baru", b: '"Coba baca email-email lama, nanti paham sendiri deh"', a: "Workroom berisi semua konteks — pipeline, keputusan, exit criteria" },
];

function BeforeAfter() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Sebelum & Sesudah <span className="text-gradient">CollabBuilder</span>
          </h2>
          <p style={{ color: "var(--tx-muted)" }}>Transformasi nyata dalam workflow sehari-hari</p>
        </div>

        <div className="grid grid-cols-[1fr_32px_1fr] gap-3 mb-3 px-1">
          <div className="text-center text-xs font-bold uppercase tracking-wider py-2 rounded-lg" style={{ color: "oklch(0.65 0.15 25)", background: "oklch(0.6 0.2 25/0.1)" }}>Sebelum</div>
          <div />
          <div className="text-center text-xs font-bold uppercase tracking-wider py-2 rounded-lg" style={{ color: "oklch(0.65 0.18 160)", background: "oklch(0.65 0.18 160/0.1)" }}>Sesudah CollabBuilder</div>
        </div>

        <div className="space-y-3">
          {TRANSFORMS.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_32px_1fr] items-center gap-3">
              <div className="rounded-xl p-4 text-sm" style={{ background: "oklch(0.6 0.2 25/0.06)", border: "1px solid oklch(0.6 0.2 25/0.18)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.6 0.12 25)" }}>{t.s}</p>
                <p style={{ color: "var(--tx-muted)" }}>{t.b}</p>
              </div>
              <div className="text-center text-lg" style={{ color: "var(--tx-ghost)" }}>→</div>
              <div className="rounded-xl p-4 text-sm" style={{ background: "oklch(0.65 0.18 160/0.06)", border: "1px solid oklch(0.65 0.18 160/0.22)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.65 0.18 160)" }}>{t.s}</p>
                <p style={{ color: "var(--tx)" }}>{t.a}</p>
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
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Pipeline 8 Stage Otomatis", desc: "Intake → Framing → Skeptic Gate → Blueprint → Delivery → QA Gate → Release → Retro. Setiap workroom mendapat pipeline lengkap.", badge: "Core", accent: "oklch(0.65 0.22 265)" },
  { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2", title: "Multi-Agent Orchestration", desc: "Agen Strategis, Skeptis, Eksekutor bekerja terkoordinasi. Masing-masing punya domain dan output criteria berbeda.", badge: "AI", accent: "oklch(0.7 0.2 300)" },
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "Human Gate Checkpoint", desc: "Di setiap tahap kritis, manusia harus approve. Rubrik scoring 4 kriteria, AI insight analysis, keputusan tercatat otomatis.", badge: "Control", accent: "oklch(0.7 0.18 80)" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "KPI Tracker Real-Time", desc: "Revenue growth, NPS, user acquisition — pantau semua dari satu dashboard. Alert otomatis ketika ada yang di bawah target.", badge: "Analytics", accent: "oklch(0.65 0.18 160)" },
  { icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", title: "AI Standup Generator", desc: "Satu klik → laporan harian dari semua stage aktif, terstruktur siap dibagikan. Hemat 2–3 jam per minggu.", badge: "AI", accent: "oklch(0.7 0.18 210)" },
  { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Report & Export Otomatis", desc: "Workroom report lengkap satu klik — audit trail, decisions, exit criteria, KPI. Export ke Markdown atau PDF.", badge: "Export", accent: "oklch(0.68 0.2 10)" },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.22 265/0.12)", color: "oklch(0.7 0.18 265)", border: "1px solid oklch(0.65 0.22 265/0.3)" }}>
            ⚡ Semua Fitur
          </span>
          <h2 className="text-4xl font-black mt-3 mb-4" style={{ color: "var(--tx)" }}>
            Satu Platform, Semua yang Dibutuhkan<br />
            <span className="text-gradient">untuk Kolaborasi AI yang Terkontrol</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl p-6 transition-all hover:-translate-y-1 group"
              style={{ background: "var(--bg-card)", border: `1px solid ${f.accent}28` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${f.accent}18` }}>
                  <Ico d={f.icon} size={20} style={{ color: f.accent }} />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${f.accent}15`, color: f.accent }}>{f.badge}</span>
              </div>
              <h3 className="font-bold mb-2" style={{ color: "var(--tx)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--tx-dim)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", e: "🗂️", t: "Pilih Template Sektor", d: "18+ template per industri: ISO, konstruksi, edutech, marketing. Langsung ada pipeline, agen, dan exit criteria." },
    { n: "02", e: "🎯", t: "Atur Workroom & Agen", d: "Isi nama proyek, objektif, deadline, KPI target. Agen AI langsung siap di posisi masing-masing — tidak perlu konfigurasi manual." },
    { n: "03", e: "🚦", t: "Jalankan & Approve Gate", d: "Monitor real-time dari dashboard. Ketika pipeline sampai checkpoint, Anda approve atau revisi. Semua terdokumentasi otomatis." },
  ];

  return (
    <section id="howto" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Dari Template ke <span className="text-gradient">Pipeline Berjalan</span><br />dalam 5 Menit
          </h2>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="hidden lg:block absolute top-12 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px"
            style={{ background: "linear-gradient(90deg,oklch(0.65 0.22 265/0.5),oklch(0.7 0.2 300/0.5))" }} />
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 font-black text-white text-lg"
                style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 24px oklch(0.65 0.22 265/0.3)" }}>
                {s.n}
              </div>
              <div className="text-3xl mb-4">{s.e}</div>
              <h3 className="font-bold text-lg mb-3" style={{ color: "var(--tx)" }}>{s.t}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--tx-dim)" }}>{s.d}</p>
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
function SectorsSection() {
  const sectors = [
    "🏗️ Konstruksi & Engineering", "✅ ISO & Sertifikasi", "🎓 Edutech & Pelatihan",
    "📢 Marketing & Branding", "📋 BNSP & Kompetensi", "💼 Konsultan Bisnis",
    "🚀 Startup & Product", "📊 Keuangan & Audit", "🏥 Healthcare & Klinik",
    "⚖️ Legal & Compliance", "🏘️ Properti & Developer", "🎨 Creative Agency",
  ];

  return (
    <section className="py-14 px-6 border-y" style={{ borderColor: "var(--bd-sub)", background: "var(--bg-alt)" }}>
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: "var(--tx-faint)" }}>
          Template tersedia untuk 18+ sektor industri Indonesia
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {sectors.map(s => (
            <span key={s} className="px-4 py-2 rounded-full text-sm transition-all cursor-default"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", color: "var(--tx-muted)" }}>{s}</span>
          ))}
          <span className="px-4 py-2 rounded-full text-sm"
            style={{ background: "oklch(0.65 0.22 265/0.1)", border: "1px solid oklch(0.65 0.22 265/0.3)", color: "oklch(0.72 0.18 265)" }}>
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
  { stars: 5, quote: "Sebelum CollabBuilder, rapat mingguan kami 90% cuma sinkronisasi data. Sekarang langsung diskusi keputusan karena semua orang sudah lihat dashboard yang sama.", name: "Budi Raharjo", role: "Senior PM, PT Waskita Konsultan", av: "BR", g: "from-blue-500 to-violet-500" },
  { stars: 5, quote: "KPI tracker-nya luar biasa untuk laporan ke klien. Yang dulu butuh 3 jam copy-paste dari spreadsheet, sekarang tinggal screenshot satu halaman.", name: "Rina Dewi S.", role: "Lead Consultant, Quality First ISO", av: "RD", g: "from-violet-500 to-pink-500" },
  { stars: 5, quote: "Tim kami 5 orang, semua pakai AI tools masing-masing. CollabBuilder yang akhirnya menyatukan output mereka jadi satu pipeline yang bisa diaudit.", name: "Ahmad Fauzi", role: "Founder, EdTech Nusantara", av: "AF", g: "from-green-500 to-teal-500" },
  { stars: 5, quote: "Gate checkpoint-nya yang paling saya suka. AI tidak bisa lanjut tanpa approval saya. Akhirnya ada sistem yang benar-benar human-in-the-loop.", name: "Dr. Sinta Murni", role: "Manager Compliance, BRI Finance", av: "SM", g: "from-amber-500 to-orange-500" },
];

function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Tim Nyata. Masalah Nyata.<br />
            <span className="text-gradient-warm">Hasil Nyata.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
              <div className="text-amber-400 text-lg">{"★".repeat(t.stars)}</div>
              <p className="leading-relaxed flex-1" style={{ color: "var(--tx-muted)" }}>"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--bd)" }}>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.g} flex items-center justify-center text-xs font-bold text-white shrink-0`}>{t.av}</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--tx)" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "var(--tx-faint)" }}>{t.role}</p>
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
// PRICING
// ─────────────────────────────────────────────────────────────────────────────
const TIERS = [
  {
    name: "Starter", monthly: "Gratis", annual: "Gratis", period: "selamanya",
    setup: "Rp 0", license: "Rp 0",
    desc: "Untuk individu yang baru mulai.", cta: "Mulai Gratis Sekarang",
    features: ["3 workroom aktif", "2 template sektor", "Pipeline 8 stage standar", "10 AI tasks / bulan", "Export Markdown", "Dashboard dasar"],
    no: ["AI Standup Generator", "KPI Tracker lanjutan", "Clone Workroom", "Support prioritas"],
  },
  {
    name: "Professional", badge: "Paling Populer",
    monthly: "Rp 599.000", annual: "Rp 479.000", annualSave: "hemat Rp 1.44jt/tahun",
    period: "per bulan", setup: "Rp 0", license: "Rp 0",
    desc: "Untuk konsultan & profesional yang butuh hasil nyata.", cta: "Coba 14 Hari Gratis", popular: true,
    features: ["Workroom tidak terbatas", "18+ template semua sektor", "AI Standup Generator", "KPI Tracker real-time", "Clone & Branch Workroom", "AI Gate Analysis (GPT-4o)", "Audit trail lengkap", "Export PDF & Markdown", "Email support <24 jam"],
  },
  {
    name: "Team", monthly: "Rp 1.499.000", annual: "Rp 1.199.000", annualSave: "hemat Rp 3.6jt/tahun",
    period: "per bulan / 5 users", setup: "Rp 0", license: "Rp 0 / user",
    desc: "Untuk tim yang bekerja bersama.", cta: "Coba 14 Hari Gratis",
    features: ["Semua fitur Professional", "5 user seats (+ Rp 200K/user tambahan)", "Shared workroom & task view", "Team decision log", "Collaboration roles per user", "Slack / webhook notifikasi", "Custom template builder", "Priority support <4 jam"],
  },
  {
    name: "Enterprise", monthly: "Custom", annual: "Custom", period: "hubungi sales",
    setup: "Termasuk onboarding", license: "Unlimited users",
    desc: "Untuk korporasi & konsultan besar.", cta: "Request Demo",
    features: ["Semua fitur Team", "User tidak terbatas", "White-label & custom domain", "On-premise deployment", "API access penuh", "Custom AI model integration", "SLA 99.9% uptime", "Dedicated account manager", "Onboarding & training (termasuk)"],
  },
] as const;

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.18 160/0.12)", color: "oklch(0.6 0.15 160)", border: "1px solid oklch(0.65 0.18 160/0.3)" }}>
            💰 Harga Transparan
          </span>
          <h2 className="text-4xl font-black mt-3 mb-4" style={{ color: "var(--tx)" }}>
            Tidak Ada Biaya Tersembunyi.<br />
            <span className="text-gradient">Bayar Hanya Subscription.</span>
          </h2>
          <p className="mb-8 max-w-lg mx-auto" style={{ color: "var(--tx-muted)" }}>
            <strong style={{ color: "var(--tx)" }}>Nol biaya setup. Nol biaya lisensi. Nol biaya onboarding.</strong> Hanya subscription bulanan atau tahunan.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border"
            style={{ background: "var(--bg-card)", borderColor: "var(--bd)" }}>
            <span className="text-sm" style={{ color: annual ? "var(--tx-faint)" : "var(--tx)", fontWeight: annual ? 400 : 600 }}>Bulanan</span>
            <button onClick={() => setAnnual(!annual)}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: annual ? "oklch(0.65 0.22 265)" : "var(--bd-soft)" }}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${annual ? "left-6" : "left-1"}`} />
            </button>
            <span className="text-sm" style={{ color: annual ? "var(--tx)" : "var(--tx-faint)", fontWeight: annual ? 600 : 400 }}>
              Tahunan <span className="font-bold" style={{ color: "oklch(0.6 0.18 160)" }}>−20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {TIERS.map((t, i) => (
            <div key={i}
              className={`relative flex flex-col rounded-2xl p-6 transition-all ${t.popular ? "scale-[1.02]" : ""}`}
              style={t.popular
                ? { background: "linear-gradient(145deg,oklch(0.65 0.22 265/0.1),oklch(0.7 0.2 300/0.06))", border: "1px solid oklch(0.65 0.22 265/0.5)", boxShadow: "0 0 40px oklch(0.65 0.22 265/0.12)" }
                : { background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
              {"badge" in t && t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }}>{t.badge}</span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-lg mb-1" style={{ color: "var(--tx)" }}>{t.name}</h3>
                <p className="text-xs mb-4" style={{ color: "var(--tx-faint)" }}>{t.desc}</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-black" style={{ color: "var(--tx)" }}>
                    {t.monthly === "Custom" || t.monthly === "Gratis" ? t.monthly : annual && "annual" in t ? t.annual : t.monthly}
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: "var(--tx-ghost)" }}>{t.period}</p>
                {"annualSave" in t && annual && t.annualSave && (
                  <p className="text-xs font-semibold" style={{ color: "oklch(0.6 0.18 160)" }}>✓ {t.annualSave}</p>
                )}
              </div>

              {/* Fee transparency box */}
              <div className="rounded-xl p-3 mb-4 space-y-1.5" style={{ background: "var(--bg-input)", border: "1px dashed var(--bd-mid)" }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--tx-faint)" }}>Biaya Setup</span>
                  <span className="font-semibold" style={{ color: "oklch(0.6 0.18 160)" }}>{t.setup}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--tx-faint)" }}>Biaya Lisensi</span>
                  <span className="font-semibold" style={{ color: "oklch(0.6 0.18 160)" }}>{t.license}</span>
                </div>
              </div>

              <button className={`w-full py-3 rounded-xl text-sm font-bold mb-5 transition-all ${"popular" in t && t.popular ? "text-white hover:opacity-90" : "hover:opacity-80"}`}
                style={"popular" in t && t.popular
                  ? { background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }
                  : { border: "1px solid var(--bd-btn)", color: "var(--tx)", background: "transparent" }}>
                {t.cta}
              </button>

              <div className="space-y-2.5 flex-1">
                {t.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2.5 text-sm">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "oklch(0.65 0.18 160/0.18)", color: "oklch(0.6 0.18 160)" }}><Check size={9} /></span>
                    <span style={{ color: "var(--tx-muted)" }}>{f}</span>
                  </div>
                ))}
                {"no" in t && t.no?.map((f, j) => (
                  <div key={j} className="flex items-start gap-2.5 text-sm opacity-40">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--bd)" }}><X size={8} /></span>
                    <span className="line-through" style={{ color: "var(--tx-ghost)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing micro-FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { q: "Ada biaya setup?", a: "Tidak ada. Semua paket (Starter, Pro, Team) = Rp 0 biaya setup. Enterprise sudah termasuk onboarding & training." },
            { q: "Ada biaya per-seat / lisensi?", a: "Tidak ada di Professional. Team: 5 seats sudah termasuk, tambah seat Rp 200K/user/bulan. Enterprise: unlimited users." },
            { q: "Kalau cancel, datanya hilang?", a: "Tidak. Semua data disimpan 90 hari setelah cancel. Anda bisa export sebelum menutup akun." },
          ].map(item => (
            <div key={item.q} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
              <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--tx)" }}>❓ {item.q}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--tx-dim)" }}>{item.a}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm" style={{ color: "var(--tx-ghost)" }}>
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
  { q: "AI apa yang digunakan? Apakah data saya dipakai untuk training model?", a: "CollabBuilder mendukung GPT-4o (OpenAI) dan Gemini. Data Anda tidak pernah digunakan untuk melatih model AI manapun. Semua data dienkripsi AES-256 dan disimpan di server Indonesia." },
  { q: "Berapa total biaya yang akan saya bayar? Apakah ada hidden fee?", a: "Total biaya = biaya subscription saja. Tidak ada biaya setup, tidak ada biaya lisensi, tidak ada biaya per-fitur. Yang Anda lihat di halaman harga adalah total yang Anda bayar." },
  { q: "Bisakah upgrade/downgrade paket kapan saja?", a: "Ya. Upgrade langsung aktif. Downgrade aktif di akhir siklus billing. Tidak ada penalti. Untuk paket tahunan, upgrade ke paket lebih tinggi dihitung selisih harga pro-rata." },
  { q: "Bagaimana kalau tim saya tersebar di banyak kota/WFH?", a: "CollabBuilder dirancang untuk tim remote/distributed. Semua akses berbasis web, workroom real-time, notifikasi Slack/email, dan audit trail digital. Pipeline berjalan dari mana saja." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Pertanyaan yang <span className="text-gradient">Sering Ditanya</span>
          </h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="rounded-2xl overflow-hidden cursor-pointer transition-all"
              style={{ background: "var(--bg-card)", border: `1px solid ${open === i ? "oklch(0.65 0.22 265/0.4)" : "var(--bd)"}` }}
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-center justify-between p-5 gap-4">
                <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--tx)" }}>{f.q}</h3>
                <span className={`shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} style={{ color: "var(--tx-faint)" }}><ChevDown /></span>
              </div>
              {open === i && (
                <div className="px-5 pb-5 -mt-2">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--tx-dim)" }}>{f.a}</p>
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
    <section id="cta" className="py-32 px-6 relative overflow-hidden" style={{ background: "var(--bg-alt)" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse,oklch(0.65 0.22 265/0.8),transparent 65%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--tx-ghost)" }}>Sudah siap?</p>
        <h2 className="text-5xl font-black mb-6 leading-tight" style={{ color: "var(--tx)" }}>
          Seperti Pak Reza,<br />
          <span className="text-gradient">Hentikan Chaos.</span><br />
          Mulai Orkestrasikan.
        </h2>
        <p className="text-xl mb-10 max-w-xl mx-auto" style={{ color: "var(--tx-muted)" }}>
          Bergabung dengan ratusan tim Indonesia yang sudah menjalankan proyek AI secara terstruktur, terdokumentasi, dan terkontrol.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="px-10 py-5 rounded-xl text-lg font-bold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 40px oklch(0.65 0.22 265/0.35)" }}>
            🚀 Mulai Gratis — Tanpa Kartu Kredit
          </button>
          <button className="px-10 py-5 rounded-xl text-lg font-semibold transition-all hover:opacity-80"
            style={{ border: "1px solid var(--bd-btn)", color: "var(--tx-muted)", background: "var(--bg-card)" }}
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
            Lihat Paket Harga
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-5 text-sm" style={{ color: "var(--tx-ghost)" }}>
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
    <footer className="border-t px-6 py-12" style={{ borderColor: "var(--bd-sub)", background: "var(--foot-bg)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }}>CB</div>
              <span className="font-bold" style={{ color: "var(--tx)" }}>CollabBuilder</span>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--tx-faint)" }}>
              Platform no-code untuk mengorkestrasikan AI agents dalam pipeline kerja terstruktur.
            </p>
            <p className="text-xs" style={{ color: "var(--tx-ghost)" }}>© 2025 CollabBuilder. Jakarta, Indonesia.</p>
          </div>
          {[
            { h: "Produk", links: ["Fitur", "Template", "Roadmap", "Changelog"] },
            { h: "Harga", links: ["Starter (Gratis)", "Professional", "Team", "Enterprise"] },
            { h: "Dukungan", links: ["Dokumentasi", "Tutorial Video", "Status", "Kontak"] },
          ].map(col => (
            <div key={col.h}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--tx)" }}>{col.h}</p>
              <div className="space-y-2">
                {col.links.map(l => <a key={l} href="#" className="block text-sm transition-colors hover:text-[oklch(0.65_0.22_265)]" style={{ color: "var(--tx-ghost)" }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t text-xs"
          style={{ borderColor: "var(--bd-foot)", color: "var(--tx-ghost)" }}>
          <p>Diinspirasi dari "From Dialog to Collaboration" — Trilogi Buku II oleh Gustafta</p>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "DPA"].map(l => (
              <a key={l} href="#" className="hover:text-[oklch(0.65_0.22_265)] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-screen">
      <NavBar isDark={isDark} onToggle={toggle} />
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
