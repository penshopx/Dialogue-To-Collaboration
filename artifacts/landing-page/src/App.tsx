import { useState } from "react";

// ── Icons (inline SVG components for zero-dep) ──────────────────────────────

const Icon = ({ d, size = 20, stroke = "currentColor", fill = "none", strokeWidth = 1.8 }: {
  d: string | string[]; size?: number; stroke?: string; fill?: string; strokeWidth?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDown = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Data ─────────────────────────────────────────────────────────────────────

const PAINS = [
  {
    icon: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    title: "Deadline Terlewat Tanpa Peringatan",
    desc: "Tim tidak tahu progress sebenarnya. Laporan manual memakan waktu 2–3 jam per minggu. Ketika masalah terdeteksi, sudah terlambat untuk diperbaiki.",
  },
  {
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    title: "Koordinasi AI ↔ Human Masih Manual",
    desc: "AI menghasilkan output, tapi siapa yang review? Kapan keputusan diambil? Tidak ada sistem. Satu email terlewat = satu deliverable hilang.",
  },
  {
    icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    title: "Keputusan Tidak Terdokumentasi",
    desc: "\"Kenapa kita pilih vendor ini?\" — tidak ada yang ingat. Audit trail kosong. Kalau ada masalah, tidak ada yang bisa dimintai pertanggungjawaban.",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "KPI Tersebar di Banyak Spreadsheet",
    desc: "Satu project punya 5 file Excel berbeda. Tidak ada single source of truth. Rapat bulanan: 30 menit pertama cuma menyinkronkan data.",
  },
];

const FEATURES = [
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "8-Stage Pipeline Otomatis",
    desc: "Dari Intake hingga Retro — setiap workroom mendapat pipeline terstruktur dengan gate checkpoint wajib. Tidak ada stage yang terlewat.",
    color: "from-blue-500/20 to-violet-500/10 border-blue-500/25",
    iconColor: "text-blue-400",
  },
  {
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2",
    title: "Multi-Agent Orchestration",
    desc: "Agen Strategis, Skeptis, Eksekutor bekerja terkoordinasi. Masing-masing punya peran, fungsi, dan domain expertise berbeda.",
    color: "from-violet-500/20 to-purple-500/10 border-violet-500/25",
    iconColor: "text-violet-400",
  },
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Human Gate Checkpoint",
    desc: "Sebelum pipeline lanjut, manusia harus approve. Rubrik scoring 4 kriteria + AI insight. Tidak ada pipeline yang lepas kontrol.",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/25",
    iconColor: "text-amber-400",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "KPI Tracker Real-Time",
    desc: "Pantau Revenue Growth, NPS, User Acquisition langsung dari dashboard. Alert otomatis ketika KPI butuh perhatian.",
    color: "from-green-500/20 to-emerald-500/10 border-green-500/25",
    iconColor: "text-green-400",
  },
  {
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    title: "AI Standup Generator",
    desc: "Satu klik → laporan harian terstruktur dari semua stage aktif. Tidak perlu lagi nulis manual. Share ke tim dalam 30 detik.",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/25",
    iconColor: "text-cyan-400",
  },
  {
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Laporan & Export Otomatis",
    desc: "Workroom Report lengkap dengan satu klik. Export ke Markdown, cetak PDF. Audit trail semua keputusan tersimpan rapi.",
    color: "from-rose-500/20 to-pink-500/10 border-rose-500/25",
    iconColor: "text-rose-400",
  },
];

const SECTORS = [
  { name: "Konstruksi & Engineering", icon: "🏗️" },
  { name: "ISO & Sertifikasi", icon: "✅" },
  { name: "Edutech & Pelatihan", icon: "🎓" },
  { name: "Marketing & Branding", icon: "📢" },
  { name: "BNSP & Kompetensi", icon: "📋" },
  { name: "Konsultan Bisnis", icon: "💼" },
  { name: "Startup & Product", icon: "🚀" },
  { name: "Keuangan & Audit", icon: "📊" },
];

