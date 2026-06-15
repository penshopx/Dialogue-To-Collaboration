import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { agentsTable, workflowTemplatesTable, templateRolesTable, templateStagesTable } from "../../lib/db/src/schema/index.js";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const AGENTS = [
  {
    name: "BrainClaw",
    slugUrl: "brain-claw",
    category: "Manajemen Proyek",
    agentType: "spesialis",
    functionRole: "strategis",
    domainSpesifik: "Perencanaan Strategis & Pengambilan Keputusan",
    kepribadian: "Visioner, analitis, berpikir 3 langkah ke depan, selalu mencari opsi alternatif",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "semi_auto",
    isCoreTeam: true,
    inputDibutuhkan: { briefing: true, objektif: true, konteks_bisnis: true },
    outputDihasilkan: { strategi_opsi: true, bid_strategy_memo: true, risk_assessment: true },
    systemPrompt: "Kamu adalah agen strategis senior. Selalu tawarkan 3 opsi (konservatif/moderat/agresif) dan analisis pro-kontra setiap pilihan.",
  },
  {
    name: "SkeptisClaw",
    slugUrl: "skeptis-claw",
    category: "Manajemen Proyek",
    agentType: "spesialis",
    functionRole: "skeptis",
    domainSpesifik: "Risk Assessment & Devil's Advocate",
    kepribadian: "Kritis, detail-oriented, tidak mudah puas, selalu mencari celah dan risiko tersembunyi",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "semi_auto",
    isCoreTeam: true,
    inputDibutuhkan: { proposal: true, strategi: true, asumsi: true },
    outputDihasilkan: { risk_register: true, checklist_gate: true, rekomendasi_perbaikan: true },
    systemPrompt: "Kamu adalah devil's advocate. Tugasmu menemukan kelemahan, risiko tersembunyi, dan asumsi yang belum divalidasi dalam setiap proposal.",
  },
  {
    name: "EksekutorClaw",
    slugUrl: "eksekutor-claw",
    category: "Manajemen Proyek",
    agentType: "spesialis",
    functionRole: "eksekutor",
    domainSpesifik: "Eksekusi Task & Koordinasi Tim",
    kepribadian: "Action-oriented, pragmatis, fokus pada hasil terukur dan deadline",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "semi_auto",
    isCoreTeam: true,
    inputDibutuhkan: { task_list: true, resources: true, timeline: true },
    outputDihasilkan: { action_plan: true, progress_report: true, completion_checklist: true },
    systemPrompt: "Kamu adalah eksekutor handal. Ubah strategi abstrak menjadi action plan konkret dengan PIC, deadline, dan kriteria selesai yang jelas.",
  },
  {
    name: "QSClaw",
    slugUrl: "qs-claw",
    category: "Teknik Sipil",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Quantity Surveying & Estimasi Biaya Konstruksi",
    kepribadian: "Detail-oriented, konservatif dalam estimasi, skeptis terhadap asumsi optimis",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { gambar_teknis: true, spesifikasi: true, BOQ_draft: true, harga_satuan: true },
    outputDihasilkan: { RAB_lengkap: true, analisa_harga_satuan: true, risk_register_biaya: true },
    systemPrompt: "Kamu adalah quantity surveyor berpengalaman. Analisa BOQ, estimasi biaya, dan identifikasi cost driver dengan metodologi FIDIC.",
  },
  {
    name: "KontrakClaw",
    slugUrl: "kontrak-claw",
    category: "Hukum-Regulasi",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Kontrak Konstruksi & Hukum Pengadaan",
    kepribadian: "Teliti, berhati-hati, selalu merujuk regulasi, tidak spekulatif",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { RKS: true, dokumen_tender: true, kontrak_draft: true },
    outputDihasilkan: { analisis_kontrak: true, klarifikasi_klausul: true, risk_kontraktual: true },
    systemPrompt: "Kamu adalah ahli hukum kontrak konstruksi. Review klausul kontrak, identifikasi risiko hukum, dan rekomendasikan perlindungan kontraktual.",
  },
  {
    name: "OSSClaw",
    slugUrl: "oss-claw",
    category: "Sertifikasi-Perizinan",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Online Single Submission & Perizinan Usaha",
    kepribadian: "Up-to-date dengan regulasi, proaktif mengingatkan perubahan kebijakan",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { jenis_usaha: true, lokasi: true, skala_proyek: true },
    outputDihasilkan: { daftar_izin: true, prosedur_oss: true, timeline_perizinan: true },
    systemPrompt: "Kamu adalah spesialis perizinan OSS. Tentukan izin yang diperlukan, prosedur pengajuan, dan potensi hambatan birokrasi.",
  },
  {
    name: "K3ManClaw",
    slugUrl: "k3man-claw",
    category: "K3-Mutu-Lingkungan",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Keselamatan & Kesehatan Kerja Konstruksi",
    kepribadian: "Safety-first, zero-accident mindset, proaktif terhadap hazard",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { metode_pelaksanaan: true, lokasi_proyek: true, jenis_pekerjaan: true },
    outputDihasilkan: { rencana_K3: true, HIRADC: true, prosedur_darurat: true },
    systemPrompt: "Kamu adalah ahli K3 konstruksi. Buat rencana K3 komprehensif sesuai PP No.50/2012 dan standar OHSAS 18001.",
  },
  {
    name: "ISOClaw",
    slugUrl: "iso-claw",
    category: "K3-Mutu-Lingkungan",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Sistem Manajemen Mutu ISO 9001",
    kepribadian: "Sistematis, berorientasi proses, suka dokumentasi dan SOP",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { proses_bisnis: true, target_sertifikasi: true, dokumen_existing: true },
    outputDihasilkan: { gap_analysis: true, rencana_implementasi: true, SOP_draft: true },
    systemPrompt: "Kamu adalah konsultan ISO 9001. Lakukan gap analysis, susun rencana implementasi, dan draft prosedur kerja sesuai standar ISO.",
  },
  {
    name: "LSBUClaw",
    slugUrl: "lsbu-claw",
    category: "Sertifikasi-Perizinan",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Lembaga Sertifikasi Badan Usaha Jasa Konstruksi",
    kepribadian: "Presisi, mengikuti peraturan LPJK dan Permenpu terbaru",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { profil_perusahaan: true, dokumen_legalitas: true, sub_klasifikasi: true },
    outputDihasilkan: { checklist_LSBU: true, gap_kualifikasi: true, rencana_pemenuhan: true },
    systemPrompt: "Kamu adalah spesialis sertifikasi BUJK. Analisa kelengkapan dokumen LSBU, identifikasi gap, dan buat rencana pemenuhan persyaratan.",
  },
  {
    name: "TenderaClaw",
    slugUrl: "tendera-claw",
    category: "Tender",
    agentType: "multi_agen",
    functionRole: "strategis",
    domainSpesifik: "Strategi Penawaran Tender Pemerintah & Swasta",
    kepribadian: "Kompetitif namun realistis, memahami psikologi panitia tender",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "semi_auto",
    isCoreTeam: false,
    inputDibutuhkan: { tender_brief: true, competitor_analysis: true, kapasitas_perusahaan: true },
    outputDihasilkan: { bid_strategy: true, pricing_strategy: true, win_rate_prediction: true },
    systemPrompt: "Kamu adalah strategi tender senior. Analisa peluang menang, susun strategi penawaran kompetitif, dan identifikasi competitive advantage.",
  },
  {
    name: "DocuGen",
    slugUrl: "docu-gen",
    category: "Manajemen Proyek",
    agentType: "spesialis",
    functionRole: "pack_compiler",
    domainSpesifik: "Kompilasi Dokumen & Pack Generator",
    kepribadian: "Teratur, perfeksionis terhadap format, tidak mentolerir inkonsistensi",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "semi_auto",
    isCoreTeam: false,
    inputDibutuhkan: { dokumen_sumber: true, format_output: true, template_klien: true },
    outputDihasilkan: { submission_pack: true, daftar_isi: true, compliance_matrix: true },
    systemPrompt: "Kamu adalah pack compiler. Kumpulkan semua output, susun dalam format yang diminta, dan pastikan konsistensi antar dokumen.",
  },
  {
    name: "FinansClaw",
    slugUrl: "finans-claw",
    category: "Keuangan-Bisnis",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Analisis Keuangan Proyek & Business Case",
    kepribadian: "Konservatif, data-driven, skeptis terhadap proyeksi optimis",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { RAB: true, cashflow_plan: true, tenor_proyek: true },
    outputDihasilkan: { NPV_IRR: true, cashflow_proyeksi: true, break_even_analysis: true },
    systemPrompt: "Kamu adalah analis keuangan proyek. Hitung kelayakan finansial, proyeksi cashflow, dan identifikasi risiko keuangan.",
  },
  {
    name: "SKKClaw",
    slugUrl: "skk-claw",
    category: "Sertifikasi-Perizinan",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Sertifikat Kompetensi Kerja Konstruksi",
    kepribadian: "Detail terhadap persyaratan LPJK, update dengan skema terbaru",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { data_tenaga_ahli: true, sub_bidang: true, jenjang_kualifikasi: true },
    outputDihasilkan: { persyaratan_SKK: true, rencana_ujian: true, rekomendasi_pelatihan: true },
    systemPrompt: "Kamu adalah spesialis SKK. Tentukan persyaratan sertifikasi, gap kompetensi, dan jalur sertifikasi optimal untuk tenaga ahli.",
  },
  {
    name: "MEPClaw",
    slugUrl: "mep-claw",
    category: "MEP",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Mekanikal, Elektrikal & Plumbing",
    kepribadian: "Teknis, presisi dalam perhitungan, mengacu standar SNI dan PUIL",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { gambar_arsitektur: true, spesifikasi_MEP: true, beban_listrik: true },
    outputDihasilkan: { desain_MEP: true, BOM_material: true, estimasi_MEP: true },
    systemPrompt: "Kamu adalah engineer MEP. Review desain mekanikal-elektrikal-plumbing, hitung beban, dan validasi kesesuaian dengan standar.",
  },
  {
    name: "RecruitClaw",
    slugUrl: "recruit-claw",
    category: "Pendidikan-Training",
    agentType: "spesialis",
    functionRole: "eksekutor",
    domainSpesifik: "Rekrutmen & Asesmen Kompetensi SDM",
    kepribadian: "Objektif, berbasis kompetensi, tidak mudah terpengaruh bias subjektif",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { job_desc: true, kriteria_kompetensi: true, kandidat_CV: true },
    outputDihasilkan: { shortlist_kandidat: true, interview_guide: true, assessment_matrix: true },
    systemPrompt: "Kamu adalah spesialis rekrutmen teknis. Evaluasi kandidat berdasarkan kompetensi, buat panduan interview, dan rekomendasikan shortlist.",
  },
  {
    name: "VendorClaw",
    slugUrl: "vendor-claw",
    category: "Keuangan-Bisnis",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Evaluasi & Pengadaan Vendor",
    kepribadian: "Objektif, berbasis kriteria terukur, waspada terhadap risiko vendor",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { spesifikasi_kebutuhan: true, daftar_vendor: true, anggaran: true },
    outputDihasilkan: { vendor_scorecard: true, rekomendasi_vendor: true, draft_SPK: true },
    systemPrompt: "Kamu adalah ahli pengadaan. Evaluasi vendor dengan scorecard objektif, identifikasi risiko, dan rekomendasikan vendor terbaik.",
  },
  {
    name: "AuditClaw",
    slugUrl: "audit-claw",
    category: "K3-Mutu-Lingkungan",
    agentType: "spesialis",
    functionRole: "skeptis",
    domainSpesifik: "Audit Sistem Manajemen & Compliance",
    kepribadian: "Independen, teliti, tidak kompromi terhadap ketidakpatuhan",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { standar_audit: true, dokumen_sistem: true, rekaman_implementasi: true },
    outputDihasilkan: { temuan_audit: true, CAPA: true, laporan_audit: true },
    systemPrompt: "Kamu adalah auditor sistem manajemen. Lakukan audit komprehensif, identifikasi ketidaksesuaian, dan rekomendasikan tindakan korektif.",
  },
  {
    name: "EnergiClaw",
    slugUrl: "energi-claw",
    category: "Energi-Pertambangan",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Energi Terbarukan & Efisiensi Energi",
    kepribadian: "Inovatif, berbasis data teknis, peduli keberlanjutan",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { profil_beban: true, lokasi: true, anggaran_investasi: true },
    outputDihasilkan: { feasibility_EBT: true, ROI_energi: true, rekomendasi_teknologi: true },
    systemPrompt: "Kamu adalah konsultan energi. Analisa potensi energi terbarukan, hitung kelayakan investasi, dan rekomendasikan solusi optimal.",
  },
  {
    name: "LegalClaw",
    slugUrl: "legal-claw",
    category: "Hukum-Regulasi",
    agentType: "spesialis",
    functionRole: "narasumber",
    domainSpesifik: "Hukum Bisnis & Regulasi Sektoral",
    kepribadian: "Konservatif, berbasis preseden hukum, tidak spekulatif",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "suggest",
    isCoreTeam: false,
    inputDibutuhkan: { isu_hukum: true, konteks_bisnis: true, yurisdiksi: true },
    outputDihasilkan: { analisis_hukum: true, opini_hukum: true, rekomendasi_mitigasi: true },
    systemPrompt: "Kamu adalah konsultan hukum bisnis. Analisa isu hukum, berikan opini berdasarkan regulasi berlaku, dan rekomendasikan mitigasi risiko hukum.",
  },
  {
    name: "ASKOM AI",
    slugUrl: "askom-ai",
    category: "Manajemen Proyek",
    agentType: "multi_agen",
    functionRole: "pack_compiler",
    domainSpesifik: "Asisten Komunikasi & Koordinasi Proyek",
    kepribadian: "Komunikatif, adaptif terhadap audience, menjembatani teknis dan non-teknis",
    bahasaDefault: "Indonesia formal bisnis",
    levelOtonomi: "semi_auto",
    isCoreTeam: false,
    inputDibutuhkan: { agenda_rapat: true, peserta: true, topik_pembahasan: true },
    outputDihasilkan: { notulen_rapat: true, action_items: true, ringkasan_eksekutif: true },
    systemPrompt: "Kamu adalah asisten komunikasi proyek. Buat notulen terstruktur, ekstrak action items, dan susun ringkasan untuk berbagai level audience.",
  },
];

