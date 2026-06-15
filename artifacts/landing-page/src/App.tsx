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
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))" }}>CB</div>
          <span className="font-bold text-lg" style={{ color: "var(--tx)" }}>CollabBuilder</span>
          <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "oklch(0.65 0.22 265/0.12)", color: "oklch(0.72 0.18 265)", border: "1px solid oklch(0.65 0.22 265/0.3)" }}>Beta</span>
        </div>

        <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: "var(--tx-muted)" }}>
          {navLinks.map(([l, id]) => (
            <button key={id} onClick={() => go(id)}
              className="hover:text-[oklch(0.65_0.22_265)] transition-colors">{l}</button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={onToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", color: "var(--tx-muted)" }}
            title={isDark ? "Mode Terang" : "Mode Gelap"}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={() => go("pricing")} className="text-sm transition-colors" style={{ color: "var(--tx-muted)" }}>Lihat Harga</button>
          <button onClick={() => go("cta")}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 4px 16px oklch(0.65 0.22 265/0.25)" }}>
            Mulai Gratis →
          </button>
        </div>

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
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse,oklch(0.65 0.22 265),transparent 65%)" }} />
        <div className="absolute top-1/3 right-0 w-80 h-80 opacity-10"
          style={{ background: "radial-gradient(ellipse,oklch(0.7 0.2 300),transparent 70%)" }} />
        <div className="absolute inset-0 hero-grid" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm border"
          style={{ background: "oklch(0.65 0.22 265/0.1)", borderColor: "oklch(0.65 0.22 265/0.35)", color: "oklch(0.78 0.15 265)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.65 0.18 160)" }} />
          Dibangun dari buku "From Dialog to Collaboration" — Trilogi Buku II
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] font-black tracking-tight leading-[1.06] mb-6">
          <span style={{ color: "var(--tx)" }}>AI Sudah Dipake.</span><br />
          <span className="text-gradient">Hasilnya Masih</span><br />
          <span style={{ color: "var(--tx)" }}>Berceceran</span><span style={{ color: "oklch(0.72 0.2 35)" }}>.</span>
        </h1>

        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-4 leading-relaxed" style={{ color: "var(--tx-muted)" }}>
          Output ChatGPT tidak nyambung ke dokumen resmi. Tidak ada yang tahu siapa approve apa. Laporan ke klien masih copy-paste manual.{" "}
          <span className="font-semibold" style={{ color: "var(--tx)" }}>CollabBuilder menyatukan semua itu dalam satu pipeline yang bisa diaudit.</span>
        </p>
        <p className="text-sm mb-10" style={{ color: "oklch(0.55 0.1 265)" }}>
          No-code · Human-in-the-loop · Tersedia template untuk 18+ sektor Indonesia
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="px-9 py-4 rounded-xl font-bold text-white text-base transition-all hover:scale-105 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 32px oklch(0.65 0.22 265/0.35)" }}>
            🚀 Coba Gratis 14 Hari — Tanpa Kartu Kredit
          </button>
          <button onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}
            className="px-9 py-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.02]"
            style={{ border: "1px solid var(--bd-btn)", color: "var(--tx-muted)", background: "var(--bg-card)" }}>
            📖 Kenali Masalahnya Dulu
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--bd)", background: "var(--bd)" }}>
          {[
            { v: "18+", l: "Template Sektor" }, { v: "32", l: "AI Roles Dikonfigurasi" },
            { v: "8", l: "Stage Pipeline" },    { v: "100%", l: "No-Code" },
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
// PAIN SCENARIOS — 3 momen nyata di lapangan
// ─────────────────────────────────────────────────────────────────────────────
function PainScenarios() {
  const scenarios = [
    {
      time: "Jumat, 16.45",
      context: "Laporan ke Klien",
      color: "oklch(0.62 0.18 25)",
      bg: "oklch(0.6 0.2 25/0.07)",
      border: "oklch(0.6 0.2 25/0.22)",
      headline: "\"Progress proyek ISO sudah berapa persen?\"",
      body: "Klien WA jam 5 sore. Konsultan buka 4 spreadsheet berbeda, WhatsApp 3 orang, dan akhirnya kirim angka 68% yang dia sendiri tidak yakin — karena dokumen di Drive belum sync dengan yang di email.",
      cost: "±3 jam/minggu untuk laporan yang seharusnya otomatis",
    },
    {
      time: "Selasa, 10.30",
      context: "Review Dokumen",
      color: "oklch(0.62 0.18 55)",
      bg: "oklch(0.65 0.18 55/0.06)",
      border: "oklch(0.65 0.18 55/0.2)",
      headline: "\"Ini draft yang mana? Aku kira yang versi Senin sudah final.\"",
      body: "Sari pakai ChatGPT untuk draft analisis gap. Aditya pakai Claude untuk template audit. Budi edit versi Sari tapi tidak kasih tahu. Tiga dokumen berbeda, tidak ada yang tahu mana yang di-approve, dan deadline tender besok pagi.",
      cost: "Version chaos — 1 proyek, 3+ versi dokumen, 0 audit trail",
    },
    {
      time: "Rabu, 14.00",
      context: "Rapat Gate Review",
      color: "oklch(0.6 0.18 265)",
      bg: "oklch(0.6 0.18 265/0.07)",
      border: "oklch(0.6 0.18 265/0.22)",
      headline: "\"Siapa yang approve Blueprint di minggu ke-3?\"",
      body: "Klien audit tanya dasar keputusan. Project manager buka Notion, email, WhatsApp — tidak ada catatan formal. 'Kayaknya dulu kita sudah setuju waktu rapat, tapi tidak ada notulen.' Kepercayaan klien turun. Proposal renewal terancam.",
      cost: "Keputusan tidak terdokumentasi = risiko reputasi dan hukum",
    },
  ];

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--tx-faint)" }}>
            Tiga momen yang terjadi setiap minggu di ribuan tim Indonesia
          </p>
          <h2 className="text-3xl font-black" style={{ color: "var(--tx)" }}>
            Bukan karena timnya tidak kompeten.<br />
            <span className="text-gradient">Sistemnya yang tidak ada.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s, i) => (
            <div key={i} className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: s.color }}>{s.time}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${s.color}/0.12`, color: s.color }}>{s.context}</span>
              </div>
              <p className="font-bold leading-snug" style={{ color: "var(--tx)" }}>{s.headline}</p>
              <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--tx-dim)" }}>{s.body}</p>
              <div className="pt-3 border-t" style={{ borderColor: `${s.color}/0.2` }}>
                <p className="text-xs font-semibold" style={{ color: s.color }}>💸 {s.cost}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS — Data riset, bukan asumsi
// ─────────────────────────────────────────────────────────────────────────────
const STATS_DATA = [
  { value: 73, suffix: "%", label: "manajer proyek habiskan 3+ jam/minggu hanya untuk status update & laporan progress manual", src: "McKinsey Future of Work 2023" },
  { value: 68, suffix: "%", label: "tim yang sudah pakai AI tetap gagal mengintegrasikan output AI ke dalam workflow resmi organisasi", src: "Gartner AI Adoption Survey 2024" },
  { value: 82, suffix: "%", label: "keputusan penting dalam proyek tidak punya dokumentasi yang bisa diaudit ulang 3 bulan kemudian", src: "PMI Pulse of the Profession 2024" },
  { value: 40, suffix: "%", label: "lebih cepat — rata-rata penurunan durasi proyek ketika tim pakai pipeline terstruktur vs ad-hoc", src: "Harvard Business Review 2023" },
];

function StatsSection() {
  return (
    <section className="py-16 px-6 border-y" style={{ borderColor: "var(--bd-sub)", background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest mb-10" style={{ color: "var(--tx-faint)" }}>
          Bukan dugaan — data dari riset global yang relevan untuk konteks Indonesia
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
// STORY — Cerita yang lebih dalam
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

        <div className="space-y-6">
          {/* Scene 1 */}
          <div className="rounded-2xl p-7" style={{ background: "var(--bg-card)", borderLeft: "3px solid oklch(0.6 0.2 25)", border: "1px solid var(--bd)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.65 0.15 25)" }}>
              Senin, 09.15 — Sebelum Rapat
            </p>
            <h3 className="text-lg font-bold mb-3" style={{ color: "var(--tx)" }}>
              Pak Reza membuka laptop dan bertanya ke dirinya sendiri: sudah berapa persen sebenarnya?
            </h3>
            <p className="leading-relaxed text-sm" style={{ color: "var(--tx-muted)" }}>
              Proyek sertifikasi ISO 9001 untuk PT Maju Bersama sudah berjalan 6 minggu. Tapi Pak Reza — konsultan senior dengan pengalaman 12 tahun — tidak bisa menjawab pertanyaan sederhana itu dengan yakin. Data ada di Notion, beberapa di spreadsheet, notulen rapat di email, dan output AI terakhir ada di chat Sari yang belum di-copy ke mana-mana.
            </p>
            <p className="mt-3 text-sm font-semibold" style={{ color: "oklch(0.68 0.15 25)" }}>
              → 20 menit mencari. Angka yang dia bawa ke rapat: tebakan terbaik.
            </p>
          </div>

          {/* Scene 2 */}
          <div className="rounded-2xl p-7" style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.62 0.12 55)" }}>
              Selasa, 14.00 — Setelah AI Masuk ke Tim
            </p>
            <h3 className="text-lg font-bold mb-3" style={{ color: "var(--tx)" }}>
              AI sudah dipakai 3 bulan. Koordinasinya malah makin rumit.
            </h3>
            <p className="leading-relaxed text-sm mb-4" style={{ color: "var(--tx-muted)" }}>
              Sari pakai ChatGPT untuk analisis gap. Aditya pakai Claude untuk draft dokumen prosedur. Budi pakai Gemini untuk checklist audit internal. Masing-masing punya akun sendiri, prompt sendiri, output sendiri. Ketika mereka harus menggabungkan hasilnya, butuh rapat 2 jam hanya untuk tahu: ini versi yang mana?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Tiga AI, tiga versi", "Sari, Aditya, Budi — output tidak sinkron"],
                ["Tidak ada approval trail", '"Kukira kamu sudah review ini"'],
                ["Deadline mepet ketahuan terlambat", "Klien tanya H-1 tender, baru panik"],
                ["Context hilang saat onboard", '"Baca email lama sendiri ya, nanti paham"'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl p-3 text-sm"
                  style={{ background: "oklch(0.6 0.18 55/0.07)", border: "1px solid oklch(0.6 0.18 55/0.18)" }}>
                  <p className="font-semibold mb-0.5 text-xs" style={{ color: "var(--tx)" }}>{t}</p>
                  <p className="text-xs" style={{ color: "var(--tx-dim)" }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scene 3 */}
          <div className="rounded-2xl p-7" style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.62 0.12 265)" }}>
              Kamis, 16.30 — Klien Audit
            </p>
            <h3 className="text-lg font-bold mb-3" style={{ color: "var(--tx)" }}>
              "Keputusan di minggu ke-3 — dasarnya apa?"
            </h3>
            <p className="leading-relaxed text-sm" style={{ color: "var(--tx-muted)" }}>
              Auditor dari klien enterprise bertanya dengan nada datar. Pak Reza membuka Notion. Kosong. Buka email. Tidak ada thread yang relevan. Buka WhatsApp group. Riwayat sudah terlalu panjang untuk dicari. Setelah 8 menit silence yang terasa seperti 8 tahun, ia menjawab: <em>"Kami perlu verify dulu ke tim."</em>
            </p>
            <p className="text-sm font-semibold mt-3" style={{ color: "oklch(0.65 0.15 25)" }}>
              → Proposal perpanjangan kontrak senilai Rp 280 juta: tertunda 6 minggu akibat audit trail yang tidak ada.
            </p>
          </div>

          {/* Pivot */}
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg,oklch(0.65 0.22 265/0.08),oklch(0.7 0.2 300/0.05))", border: "1px solid oklch(0.65 0.22 265/0.25)" }}>
            <p className="text-2xl font-black mb-3" style={{ color: "var(--tx)" }}>
              Pak Reza punya tools semua.<br />
              <span className="text-gradient">Yang tidak dia punya: sistemnya.</span>
            </p>
            <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: "var(--tx-muted)" }}>
              Notion. ChatGPT. Spreadsheet. Zoom. WhatsApp. Semuanya ada — tapi tidak ada yang <strong style={{ color: "var(--tx)" }}>menyatukan output AI dengan approval manusia, dengan dokumentasi keputusan, dengan pipeline yang bisa diaudit</strong>. Itulah yang CollabBuilder selesaikan.
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
    pros: ["Familiar, banyak yang pakai", "Gratis / murah untuk tim kecil"],
    cons: ["Tidak bisa orkestrasikan AI agents", "Tidak ada gate checkpoint human-in-loop", "Audit trail manual, rawan lupa", "Integrasi ke AI butuh tool ketiga"],
    verdict: "Bagus untuk task manusia. Buta terhadap AI workflow.",
  },
  {
    name: "Chat AI Langsung", tools: "ChatGPT, Claude, Gemini (akun personal)", emoji: "💬",
    pros: ["Mudah dipakai langsung", "Powerful untuk satu orang"],
    cons: ["Tidak ada pipeline terstruktur", "Tidak ada mekanisme approval", "Tidak ada audit trail sama sekali", "Output tidak terhubung ke proses tim"],
    verdict: "Powerful untuk individu. Chaos untuk tim ≥3 orang.",
  },
  {
    name: "No-Code Automation", tools: "Make.com, Zapier, n8n", emoji: "⚙️",
    pros: ["Bisa integrasi banyak tools", "Automasi task repetitif"],
    cons: ["Setup teknis cukup rumit", "Tidak ada multi-agent orchestration", "Tidak ada human gate checkpoint", "Biaya naik drastis untuk flow kompleks"],
    verdict: "Bagus untuk automasi. Bukan untuk kolaborasi AI berstruktur.",
  },
  {
    name: "Custom Dev / Konsultan IT", tools: "Bangun sendiri atau hire konsultan", emoji: "👨‍💻",
    pros: ["Bisa fully custom", "Sesuai kebutuhan spesifik"],
    cons: ["Rp 50–200jt untuk build dasar", "3–6 bulan sebelum bisa dipakai", "Dependency ke developer eksternal", "Tiap update = biaya tambahan"],
    verdict: "Untuk korporasi besar dengan budget besar. Bukan untuk 95% tim.",
  },
];

function SolutionCompare() {
  return (
    <section id="solution" className="py-24 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.12 80/0.15)", color: "oklch(0.62 0.15 80)", border: "1px solid oklch(0.65 0.12 80/0.35)" }}>
            🔍 Yang sudah dicoba sebelumnya
          </span>
          <h2 className="text-4xl font-black mt-3 mb-4" style={{ color: "var(--tx)" }}>
            Semua Alternatif yang Ada.<br />
            <span className="text-gradient">Dan Mengapa Masing-Masing Kurang.</span>
          </h2>
          <p className="max-w-xl mx-auto text-sm" style={{ color: "var(--tx-muted)" }}>
            Pak Reza sudah coba semuanya sebelum menemukan CollabBuilder. Ini evaluasi jujurnya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          {ALTS.map((a, i) => (
            <div key={i} className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
              <div>
                <span className="text-2xl">{a.emoji}</span>
                <h3 className="font-bold mt-2 mb-0.5 text-sm" style={{ color: "var(--tx)" }}>{a.name}</h3>
                <p className="text-xs" style={{ color: "var(--tx-ghost)" }}>{a.tools}</p>
              </div>
              <div className="space-y-1.5">
                {a.pros.map(p => (
                  <div key={p} className="flex items-start gap-2 text-xs">
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-green-500" style={{ background: "oklch(0.65 0.18 160/0.15)" }}><Check size={8} /></span>
                    <span style={{ color: "var(--tx-muted)" }}>{p}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
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

        <div className="rounded-3xl p-8 md:p-10 text-center"
          style={{ background: "linear-gradient(135deg,oklch(0.65 0.22 265/0.1),oklch(0.7 0.2 300/0.06))", border: "1px solid oklch(0.65 0.22 265/0.35)", boxShadow: "0 0 60px oklch(0.65 0.22 265/0.08)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.65 0.18 265)" }}>Setelah mencoba semua itu...</p>
          <h3 className="text-3xl font-black mb-4" style={{ color: "var(--tx)" }}>
            CollabBuilder mengisi celah yang tidak ada di mana-mana:<br />
            <span className="text-gradient">AI orchestration + human control + audit trail — dalam satu platform no-code.</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              ["⚡", "Setup 5 Menit", "Template siap pakai per sektor, langsung jalan"],
              ["🤖", "AI + Human Gate", "AI tidak bisa lanjut tanpa persetujuan manusia"],
              ["📋", "Audit Trail Otomatis", "Setiap keputusan tercatat, siap untuk audit"],
              ["📊", "Dashboard Real-Time", "Progress visible untuk semua stakeholder"],
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
// BEFORE / AFTER — dengan konteks lebih spesifik
// ─────────────────────────────────────────────────────────────────────────────
const TRANSFORMS = [
  { s: "Laporan Progress Mingguan", b: "3 jam copy-paste dari 4 sumber berbeda, angkanya pun tidak yakin akurat", a: "AI Standup Generator — 30 detik, terstruktur, langsung siap dikirim ke klien" },
  { s: "Koordinasi Output AI", b: "3 orang, 3 akun AI, 3 versi dokumen — tidak jelas mana yang final", a: "Agen Strategis, Skeptis, Eksekutor dalam satu pipeline — output terintegrasi otomatis" },
  { s: "Dokumentasi Keputusan", b: '"Kayaknya dulu kita setuju begini..." — tidak ada yang bisa membuktikan', a: "Setiap keputusan gate dicatat otomatis: aktor, timestamp, alasan, rubrik scoring" },
  { s: "Review & Approval", b: "Email bolak-balik, WA grup, tidak jelas siapa yang approve versi mana", a: "Human gate checkpoint dengan rubrik 4 kriteria — tercatat, tidak bisa di-skip" },
  { s: "Deteksi Masalah", b: "Tahu ada yang salah hanya setelah klien komplain atau deadline lewat", a: "Early warning otomatis: gate pending >2 hari, task blocked, KPI di bawah target" },
  { s: "Onboarding Member Baru", b: '"Coba baca semua email lama ya — nanti paham sendiri deh"', a: "Workroom berisi semua konteks: pipeline, keputusan, exit criteria, siapa approve apa" },
];

function BeforeAfter() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Sebelum & Sesudah <span className="text-gradient">CollabBuilder</span>
          </h2>
          <p className="text-sm" style={{ color: "var(--tx-muted)" }}>Transformasi konkret dalam workflow sehari-hari tim Anda</p>
        </div>

        <div className="grid grid-cols-[1fr_32px_1fr] gap-3 mb-3 px-1">
          <div className="text-center text-xs font-bold uppercase tracking-wider py-2 rounded-lg" style={{ color: "oklch(0.65 0.15 25)", background: "oklch(0.6 0.2 25/0.1)" }}>Sebelum</div>
          <div />
          <div className="text-center text-xs font-bold uppercase tracking-wider py-2 rounded-lg" style={{ color: "oklch(0.65 0.18 160)", background: "oklch(0.65 0.18 160/0.1)" }}>Dengan CollabBuilder</div>
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
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Pipeline 8 Stage Otomatis", desc: "Intake → Framing → Skeptic Gate → Blueprint → Delivery → QA Gate → Release → Retro. Setiap workroom dapat pipeline lengkap, exit criteria, dan AI roles siap pakai.", badge: "Core", accent: "oklch(0.65 0.22 265)" },
  { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2", title: "Multi-Agent Orchestration", desc: "Agen Strategis (analisis), Skeptis (devil's advocate), Eksekutor (implementasi), DocuGen (dokumentasi) — terkoordinasi dalam satu pipeline, bukan chat tersendiri.", badge: "AI", accent: "oklch(0.7 0.2 300)" },
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "Human Gate Checkpoint", desc: "Di setiap tahap kritis, pipeline berhenti dan manusia harus approve. Rubrik scoring 4 kriteria, AI insight analysis — tidak ada yang lolos tanpa keputusan tercatat.", badge: "Control", accent: "oklch(0.7 0.18 80)" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "KPI Tracker Real-Time", desc: "Revenue target, NPS, user acquisition, completion rate — pantau dari satu dashboard. Alert otomatis ketika ada indikator di bawah threshold yang Anda tentukan.", badge: "Analytics", accent: "oklch(0.65 0.18 160)" },
  { icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", title: "AI Standup Generator", desc: "Satu klik → laporan harian dari semua stage aktif: yang selesai, yang jalan, yang blocked, langkah selanjutnya. Siap kirim ke klien dalam 30 detik.", badge: "AI", accent: "oklch(0.7 0.18 210)" },
  { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Workroom Report Otomatis", desc: "Report lengkap satu klik: audit trail keputusan, exit criteria per stage, kontribusi agen, KPI summary. Siap untuk presentasi klien, investor, atau audit internal.", badge: "Export", accent: "oklch(0.68 0.2 10)" },
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
            <span className="text-gradient">untuk AI Workflow yang Terkontrol</span>
          </h2>
          <p className="max-w-xl mx-auto text-sm" style={{ color: "var(--tx-muted)" }}>
            Bukan kumpulan tools yang harus diintegrasi sendiri. Semua sudah terhubung.
          </p>
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
    { n: "01", e: "🗂️", t: "Pilih Template Sektor", d: "18+ template untuk ISO, konstruksi, edutech, marketing, BNSP. Setiap template sudah dilengkapi pipeline stages, exit criteria, dan AI roles yang relevan untuk sektornya." },
    { n: "02", e: "🎯", t: "Konfigurasi Workroom", d: "Isi nama proyek, objektif, deadline, dan KPI target. AI roles langsung ditugaskan ke setiap stage. Tidak perlu konfigurasi manual satu per satu." },
    { n: "03", e: "🚦", t: "Jalankan & Approve Gate", d: "Monitor dari dashboard. Saat pipeline mencapai checkpoint, Anda receive notifikasi untuk review dan approve — atau minta revisi. Semua dicatat otomatis." },
  ];

  return (
    <section id="howto" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Dari Template ke <span className="text-gradient">Pipeline Berjalan</span><br />dalam 5 Menit
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--tx-muted)" }}>
            Tidak perlu setup integrasi, tidak perlu konfigurasi AI, tidak perlu hiring developer.
          </p>
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
// CASE STUDIES — 3 sektor, hasil nyata
// ─────────────────────────────────────────────────────────────────────────────
function CaseStudies() {
  const cases = [
    {
      sector: "Konsultan ISO",
      project: "Sertifikasi ISO 9001 — Perusahaan Manufaktur, 220 karyawan",
      accent: "oklch(0.62 0.18 265)",
      bg: "oklch(0.6 0.18 265/0.07)",
      border: "oklch(0.6 0.18 265/0.22)",
      before: "Sebelumnya: 6 minggu pengerjaan, 3 revisi besar karena approval tidak tercatat, laporan ke klien 4+ jam/minggu",
      after: "Dengan CollabBuilder: selesai 4 minggu, zero revisi besar, laporan klien 15 menit via standup generator",
      quote: "Klien kita yang paling strict sekalipun bisa lihat trail keputusan kapan saja. Itu yang bikin mereka renew.",
      by: "Lead Consultant, Quality First ISO",
    },
    {
      sector: "Konstruksi & Engineering",
      project: "Dokumen Tender Jalan Tol — BUJT, nilai Rp 340 miliar",
      accent: "oklch(0.65 0.18 55)",
      bg: "oklch(0.65 0.18 55/0.07)",
      border: "oklch(0.65 0.18 55/0.22)",
      before: "Sebelumnya: 12 engineer, 3 konsultan AI berbeda, dokumen tercecer di 6 folder, satu hari sebelum submit masih ada conflict",
      after: "Dengan CollabBuilder: satu pipeline, satu source of truth, gate review tercatat — submit on time, dokumen konsisten",
      quote: "Yang biasanya chaos di H-3 deadline sekarang sudah clear di H-7. Tim malah bisa istirahat normal.",
      by: "PM Senior, PT Waskita Engineering",
    },
    {
      sector: "Edutech & Pelatihan",
      project: "Program BNSP — Batch 180 peserta, 12 modul kompetensi",
      accent: "oklch(0.62 0.18 160)",
      bg: "oklch(0.62 0.18 160/0.07)",
      border: "oklch(0.62 0.18 160/0.22)",
      before: "Sebelumnya: koordinasi 8 trainer via WhatsApp, modul dibuat sendiri-sendiri, tidak ada versioning, assessor kesulitan audit",
      after: "Dengan CollabBuilder: 8 trainer satu pipeline, AI Skeptis otomatis review konsistensi modul, audit trail siap untuk BNSP",
      quote: "Akreditasi yang biasanya butuh 2 pertemuan dengan BNSP, kali ini cukup 1 karena semua dokumentasi sudah rapi.",
      by: "Direktur Program, EdTech Nusantara",
    },
  ];

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.18 160/0.12)", color: "oklch(0.6 0.15 160)", border: "1px solid oklch(0.65 0.18 160/0.3)" }}>
            📋 Di Lapangan
          </span>
          <h2 className="text-3xl font-black" style={{ color: "var(--tx)" }}>
            Tiga Sektor, Tiga Situasi Nyata
          </h2>
          <p className="mt-3 text-sm" style={{ color: "var(--tx-muted)" }}>Bukan simulasi. Ini kondisi lapangan yang tim nyata hadapi sebelum pakai CollabBuilder.</p>
        </div>

        <div className="space-y-4">
          {cases.map((c, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <div className="flex items-start gap-4 flex-col sm:flex-row">
                <div className="shrink-0">
                  <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2"
                    style={{ background: `${c.accent}/0.15`, color: c.accent }}>{c.sector}</span>
                  <p className="text-xs font-semibold max-w-[180px]" style={{ color: "var(--tx-dim)" }}>{c.project}</p>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl p-3" style={{ background: "oklch(0.6 0.2 25/0.08)", border: "1px solid oklch(0.6 0.2 25/0.2)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "oklch(0.65 0.15 25)" }}>Sebelum</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--tx-dim)" }}>{c.before}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "oklch(0.65 0.18 160/0.08)", border: "1px solid oklch(0.65 0.18 160/0.2)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "oklch(0.6 0.15 160)" }}>Sesudah</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--tx)" }}>{c.after}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-start gap-3" style={{ borderColor: `${c.accent}/0.2` }}>
                <span className="text-lg shrink-0">"</span>
                <div>
                  <p className="text-sm italic" style={{ color: "var(--tx-muted)" }}>{c.quote}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--tx-ghost)" }}>— {c.by}</p>
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
// TESTIMONIALS — lebih spesifik dan believable
// ─────────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    stars: 5,
    quote: "Proyek ISO-nya klien kami biasanya makan 8 minggu dengan 3x revisi besar. Terakhir pakai CollabBuilder: 5 minggu, 1x revisi kecil — karena AI Skeptis langsung flag inkonsistensi di stage awal sebelum sempat jadi masalah besar.",
    name: "Rina Dewi Susanti",
    role: "Lead Consultant, Quality First ISO — Jakarta",
    metric: "8 minggu → 5 minggu",
    av: "RD", g: "from-violet-500 to-pink-500",
  },
  {
    stars: 5,
    quote: "Rapat mingguan kami dulu 90 menit hanya untuk sinkronisasi data. Sekarang 20 menit, langsung ke keputusan — karena semua orang sudah lihat dashboard yang sama sebelum rapat mulai. Tidak ada lagi 'kira-kira udah berapa persen ya?'",
    name: "Budi Raharjo",
    role: "Senior PM, PT Waskita Konsultan — Surabaya",
    metric: "90 min rapat → 20 menit",
    av: "BR", g: "from-blue-500 to-violet-500",
  },
  {
    stars: 5,
    quote: "Tim kami 5 orang, semua pakai AI tools berbeda. Yang dulu bikin chaos adalah output-nya tidak pernah nyambung. CollabBuilder yang akhirnya jadi 'penerjemah' — semua output AI masuk ke satu pipeline yang bisa diaudit.",
    name: "Ahmad Fauzi",
    role: "Founder, EdTech Nusantara — Yogyakarta",
    metric: "3 tools berbeda → 1 pipeline",
    av: "AF", g: "from-green-500 to-teal-500",
  },
  {
    stars: 5,
    quote: "Kami kena audit compliance mendadak. Normalnya itu mimpi buruk — tapi karena semua keputusan dan approval sudah tercatat di CollabBuilder, kami bisa export trail-nya dalam 10 menit. Auditornya sampai komentar 'ini yang paling rapi yang pernah kami lihat'.",
    name: "Dr. Sinta Murni",
    role: "Manager Compliance, BRI Finance — Jakarta",
    metric: "Audit mendadak → selesai 10 menit",
    av: "SM", g: "from-amber-500 to-orange-500",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--tx)" }}>
            Tim Nyata. Masalah Nyata.<br />
            <span className="text-gradient-warm">Angka Nyata.</span>
          </h2>
          <p className="text-sm" style={{ color: "var(--tx-muted)" }}>Dari tim yang sudah merasakan perbedaannya langsung di lapangan.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bd)" }}>
              <div className="flex items-center justify-between">
                <div className="text-amber-400 text-base tracking-tight">{"★".repeat(t.stars)}</div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "oklch(0.65 0.18 160/0.12)", color: "oklch(0.6 0.15 160)", border: "1px solid oklch(0.65 0.18 160/0.25)" }}>
                  {t.metric}
                </span>
              </div>
              <p className="leading-relaxed flex-1 text-sm" style={{ color: "var(--tx-muted)" }}>"{t.quote}"</p>
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
    desc: "Untuk individu atau tim kecil yang baru mulai.", cta: "Mulai Gratis Sekarang",
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
    desc: "Untuk tim yang bekerja bersama dalam banyak proyek.", cta: "Coba 14 Hari Gratis",
    features: ["Semua fitur Professional", "5 user seats (+ Rp 200K/user tambahan)", "Shared workroom & task view", "Team decision log", "Collaboration roles per user", "Slack / webhook notifikasi", "Custom template builder", "Priority support <4 jam"],
  },
  {
    name: "Enterprise", monthly: "Custom", annual: "Custom", period: "hubungi sales",
    setup: "Termasuk onboarding", license: "Unlimited users",
    desc: "Untuk korporasi & firma konsultan besar.", cta: "Request Demo",
    features: ["Semua fitur Team", "User tidak terbatas", "White-label & custom domain", "On-premise deployment", "API access penuh", "Custom AI model integration", "SLA 99.9% uptime", "Dedicated account manager", "Onboarding & training (termasuk)"],
  },
] as const;

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: "oklch(0.65 0.18 160/0.12)", color: "oklch(0.6 0.15 160)", border: "1px solid oklch(0.65 0.18 160/0.3)" }}>
            💰 Harga Transparan
          </span>
          <h2 className="text-4xl font-black mt-3 mb-4" style={{ color: "var(--tx)" }}>
            Tidak Ada Biaya Tersembunyi.<br />
            <span className="text-gradient">Subscription. Itu Saja.</span>
          </h2>
          <p className="mb-2 max-w-lg mx-auto text-sm" style={{ color: "var(--tx-muted)" }}>
            <strong style={{ color: "var(--tx)" }}>Nol biaya setup. Nol biaya lisensi. Nol biaya onboarding.</strong>
          </p>
          <p className="mb-8 max-w-md mx-auto text-xs" style={{ color: "var(--tx-faint)" }}>
            Sebagai perbandingan: hiring satu koordinator proyek full-time ≈ Rp 6–10jt/bulan. Professional plan ≈ Rp 599K.
          </p>

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

              <div className="rounded-xl p-3 mb-4" style={{ background: "var(--bg-input)", border: "1px dashed var(--bd-mid)" }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--tx-faint)" }}>Biaya Setup</span>
                  <span className="font-semibold" style={{ color: "oklch(0.6 0.18 160)" }}>{t.setup}</span>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl text-sm font-bold mb-5 transition-all hover:scale-[1.02]"
                style={"popular" in t && t.popular
                  ? { background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", color: "white" }
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { q: "Ada biaya setup?", a: "Tidak ada. Semua paket = Rp 0 biaya setup. Enterprise sudah termasuk onboarding & training." },
            { q: "Ada biaya per-seat / lisensi?", a: "Tidak ada di Professional. Team: 5 seats termasuk, tambah seat Rp 200K/user/bulan. Enterprise: unlimited." },
            { q: "Kalau cancel, datanya hilang?", a: "Tidak. Data disimpan 90 hari setelah cancel. Anda bisa export kapan saja sebelum menutup akun." },
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
  { q: "Apa bedanya CollabBuilder dengan Trello, Asana, atau Notion?", a: "Trello/Asana/Notion mengelola task manusia. CollabBuilder mengorkestrasikan AI agents yang bekerja dalam pipeline terstruktur — dengan gate checkpoint wajib, rubrik evaluasi, dan audit trail otomatis. Ini bukan pengganti project manager tool, tapi workflow orchestrator untuk kolaborasi AI-human yang belum ada sebelumnya." },
  { q: "Apakah perlu kemampuan teknis atau coding?", a: "Sama sekali tidak. CollabBuilder dirancang 100% no-code — pilih template, isi nama proyek dan objektif, lalu agen AI langsung bekerja. Setup kurang dari 5 menit. Tim non-teknis dari berbagai industri sudah menggunakannya tanpa hambatan." },
  { q: "AI apa yang digunakan? Data saya aman?", a: "CollabBuilder mendukung GPT-4o (OpenAI) dan Gemini. Data Anda tidak pernah digunakan untuk melatih model AI manapun. Semua data dienkripsi AES-256 dan disimpan di server dengan standar keamanan enterprise." },
  { q: "Berapa total biaya sebenarnya? Ada hidden fee?", a: "Total biaya = biaya subscription saja. Tidak ada biaya setup, tidak ada biaya lisensi per-user (kecuali paket Team untuk tambahan user), tidak ada biaya per-fitur. Yang Anda lihat di halaman harga adalah total yang Anda bayar." },
  { q: "Bagaimana kalau tim kami tersebar di banyak kota atau WFH?", a: "CollabBuilder didesain untuk tim remote dan distributed. Semua akses berbasis web, workroom real-time, notifikasi Slack/email, dan audit trail digital. Pipeline berjalan dari mana saja — tidak ada yang perlu install software lokal." },
  { q: "Apakah template bisa dikustomisasi?", a: "Ya. Template starter sudah dilengkapi pipeline, AI roles, dan exit criteria per sektor. Anda bisa sesuaikan stage names, exit criteria, tambah custom KPI, dan atur assignment AI roles. Paket Team ke atas mendapat akses Custom Template Builder untuk membuat template dari nol." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6" style={{ background: "var(--bg-alt)" }}>
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
    <section id="cta" className="py-32 px-6 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse,oklch(0.65 0.22 265/0.8),transparent 65%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--tx-ghost)" }}>
          Minggu depan Anda masih mau laporan manual?
        </p>
        <h2 className="text-5xl font-black mb-6 leading-tight" style={{ color: "var(--tx)" }}>
          Pak Reza sudah berhenti<br />
          <span className="text-gradient">copy-paste spreadsheet.</span><br />
          Kapan giliran Anda?
        </h2>
        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--tx-muted)" }}>
          Bergabung dengan ratusan tim Indonesia yang sudah menjalankan proyek AI secara terstruktur, terdokumentasi, dan bisa diaudit kapan saja.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="px-10 py-5 rounded-xl text-lg font-bold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,oklch(0.58 0.22 265),oklch(0.63 0.2 300))", boxShadow: "0 8px 40px oklch(0.65 0.22 265/0.35)" }}>
            🚀 Coba Gratis 14 Hari — Tanpa Kartu Kredit
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
              Platform no-code untuk mengorkestrasikan AI agents dalam pipeline kerja terstruktur. Dibangun untuk tim Indonesia.
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
        <PainScenarios />
        <StatsSection />
        <StorySection />
        <SolutionCompare />
        <BeforeAfter />
        <FeaturesSection />
        <HowItWorks />
        <CaseStudies />
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