const STEPS = [
  {
    num: "01",
    title: "Pilih Template Sektor",
    desc: "Pilih dari 18+ template yang dirancang khusus untuk industri Anda. Setiap template sudah include stage pipeline, peran AI, dan exit criteria.",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
  {
    num: "02",
    title: "Atur Workroom & Orkestrasi Agen",
    desc: "Tetapkan nama, objektif, deadline, dan KPI target. Agen AI langsung siap di posisi masing-masing — Strategis, Skeptis, Eksekutor.",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    num: "03",
    title: "Jalankan Pipeline & Approve Gate",
    desc: "Monitor progress real-time. Ketika pipeline sampai Gate checkpoint, Anda yang memutuskan: Setujui, Revisi, atau Tolak. Semua terdokumentasi otomatis.",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
];

interface PricingTier {
  name: string;
  badge?: string;
  price: string;
  period: string;
  desc: string;
  cta: string;
  popular?: boolean;
  features: string[];
  notIncluded?: string[];
}

const PRICING: PricingTier[] = [
  {
    name: "Starter",
    price: "Gratis",
    period: "selamanya",
    desc: "Untuk individu yang ingin mencoba platform.",
    cta: "Mulai Gratis",
    features: [
      "3 workroom aktif",
      "2 template sektor",
      "Pipeline 8 stage standar",
      "10 AI tasks / bulan",
      "Export Markdown",
      "Laporan dasar",
    ],
    notIncluded: [
      "AI Standup Generator",
      "KPI Tracker lanjutan",
      "Clone Workroom",
      "Priority support",
    ],
  },
  {
    name: "Professional",
    badge: "Paling Populer",
    price: "Rp 599.000",
    period: "per bulan",
    desc: "Untuk konsultan & tim kecil yang butuh hasil nyata.",
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
    price: "Rp 1.499.000",
    period: "per bulan / 5 users",
    desc: "Untuk tim yang bekerja bersama di satu platform.",
    cta: "Mulai Trial Team",
    features: [
      "Semua fitur Professional",
      "5 user seats (+ Rp 200K/user)",
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
    price: "Custom",
    period: "hubungi kami",
    desc: "Untuk korporasi & konsultan besar.",
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
      "Onboarding & training",
    ],
  },
];

const FAQS = [
  {
    q: "Apakah perlu pengalaman teknis untuk menggunakan CollabBuilder?",
    a: "Sama sekali tidak. CollabBuilder dirancang no-code — cukup pilih template, isi nama proyek dan objektif, lalu agen AI yang bekerja. Tidak ada coding, tidak ada setup rumit.",
  },
  {
    q: "Apa bedanya CollabBuilder dengan project management tool biasa seperti Trello atau Asana?",
    a: "Trello/Asana mengelola task manusia. CollabBuilder mengorkestrasikan AI agents yang bekerja terstruktur dalam pipeline — dengan gate checkpoint wajib, rubrik evaluasi, dan audit trail otomatis. Bukan task manager, tapi workflow orchestrator.",
  },
  {
    q: "AI apa yang digunakan di balik platform ini?",
    a: "CollabBuilder mendukung GPT-4o (OpenAI) dan Gemini. Anda bisa memilih provider sesuai kebutuhan. Integrasi model lain (Claude, Llama) sedang dalam roadmap.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Data Anda dienkripsi end-to-end dan tidak pernah digunakan untuk melatih model AI. Kami menggunakan infrastruktur PostgreSQL terenkripsi dengan backup harian.",
  },
  {
    q: "Bisakah saya cancel kapan saja?",
    a: "Ya, tanpa penalti. Cancel kapan saja dari dashboard akun Anda. Untuk paket tahunan, kami berikan refund pro-rata untuk bulan yang tersisa.",
  },
  {
    q: "Apakah ada diskon untuk NGO atau lembaga pendidikan?",
    a: "Ya! Kami memberikan diskon 40% untuk organisasi non-profit, sekolah, dan universitas. Hubungi tim kami dengan email institusi untuk verifikasi.",
  },
];

const STATS = [
  { value: "18+", label: "Template Sektor" },
  { value: "32", label: "AI Agents Tersedia" },
  { value: "8", label: "Stage Pipeline" },
  { value: "100%", label: "No-Code" },
];

// ── Components ───────────────────────────────────────────────────────────────

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[oklch(0.22_0.02_265)] bg-[oklch(0.08_0.01_265/0.9)] backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            CB
          </div>
          <span className="font-bold text-lg tracking-tight">CollabBuilder</span>
          <span className="hidden sm:inline pill" style={{ background: "oklch(0.65 0.22 265 / 0.15)", color: "oklch(0.75 0.15 265)", border: "1px solid oklch(0.65 0.22 265 / 0.3)" }}>
            Beta
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[oklch(0.7_0.01_265)]">
          {[["Masalah", "pain"], ["Fitur", "features"], ["Cara Kerja", "howto"], ["Harga", "pricing"], ["FAQ", "faq"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="nav-link hover:text-white transition-colors">{label}</button>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => scrollTo("pricing")} className="text-sm text-[oklch(0.7_0.01_265)] hover:text-white transition-colors">
            Lihat Harga
          </button>
          <button
            onClick={() => scrollTo("cta")}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all animate-pulse-glow"
            style={{ background: "linear-gradient(135deg, oklch(0.6 0.22 265), oklch(0.65 0.2 300))" }}
          >
            Coba Gratis →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="space-y-1.5">
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[oklch(0.22_0.02_265)] bg-[oklch(0.08_0.01_265)] px-6 py-4 space-y-4">
          {[["Masalah", "pain"], ["Fitur", "features"], ["Cara Kerja", "howto"], ["Harga", "pricing"], ["FAQ", "faq"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-[oklch(0.7_0.01_265)] hover:text-white py-2">{label}</button>
          ))}
          <button
            onClick={() => { scrollTo("cta"); setMenuOpen(false); }}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, oklch(0.6 0.22 265), oklch(0.65 0.2 300))" }}
          >
            Coba Gratis →
          </button>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, oklch(0.65 0.22 265), transparent 70%)" }} />
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, oklch(0.7 0.2 300), transparent 70%)" }} />

        {/* Floating grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(oklch(0.3 0.02 265 / 0.1) 1px, transparent 1px), linear-gradient(90deg, oklch(0.3 0.02 265 / 0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Announcement badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm border"
          style={{ background: "oklch(0.65 0.22 265 / 0.1)", borderColor: "oklch(0.65 0.22 265 / 0.3)", color: "oklch(0.8 0.15 265)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Buku "From Dialog to Collaboration" kini hadir sebagai platform
          <span className="font-semibold ml-1">→</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          <span className="text-white">Orkestrasikan </span>
          <span className="text-gradient">AI Agents</span>
          <br />
          <span className="text-white">Bukan Sekadar </span>
          <span className="text-gradient-warm">Chat.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-[oklch(0.65_0.01_265)] max-w-2xl mx-auto mb-10 leading-relaxed">
          CollabBuilder mengubah percakapan AI menjadi <strong className="text-white">pipeline kerja terstruktur</strong> dengan gate checkpoint, KPI tracker, dan audit trail otomatis.
          <br />
          <span className="text-[oklch(0.7_0.15_265)]">No-code. 100% under your control.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="group px-8 py-4 rounded-xl text-base font-bold text-white shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, oklch(0.58 0.22 265), oklch(0.63 0.2 300))", boxShadow: "0 8px 32px oklch(0.65 0.22 265 / 0.35)" }}
          >
            🚀 Mulai Gratis Sekarang
          </button>
          <button
            onClick={() => document.getElementById("howto")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 rounded-xl text-base font-semibold border transition-all hover:bg-white/5"
            style={{ borderColor: "oklch(0.35 0.02 265)", color: "oklch(0.8 0.01 265)" }}
          >
            ▶ Lihat Cara Kerja
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border"
          style={{ borderColor: "oklch(0.22 0.02 265)", background: "oklch(0.22 0.02 265)" }}>
          {STATS.map(s => (
            <div key={s.label} className="py-6 px-4 text-center" style={{ background: "oklch(0.11 0.015 265)" }}>
              <p className="text-3xl font-black text-gradient mb-1">{s.value}</p>
              <p className="text-xs text-[oklch(0.55_0.01_265)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PainSection() {
  return (
    <section id="pain" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-16">
          <span className="pill mb-4" style={{ background: "oklch(0.6 0.22 10 / 0.15)", color: "oklch(0.7 0.15 10)", border: "1px solid oklch(0.6 0.22 10 / 0.3)" }}>
            😤 Masalah yang Familiar?
          </span>
          <h2 className="text-4xl font-black mt-4 mb-4 text-white">
            Tim Anda Pakai AI, Tapi Masih <br />
            <span className="text-gradient">Chaos di Mana-Mana?</span>
          </h2>
          <p className="text-[oklch(0.6_0.01_265)] max-w-xl mx-auto">
            AI harusnya membuat pekerjaan lebih mudah. Tapi tanpa struktur, Anda malah punya satu masalah lagi yang perlu di-manage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAINS.map((pain, i) => (
            <div key={i} className="card-glass rounded-2xl p-6 group hover:border-red-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                style={{ background: "oklch(0.6 0.22 10 / 0.15)" }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="oklch(0.7 0.2 10)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={pain.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">{pain.title}</h3>
              <p className="text-sm text-[oklch(0.58_0.01_265)] leading-relaxed">{pain.desc}</p>
            </div>
          ))}
        </div>

        {/* Bridge */}
        <div className="mt-16 text-center">
          <div className="inline-block px-8 py-6 rounded-2xl"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 265 / 0.1), oklch(0.7 0.2 300 / 0.05))", border: "1px solid oklch(0.65 0.22 265 / 0.2)" }}>
            <p className="text-xl font-bold text-white mb-2">
              Masalahnya bukan AI-nya. Masalahnya adalah <span className="text-gradient">tidak ada sistem.</span>
            </p>
            <p className="text-[oklch(0.62_0.01_265)]">
              CollabBuilder adalah sistem itu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="pill mb-4" style={{ background: "oklch(0.65 0.22 265 / 0.15)", color: "oklch(0.75 0.15 265)", border: "1px solid oklch(0.65 0.22 265 / 0.3)" }}>
            ⚡ Fitur Platform
          </span>
          <h2 className="text-4xl font-black mt-4 mb-4 text-white">
            Semua yang Anda Butuhkan <br />
            <span className="text-gradient">dalam Satu Platform</span>
          </h2>
          <p className="text-[oklch(0.6_0.01_265)] max-w-xl mx-auto">
            Dari orchestration AI hingga human approval gate — CollabBuilder menangani seluruh workflow kolaborasi Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className={`relative rounded-2xl p-6 border bg-gradient-to-br ${f.color} transition-all hover:-translate-y-1 hover:shadow-xl group`}
              style={{ transition: "all 0.2s ease" }}>
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                style={{ background: "oklch(0.08 0.01 265 / 0.6)" }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={f.iconColor}>
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[oklch(0.62_0.01_265)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="howto" className="py-24 px-6" style={{ background: "oklch(0.09 0.012 265)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="pill mb-4" style={{ background: "oklch(0.65 0.18 160 / 0.15)", color: "oklch(0.7 0.15 160)", border: "1px solid oklch(0.65 0.18 160 / 0.3)" }}>
            🔄 Cara Kerja
          </span>
          <h2 className="text-4xl font-black mt-4 mb-4 text-white">
            3 Langkah Menuju <br />
            <span className="text-gradient">Pipeline yang Berjalan Sendiri</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5"
            style={{ background: "linear-gradient(90deg, oklch(0.65 0.22 265 / 0.3), oklch(0.7 0.2 300 / 0.3))" }} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Number bubble */}
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl z-10"
                  style={{ background: "linear-gradient(135deg, oklch(0.58 0.22 265), oklch(0.63 0.2 300))", boxShadow: "0 8px 24px oklch(0.65 0.22 265 / 0.3)" }}>
                  <span className="text-xl font-black text-white">{step.num}</span>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center card-glass">
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.22 265)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.icon} />
                  </svg>
                </div>

                <h3 className="font-bold text-white text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-[oklch(0.6_0.01_265)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectorsSection() {
  return (
    <section className="py-16 px-6 border-y" style={{ borderColor: "oklch(0.18 0.02 265)" }}>
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm text-[oklch(0.55_0.01_265)] font-medium uppercase tracking-wider mb-8">
          Digunakan untuk berbagai sektor industri
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {SECTORS.map(s => (
            <span key={s.name} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium card-glass hover:border-[oklch(0.65_0.22_265/0.3)] transition-all cursor-default">
              <span>{s.icon}</span>
              <span className="text-[oklch(0.72_0.01_265)]">{s.name}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsPlaceholder() {
  const QUOTES = [
    {
      text: "Akhirnya ada platform yang bisa mengorkestrasikan AI agent dengan proper gate. Proyek konstruksi kami jadi jauh lebih terdokumentasi.",
      name: "Budi Santoso",
      role: "Project Manager, PT Bangun Jaya",
      avatar: "BS",
      color: "from-blue-500 to-violet-500",
    },
    {
      text: "KPI tracker-nya sangat membantu untuk laporan ke klien. Tidak perlu lagi copy-paste dari spreadsheet.",
      name: "Rina Wijaya",
      role: "Konsultan ISO, Quality First",
      avatar: "RW",
      color: "from-violet-500 to-pink-500",
    },
    {
      text: "AI Standup Generator menghemat minimal 2 jam per minggu untuk tim kami. ROI-nya sudah positif di bulan pertama.",
      name: "Ahmad Fauzi",
      role: "Head of Learning, EdTech Nusantara",
      avatar: "AF",
      color: "from-green-500 to-cyan-500",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="pill mb-4" style={{ background: "oklch(0.7 0.18 80 / 0.15)", color: "oklch(0.75 0.15 80)", border: "1px solid oklch(0.7 0.18 80 / 0.3)" }}>
            ⭐ Kata Pengguna
          </span>
          <h2 className="text-4xl font-black mt-4 text-white">
            Dibuktikan oleh <span className="text-gradient-warm">Tim yang Kerja Nyata</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {QUOTES.map((q, i) => (
            <div key={i} className="card-glass rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex gap-1 text-amber-400 text-sm">{"★★★★★"}</div>
              <p className="text-sm text-[oklch(0.72_0.01_265)] leading-relaxed flex-1">"{q.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "oklch(0.22 0.02 265)" }}>
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${q.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                  {q.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{q.name}</p>
                  <p className="text-xs text-[oklch(0.55_0.01_265)]">{q.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: "oklch(0.09 0.012 265)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="pill mb-4" style={{ background: "oklch(0.65 0.18 160 / 0.15)", color: "oklch(0.7 0.15 160)", border: "1px solid oklch(0.65 0.18 160 / 0.3)" }}>
            💰 Harga Transparan
          </span>
          <h2 className="text-4xl font-black mt-4 mb-4 text-white">
            Pilih Paket yang <span className="text-gradient">Tepat untuk Tim Anda</span>
          </h2>
          <p className="text-[oklch(0.6_0.01_265)] mb-8">
            Mulai gratis, upgrade kapan saja. Tidak ada hidden fee.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl border"
            style={{ background: "oklch(0.11 0.015 265)", borderColor: "oklch(0.22 0.02 265)" }}>
            <span className={`text-sm ${!annual ? "text-white font-semibold" : "text-[oklch(0.55_0.01_265)]"}`}>Bulanan</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-10 h-6 rounded-full transition-all"
              style={{ background: annual ? "oklch(0.65 0.22 265)" : "oklch(0.25 0.02 265)" }}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${annual ? "left-5" : "left-1"}`} />
            </button>
            <span className={`text-sm ${annual ? "text-white font-semibold" : "text-[oklch(0.55_0.01_265)]"}`}>
              Tahunan
              <span className="ml-1.5 text-xs text-green-400 font-bold">(Hemat 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PRICING.map((tier, i) => (
            <div key={i} className={`relative flex flex-col rounded-2xl p-6 ${tier.popular ? "popular-card scale-[1.02]" : "card-glass"}`}>
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, oklch(0.58 0.22 265), oklch(0.63 0.2 300))" }}>
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-white text-lg mb-1">{tier.name}</h3>
                <p className="text-xs text-[oklch(0.55_0.01_265)] mb-4">{tier.desc}</p>

                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-black text-white">
                    {tier.price === "Custom" || tier.price === "Gratis" ? tier.price :
                      annual ? `Rp ${Math.round(parseInt(tier.price.replace(/[^0-9]/g, "")) * 0.8 / 1000)}K` :
                      tier.price}
                  </span>
                </div>
                <p className="text-xs text-[oklch(0.5_0.01_265)]">{tier.period}</p>
              </div>

              <button
                className={`w-full py-3 rounded-xl text-sm font-bold mb-6 transition-all ${tier.popular
                  ? "text-white hover:opacity-90"
                  : "border hover:bg-white/5 text-white"}`}
                style={tier.popular
                  ? { background: "linear-gradient(135deg, oklch(0.58 0.22 265), oklch(0.63 0.2 300))" }
                  : { borderColor: "oklch(0.35 0.02 265)" }}
              >
                {tier.cta}
              </button>

              <div className="space-y-2.5 flex-1">
                {tier.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2.5 text-sm">
                    <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: "oklch(0.65 0.18 160 / 0.2)" }}>
                      <CheckIcon size={10} />
                    </span>
                    <span className="text-[oklch(0.72_0.01_265)]">{f}</span>
                  </div>
                ))}
                {tier.notIncluded?.map((f, j) => (
                  <div key={`x-${j}`} className="flex items-start gap-2.5 text-sm opacity-40">
                    <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: "oklch(0.4 0.01 265 / 0.3)" }}>
                      <XIcon size={10} />
                    </span>
                    <span className="text-[oklch(0.55_0.01_265)] line-through">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Money back */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[oklch(0.58_0.01_265)]">
            ✓ 14 hari gratis • ✓ Tidak perlu kartu kredit • ✓ Cancel kapan saja • ✓ Refund 30 hari
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <span className="pill mb-4" style={{ background: "oklch(0.65 0.22 265 / 0.15)", color: "oklch(0.75 0.15 265)", border: "1px solid oklch(0.65 0.22 265 / 0.3)" }}>
            ❓ FAQ
          </span>
          <h2 className="text-4xl font-black mt-4 text-white">
            Pertanyaan yang <span className="text-gradient">Sering Ditanya</span>
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i}
              className="card-glass rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-[oklch(0.35_0.02_265)]"
              onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              <div className="flex items-center justify-between p-5 gap-4">
                <h3 className="font-semibold text-white text-sm leading-snug">{faq.q}</h3>
                <span className={`shrink-0 transition-transform duration-200 ${openIdx === i ? "rotate-180" : ""}`}>
                  <ChevronDown size={18} />
                </span>
              </div>
              {openIdx === i && (
                <div className="px-5 pb-5 -mt-2">
                  <p className="text-sm text-[oklch(0.62_0.01_265)] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="cta" className="py-32 px-6 relative overflow-hidden">
      {/* Big background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-30"
          style={{ background: "radial-gradient(ellipse, oklch(0.65 0.22 265 / 0.6), transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="text-6xl mb-6 animate-float">🚀</div>

        <h2 className="text-5xl font-black mb-6 text-white leading-tight">
          Hentikan Chaos.<br />
          <span className="text-gradient">Mulai Orkestrasikan.</span>
        </h2>

        <p className="text-xl text-[oklch(0.62_0.01_265)] mb-10 leading-relaxed">
          Bergabung dengan ratusan tim yang sudah menggunakan CollabBuilder untuk menjalankan proyek dengan AI secara terstruktur, terdokumentasi, dan under control.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="group px-10 py-5 rounded-xl text-lg font-bold text-white shadow-2xl transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, oklch(0.58 0.22 265), oklch(0.63 0.2 300))", boxShadow: "0 8px 40px oklch(0.65 0.22 265 / 0.4)" }}
          >
            Mulai Gratis — Tanpa Kartu Kredit 🎯
          </button>
        </div>

        <p className="text-sm text-[oklch(0.5_0.01_265)] mt-6">
          Sudah ada workroom aktif di tim Anda dalam 5 menit.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-12 px-6" style={{ borderColor: "oklch(0.18 0.02 265)", background: "oklch(0.07 0.01 265)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">CB</div>
              <span className="font-bold text-white">CollabBuilder</span>
            </div>
            <p className="text-xs text-[oklch(0.5_0.01_265)] leading-relaxed">
              Platform orkestrator multi-agent untuk kolaborasi AI yang terstruktur dan terdokumentasi.
            </p>
          </div>

          {[
            {
              title: "Produk",
              links: ["Fitur", "Template", "Harga", "Roadmap"],
            },
            {
              title: "Perusahaan",
              links: ["Tentang Kami", "Blog", "Karir", "Press Kit"],
            },
            {
              title: "Dukungan",
              links: ["Dokumentasi", "Tutorial", "Status", "Kontak"],
            },
          ].map(col => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">{col.title}</p>
              <div className="space-y-2">
                {col.links.map(link => (
                  <a key={link} href="#" className="block text-sm text-[oklch(0.52_0.01_265)] hover:text-white transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t" style={{ borderColor: "oklch(0.15 0.015 265)" }}>
          <p className="text-xs text-[oklch(0.42_0.01_265)]">
            © 2025 CollabBuilder. Diinspirasi dari buku "From Dialog to Collaboration" oleh Gustafta.
          </p>
          <div className="flex gap-6 text-xs text-[oklch(0.42_0.01_265)]">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>
        <Hero />
        <PainSection />
        <FeaturesSection />
        <HowItWorks />
        <SectorsSection />
        <TestimonialsPlaceholder />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