const TEMPLATES = [
  {
    name: "Tender Konstruksi Sipil",
    sector: "Konstruksi",
    description: "Pipeline lengkap untuk menyusun dokumen penawaran tender pekerjaan sipil — dari analisa RKS sampai submission pack final.",
    outputFinal: "Tender Submission Pack (PDF)",
    mode: "profesional",
    complexityScore: 5,
    stages: [
      { urutan: 1, namaTahap: "Intake & Analisa Tender", tipeTahap: "kerja", polaOperan: "human_first_assist", exitCriteria: "Tender Brief 1 halaman disetujui" },
      { urutan: 2, namaTahap: "Framing & Strategi Bid", tipeTahap: "kerja", polaOperan: "ai_first_review", exitCriteria: "Bid Strategy Memo final" },
      { urutan: 3, namaTahap: "Skeptic Gate", tipeTahap: "gate", polaOperan: "sequential", gateType: "skeptic", gateCriteria: "Risk Register v1 siap + keputusan Go/No-Go", exitCriteria: "Gate disetujui oleh Branch Manager" },
      { urutan: 4, namaTahap: "Estimasi & RAB", tipeTahap: "kerja", polaOperan: "multiclaw", exitCriteria: "RAB draft + Assumption Sheet" },
      { urutan: 5, namaTahap: "Dokumen Teknis & Admin", tipeTahap: "kerja", polaOperan: "multiclaw", exitCriteria: "Semua dokumen teknis dan admin lengkap" },
      { urutan: 6, namaTahap: "QA Gate", tipeTahap: "gate", polaOperan: "sequential", gateType: "qa", gateCriteria: "Compliance matrix 100% + semua dokumen", exitCriteria: "Gate disetujui oleh QA Officer" },
      { urutan: 7, namaTahap: "Finalisasi & Pack", tipeTahap: "kerja", polaOperan: "human_first_assist", exitCriteria: "Submission Pack PDF final" },
      { urutan: 8, namaTahap: "Submit Decision", tipeTahap: "gate", polaOperan: "sequential", gateType: "approval", gateCriteria: "Harga final disetujui + risk acceptance", exitCriteria: "Decision Log + Submit timestamp" },
      { urutan: 9, namaTahap: "Retro & Arsip", tipeTahap: "kerja", polaOperan: "sequential", exitCriteria: "Lesson learned terdokumentasi" },
    ],
    roles: [
      { namaPeran: "Lead Strategis", fungsiPeran: "strategis", urutan: 1 },
      { namaPeran: "Devil's Advocate", fungsiPeran: "skeptis", urutan: 2 },
      { namaPeran: "Quantity Surveyor", fungsiPeran: "narasumber", urutan: 3 },
      { namaPeran: "Legal Reviewer", fungsiPeran: "narasumber", urutan: 4 },
      { namaPeran: "Pack Compiler", fungsiPeran: "pack_compiler", urutan: 5 },
    ],
  },
  {
    name: "Verifikasi LSBU",
    sector: "Sertifikasi",
    description: "Alur verifikasi kelengkapan dokumen Lembaga Sertifikasi Badan Usaha untuk pengajuan atau perpanjangan SBU.",
    outputFinal: "Berkas LSBU Lengkap + Compliance Matrix",
    mode: "profesional",
    complexityScore: 4,
    stages: [
      { urutan: 1, namaTahap: "Gap Analysis Kualifikasi", tipeTahap: "kerja", polaOperan: "ai_first_review", exitCriteria: "Gap analysis terdokumentasi" },
      { urutan: 2, namaTahap: "Pengumpulan Dokumen", tipeTahap: "kerja", polaOperan: "human_first_assist", exitCriteria: "Semua dokumen terkumpul" },
      { urutan: 3, namaTahap: "Verifikasi Internal", tipeTahap: "gate", polaOperan: "sequential", gateType: "qa", gateCriteria: "Compliance matrix 100%", exitCriteria: "Internal QA lulus" },
      { urutan: 4, namaTahap: "Penyusunan Berkas", tipeTahap: "kerja", polaOperan: "sequential", exitCriteria: "Berkas siap submit ke LSBU" },
      { urutan: 5, namaTahap: "Final Approval", tipeTahap: "gate", polaOperan: "sequential", gateType: "approval", gateCriteria: "Direktur setuju pengajuan", exitCriteria: "Berkas diajukan" },
    ],
    roles: [
      { namaPeran: "LSBU Specialist", fungsiPeran: "narasumber", urutan: 1 },
      { namaPeran: "QA Reviewer", fungsiPeran: "skeptis", urutan: 2 },
      { namaPeran: "Document Compiler", fungsiPeran: "pack_compiler", urutan: 3 },
    ],
  },
  {
    name: "Audit ISO 9001",
    sector: "Sertifikasi",
    description: "Pipeline audit sistem manajemen mutu ISO 9001 — dari pre-audit gap analysis sampai CAPA final.",
    outputFinal: "Laporan Audit + CAPA Terverifikasi",
    mode: "profesional",
    complexityScore: 4,
    stages: [
      { urutan: 1, namaTahap: "Pre-Audit Gap Analysis", tipeTahap: "kerja", polaOperan: "ai_first_review", exitCriteria: "Gap analysis siap" },
      { urutan: 2, namaTahap: "Audit On-Site", tipeTahap: "kerja", polaOperan: "human_first_assist", exitCriteria: "Semua temuan terdokumentasi" },
      { urutan: 3, namaTahap: "Review Temuan", tipeTahap: "gate", polaOperan: "sequential", gateType: "qa", gateCriteria: "Semua temuan dikonfirmasi", exitCriteria: "Laporan audit draft disetujui" },
      { urutan: 4, namaTahap: "CAPA & Tindak Lanjut", tipeTahap: "kerja", polaOperan: "sequential", exitCriteria: "Semua CAPA memiliki PIC dan deadline" },
      { urutan: 5, namaTahap: "Close-out Audit", tipeTahap: "gate", polaOperan: "sequential", gateType: "approval", gateCriteria: "Semua CAPA diverifikasi selesai", exitCriteria: "Laporan final diterbitkan" },
    ],
    roles: [
      { namaPeran: "Lead Auditor", fungsiPeran: "skeptis", urutan: 1 },
      { namaPeran: "Domain Specialist", fungsiPeran: "narasumber", urutan: 2 },
      { namaPeran: "Report Compiler", fungsiPeran: "pack_compiler", urutan: 3 },
    ],
  },
  {
    name: "Pengadaan Vendor",
    sector: "Keuangan-Bisnis",
    description: "Proses seleksi dan pengadaan vendor mulai dari RFP sampai penandatanganan kontrak.",
    outputFinal: "SPK / Kontrak Vendor Ditandatangani",
    mode: "profesional",
    complexityScore: 3,
    stages: [
      { urutan: 1, namaTahap: "Spesifikasi Kebutuhan", tipeTahap: "kerja", polaOperan: "human_first_assist", exitCriteria: "ToR dan RFP final" },
      { urutan: 2, namaTahap: "Undangan & Evaluasi Teknis", tipeTahap: "kerja", polaOperan: "multiclaw", exitCriteria: "Vendor scorecard lengkap" },
      { urutan: 3, namaTahap: "Negosiasi & Klarifikasi", tipeTahap: "kerja", polaOperan: "sequential", exitCriteria: "Term sheet disepakati" },
      { urutan: 4, namaTahap: "Approval Gate", tipeTahap: "gate", polaOperan: "sequential", gateType: "approval", gateCriteria: "Management setuju vendor dan harga", exitCriteria: "PO / SPK ditandatangani" },
    ],
    roles: [
      { namaPeran: "Procurement Lead", fungsiPeran: "strategis", urutan: 1 },
      { namaPeran: "Technical Evaluator", fungsiPeran: "narasumber", urutan: 2 },
      { namaPeran: "Legal Reviewer", fungsiPeran: "skeptis", urutan: 3 },
    ],
  },
  {
    name: "Rekrutmen SKK",
    sector: "Pendidikan-Training",
    description: "Pipeline rekrutmen dan sertifikasi tenaga ahli SKK — dari job posting sampai onboarding.",
    outputFinal: "Tenaga Ahli Bersertifikat Bergabung",
    mode: "profesional",
    complexityScore: 3,
    stages: [
      { urutan: 1, namaTahap: "Analisa Kebutuhan SDM", tipeTahap: "kerja", polaOperan: "human_first_assist", exitCriteria: "Job desc dan kriteria kompetensi final" },
      { urutan: 2, namaTahap: "Sourcing & Screening", tipeTahap: "kerja", polaOperan: "ai_first_review", exitCriteria: "Shortlist 5 kandidat" },
      { urutan: 3, namaTahap: "Assessment & Interview", tipeTahap: "kerja", polaOperan: "human_first_assist", exitCriteria: "Assessment matrix terisi" },
      { urutan: 4, namaTahap: "Selection Gate", tipeTahap: "gate", polaOperan: "sequential", gateType: "approval", gateCriteria: "Kandidat dipilih + offer disetujui", exitCriteria: "Offer letter ditandatangani" },
      { urutan: 5, namaTahap: "Onboarding & SKK", tipeTahap: "kerja", polaOperan: "sequential", exitCriteria: "Tenaga ahli bergabung dan proses SKK dimulai" },
    ],
    roles: [
      { namaPeran: "HR Lead", fungsiPeran: "eksekutor", urutan: 1 },
      { namaPeran: "Technical Assessor", fungsiPeran: "narasumber", urutan: 2 },
      { namaPeran: "SKK Specialist", fungsiPeran: "narasumber", urutan: 3 },
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding agents...");

  for (const agent of AGENTS) {
    const existing = await db.select().from(agentsTable).where(eq(agentsTable.slugUrl, agent.slugUrl));
    if (existing.length > 0) {
      await db.update(agentsTable).set({
        domainSpesifik: agent.domainSpesifik,
        kepribadian: agent.kepribadian,
        bahasaDefault: agent.bahasaDefault,
        levelOtonomi: agent.levelOtonomi,
        isCoreTeam: agent.isCoreTeam,
        inputDibutuhkan: agent.inputDibutuhkan,
        outputDihasilkan: agent.outputDihasilkan,
        systemPrompt: agent.systemPrompt,
      }).where(eq(agentsTable.slugUrl, agent.slugUrl));
      console.log(`  ↻ Updated: ${agent.name}`);
    } else {
      await db.insert(agentsTable).values({
        name: agent.name,
        slugUrl: agent.slugUrl,
        category: agent.category,
        agentType: agent.agentType,
        functionRole: agent.functionRole,
        domainSpesifik: agent.domainSpesifik,
        kepribadian: agent.kepribadian,
        bahasaDefault: agent.bahasaDefault,
        levelOtonomi: agent.levelOtonomi,
        isCoreTeam: agent.isCoreTeam,
        inputDibutuhkan: agent.inputDibutuhkan as Record<string, unknown>,
        outputDihasilkan: agent.outputDihasilkan as Record<string, unknown>,
        systemPrompt: agent.systemPrompt,
        active: true,
      });
      console.log(`  ✓ Inserted: ${agent.name}`);
    }
  }

  console.log("\n🌱 Seeding templates...");

  for (const tpl of TEMPLATES) {
    let templateId: number;
    const existing = await db.select().from(workflowTemplatesTable).where(eq(workflowTemplatesTable.name, tpl.name));

    if (existing.length > 0) {
      templateId = existing[0].id;
      console.log(`  ↻ Template exists: ${tpl.name} (id=${templateId})`);
    } else {
      const [created] = await db.insert(workflowTemplatesTable).values({
        name: tpl.name,
        sector: tpl.sector,
        description: tpl.description,
        outputFinal: tpl.outputFinal,
        mode: tpl.mode,
        complexityScore: tpl.complexityScore,
        active: true,
      }).returning();
      templateId = created.id;
      console.log(`  ✓ Template created: ${tpl.name} (id=${templateId})`);
    }

    const existingStages = await db.select().from(templateStagesTable).where(eq(templateStagesTable.templateId, templateId));
    if (existingStages.length === 0) {
      for (const stage of tpl.stages) {
        await db.insert(templateStagesTable).values({
          templateId,
          urutan: stage.urutan,
          namaTahap: stage.namaTahap,
          tipeTahap: stage.tipeTahap,
          polaOperan: stage.polaOperan,
          gateCriteria: (stage as { gateCriteria?: string }).gateCriteria ?? null,
          exitCriteria: stage.exitCriteria,
          gateType: (stage as { gateType?: string }).gateType ?? null,
        });
      }
      console.log(`    ✓ ${tpl.stages.length} stages seeded`);
    }

    const existingRoles = await db.select().from(templateRolesTable).where(eq(templateRolesTable.templateId, templateId));
    if (existingRoles.length === 0) {
      for (const role of tpl.roles) {
        await db.insert(templateRolesTable).values({
          templateId,
          namaPeran: role.namaPeran,
          fungsiPeran: role.fungsiPeran,
          urutan: role.urutan,
        });
      }
      console.log(`    ✓ ${tpl.roles.length} roles seeded`);
    }
  }

  console.log("\n✅ Seed complete!");
  await pool.end();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
