import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  workroomsTable,
  workroomStagesTable,
  workroomTasksTable,
  workroomBrainTable,
  knowledgeBaseItems,
  deliverablesTable,
} from "@workspace/db";
import { resolveAIClient } from "../lib/ai-client.js";

const router: IRouter = Router();

const AGENT_PERSONAS: Record<string, { name: string; systemPrompt: string; emoji: string; color: string }> = {
  strategis: {
    name: "Rekan Strategis",
    emoji: "🧭",
    color: "#60a5fa",
    systemPrompt: `Kamu adalah Rekan Strategis — seorang pemikir sistemik dan perencana jangka panjang yang brilian. Karaktermu:

- SELALU mulai dengan big picture: tujuan akhir, konteks lebih luas, dan "mengapa" di balik setiap langkah
- Identifikasi pola, koneksi, dan peluang yang tidak terlihat oleh orang lain
- Berikan framing yang jelas: breakdown masalah kompleks menjadi komponen yang bisa dikelola
- Prioritaskan dengan tegas: apa yang paling penting? apa yang harus dikerjakan pertama?
- Gunakan analogi dan mental model untuk memperjelas konsep
- Bahasa: campuran Bahasa Indonesia dan sedikit Inggris teknis, direct dan compelling
- Format respons: gunakan bullet points, heading, dan struktur yang jelas
- Selalu akhiri dengan 2-3 "Strategic Next Steps" yang konkret

Kamu BUKAN seorang akademisi yang teoritis. Kamu adalah praktisi yang berpikir strategis.`,
  },
  skeptis: {
    name: "Rekan Skeptis",
    emoji: "🛡️",
    color: "#f87171",
    systemPrompt: `Kamu adalah Rekan Skeptis — kritikus konstruktif dan devil's advocate yang tajam. Karaktermu:

- SELALU mulai dengan mempertanyakan asumsi yang paling fundamental
- Identifikasi risiko yang tersembunyi, blind spots, dan skenario terburuk
- Berikan kritik yang tajam TAPI konstruktif — bukan untuk menghancurkan, tapi untuk memperkuat
- Tanyakan pertanyaan sulit yang orang lain takut bertanya
- Identifikasi bias kognitif yang mungkin mempengaruhi keputusan
- Berikan "pre-mortem" analysis: jika ini gagal, mengapa?
- Bahasa: tegas, direct, tidak basa-basi, tapi tetap respectful
- Format respons: Risk Matrix atau numbered list of concerns, diikuti mitigasi konkret
- Selalu akhiri dengan "Pertanyaan Kritis" yang harus dijawab sebelum melanjutkan

Kamu BUKAN pesimis. Kamu adalah penjaga kualitas yang memastikan setiap keputusan sudah diuji.`,
  },
  eksekutor: {
    name: "Rekan Eksekutor",
    emoji: "⚙️",
    color: "#fbbf24",
    systemPrompt: `Kamu adalah Rekan Eksekutor — spesialis implementasi dan operasional yang obsesif dengan detail konkret. Karaktermu:

- SELALU fokus pada "bagaimana": langkah spesifik, timeline, resources, dan deliverables
- Ubah ide abstrak menjadi action items yang bisa langsung dikerjakan
- Buat SOP, checklist, dan template yang praktis
- Identifikasi dependencies dan bottlenecks dalam eksekusi
- Berikan estimasi waktu dan resources yang realistis
- Anticipate obstacles dan siapkan contingency plan
- Bahasa: to-the-point, action-oriented, penuh dengan kata kerja aktif
- Format respons: numbered checklist, timeline, atau SOP step-by-step
- Selalu akhiri dengan "Aksi Segera" — apa yang bisa dikerjakan dalam 24 jam ke depan

Kamu BUKAN perencana teoritis. Kamu adalah eksekutor yang membuat sesuatu benar-benar terjadi.`,
  },
  narasumber: {
    name: "Narasumber Ahli",
    emoji: "📚",
    color: "#34d399",
    systemPrompt: `Kamu adalah Narasumber Ahli — sumber pengetahuan domain-spesifik yang mendalam. Karaktermu:

- Berikan konteks industri, standar, regulasi, dan best practices yang relevan
- Bagikan insights berdasarkan pengalaman lapangan, bukan hanya teori
- Jelaskan nuansa dan edge cases yang sering diabaikan
- Hubungkan pertanyaan dengan tren dan perkembangan terkini
- Berikan perspektif komparatif: bagaimana cara lain menangani masalah serupa?
- Bahasa: expert tapi accessible, hindari jargon yang tidak perlu
- Format respons: structured explanation dengan contoh konkret
- Selalu akhiri dengan "Sumber & Referensi Lanjutan" jika relevan

Kamu adalah mentor yang membagikan wisdom dari pengalaman nyata.`,
  },
  pack_compiler: {
    name: "DocuGen",
    emoji: "📄",
    color: "#a78bfa",
    systemPrompt: `Kamu adalah DocuGen — spesialis kompilasi dan dokumentasi yang mengubah output mentah menjadi dokumen siap pakai. Karaktermu:

- Struktur informasi dengan sangat baik: hierarchy yang jelas, heading yang tepat
- Buat ringkasan eksekutif yang powerful untuk decision makers
- Standarisasi format: konsisten dalam style, terminologi, dan struktur
- Identifikasi gap dalam informasi yang perlu dilengkapi
- Buat dokumen yang bisa langsung di-share ke stakeholder
- Bahasa: formal tapi readable, profesional tapi tidak kaku
- Format respons: dokumen terstruktur dengan TOC jika perlu
- Selalu akhiri dengan "Checklist Kelengkapan Dokumen"

Kamu mengubah chaos menjadi clarity melalui dokumentasi yang sempurna.`,
  },
  evaluator: {
    name: "Evaluator",
    emoji: "✅",
    color: "#22d3ee",
    systemPrompt: `Kamu adalah Evaluator — penilai objektif yang mengukur kualitas, ketepatan, dan kesiapan output. Karaktermu:

- Gunakan rubrik yang jelas: criteria, weight, dan score
- Bandingkan output dengan standar industri dan best practices
- Identifikasi gap antara kondisi saat ini dan kondisi ideal
- Berikan feedback yang actionable, bukan hanya penilaian
- Ukur kesiapan untuk go-live atau deployment
- Bahasa: objektif, berbasis data, hindari opini subjektif
- Format respons: scorecard atau evaluation matrix dengan reasoning
- Selalu akhiri dengan "Rekomendasi Perbaikan" yang terprioritasi

Kamu adalah hakim yang adil yang membantu mencapai standar terbaik.`,
  },
  sintetis: {
    name: "Sintetis",
    emoji: "🌀",
    color: "#fb923c",
    systemPrompt: `Kamu adalah Sintetis — integrator yang menyatukan perspektif berbeda menjadi satu pandangan yang koheren. Karaktermu:

- Identifikasi common ground dan perbedaan kunci antar perspektif
- Temukan synthesis yang mengambil yang terbaik dari setiap sudut pandang
- Hilangkan kontradiksi dan resolusi konflik antar ide
- Buat narrative yang mengalir dan mudah dipahami
- Tentukan prioritas berdasarkan evidence dari berbagai sumber
- Bahasa: integrasi dan harmoni, hindari sisi-mengambil (side-taking)
- Format respons: unified framework atau integrated model
- Selalu akhiri dengan "Konsensus Rekomendasi" yang bisa dijadikan dasar keputusan

Kamu menyatukan chaos menjadi satu suara yang kuat.`,
  },
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ── Single agent invoke (SSE) ─────────────────────────────────────────────────
router.post("/agent/invoke", async (req, res): Promise<void> => {
  const { agentRole, messages, context } = req.body as {
    agentRole: string;
    messages: ChatMessage[];
    context?: {
      workroomName?: string;
      stageName?: string;
      objective?: string;
      stageNotes?: string;
      knowledgeBase?: string;
    };
  };

  if (!agentRole || !messages?.length) {
    res.status(400).json({ error: "agentRole and messages are required" });
    return;
  }

  const persona = AGENT_PERSONAS[agentRole] ?? AGENT_PERSONAS.strategis;

  let contextBlock = "";
  if (context) {
    contextBlock = `\n\n## Konteks Aktif\n`;
    if (context.workroomName) contextBlock += `- **Workroom:** ${context.workroomName}\n`;
    if (context.stageName) contextBlock += `- **Stage saat ini:** ${context.stageName}\n`;
    if (context.objective) contextBlock += `- **Objektif:** ${context.objective}\n`;
    if (context.stageNotes) contextBlock += `- **Catatan stage:** ${context.stageNotes}\n`;
    if (context.knowledgeBase) contextBlock += `\n## Knowledge Base\n${context.knowledgeBase}\n`;
  }

  const systemMessage: ChatMessage = {
    role: "system",
    content: persona.systemPrompt + contextBlock,
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const stream = await resolveAIClient("gpt-4o-mini").chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      stream: true,
      max_tokens: 1500,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── Openclaw: sequential agent chain (SSE) ───────────────────────────────────
// Each agent's full response becomes context for the next agent in the chain.
// Streams labeled chunks: { agent, phase: "start"|"chunk"|"done", content }
router.post("/agent/openclaw", async (req, res): Promise<void> => {
  const { prompt, chain, context } = req.body as {
    prompt: string;
    chain: string[];
    context?: { workroomName?: string; objective?: string; knowledgeBase?: string };
  };

  if (!prompt || !chain?.length) {
    res.status(400).json({ error: "prompt and chain are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  let contextBlock = "";
  if (context) {
    contextBlock = `\n\n## Konteks\n`;
    if (context.workroomName) contextBlock += `- **Workroom:** ${context.workroomName}\n`;
    if (context.objective) contextBlock += `- **Objektif:** ${context.objective}\n`;
    if (context.knowledgeBase) contextBlock += `\n## Knowledge Base\n${context.knowledgeBase}\n`;
  }

  const previousOutputs: { role: string; content: string }[] = [];

  try {
    for (const agentRole of chain) {
      const persona = AGENT_PERSONAS[agentRole] ?? AGENT_PERSONAS.strategis;

      // Signal start of this agent's turn
      res.write(`data: ${JSON.stringify({ agent: agentRole, phase: "start", name: persona.name, emoji: persona.emoji })}\n\n`);

      // Build the message chain: original prompt + all prior agent outputs
      let userContent = `# Pertanyaan / Tugas\n${prompt}`;
      if (previousOutputs.length > 0) {
        userContent += `\n\n# Output dari Agen Sebelumnya (untuk konteks dan refinement)\n`;
        for (const prev of previousOutputs) {
          const prevPersona = AGENT_PERSONAS[prev.role];
          userContent += `\n## ${prevPersona?.emoji ?? "🤖"} ${prevPersona?.name ?? prev.role}\n${prev.content}\n`;
        }
      }

      const systemContent = persona.systemPrompt + contextBlock +
        (previousOutputs.length > 0
          ? `\n\n## Instruksi Tambahan\nKamu menerima konteks dari agen sebelumnya. Bangun di atas output mereka — jangan mengulang apa yang sudah dikatakan, tapi elaborasi, kritisi, atau eksekusi dari sudut pandangmu sendiri.`
          : "");

      let agentFullResponse = "";

      const stream = await resolveAIClient("gpt-4o-mini").chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        stream: true,
        max_tokens: 1200,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? "";
        if (content) {
          agentFullResponse += content;
          res.write(`data: ${JSON.stringify({ agent: agentRole, phase: "chunk", content })}\n\n`);
        }
      }

      previousOutputs.push({ role: agentRole, content: agentFullResponse });
      res.write(`data: ${JSON.stringify({ agent: agentRole, phase: "done" })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ phase: "chain_complete" })}\n\n`);
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── Workroom AI Summary (SSE) ─────────────────────────────────────────────────
router.post("/workrooms/:workroomId/summarize", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  if (isNaN(workroomId)) { res.status(400).json({ error: "Invalid workroomId" }); return; }

  // Gather all workroom data for rich context
  const [workroom] = await db.select().from(workroomsTable).where(eq(workroomsTable.id, workroomId));
  if (!workroom) { res.status(404).json({ error: "Workroom not found" }); return; }

  const [stages, tasks, brain, knowledgeItems, deliverables] = await Promise.all([
    db.select().from(workroomStagesTable).where(eq(workroomStagesTable.workroomId, workroomId)),
    db.select().from(workroomTasksTable).where(eq(workroomTasksTable.workroomId, workroomId)),
    db.select().from(workroomBrainTable).where(eq(workroomBrainTable.workroomId, workroomId)),
    db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.workroomId, workroomId)),
    db.select().from(deliverablesTable).where(eq(deliverablesTable.workroomId, workroomId)),
  ]);

  const brainData = brain[0];

  const stagesSummary = stages.map(s =>
    `  - Stage ${s.order}: ${s.name} [${s.status}]${s.notes ? ` — Notes: ${s.notes.slice(0, 200)}` : ""}`
  ).join("\n");

  const tasksSummary = tasks.map(t =>
    `  - [${t.status}] ${t.title}${t.assigneeRole ? ` (@${t.assigneeRole})` : ""}${t.priority ? ` [${t.priority}]` : ""}`
  ).join("\n");

  const knowledgeSummary = knowledgeItems.slice(0, 5).map(k =>
    `  - ${k.title}: ${k.content.slice(0, 150)}…`
  ).join("\n");

  const deliverablesSummary = deliverables.map(d =>
    `  - [${d.status}] ${d.title} (${d.format})`
  ).join("\n");

  const contextPrompt = `# Workroom: ${workroom.name}
Status: ${workroom.status}
Objektif: ${workroom.objective ?? "(tidak ada)"}

## Otak Proyek
- Konteks: ${brainData?.context ?? "—"}
- Tujuan: ${brainData?.goals ?? "—"}
- Batasan: ${brainData?.constraints ?? "—"}
- Stakeholders: ${brainData?.stakeholders ?? "—"}
- Keputusan penting: ${brainData?.decisions ?? "—"}

## Pipeline (${stages.length} stages)
${stagesSummary || "  (belum ada stage)"}

## Tasks (${tasks.length} total)
${tasksSummary || "  (belum ada task)"}
${tasks.filter(t => t.status === "done").length} selesai · ${tasks.filter(t => t.status === "doing").length} sedang berjalan · ${tasks.filter(t => t.status === "blocked").length} blocked

## Deliverables (${deliverables.length} total)
${deliverablesSummary || "  (belum ada deliverable)"}

## Knowledge Base (${knowledgeItems.length} artikel)
${knowledgeSummary || "  (belum ada artikel)"}`;

  const summaryType = (req.body as Record<string, string>).summaryType ?? "executive";

  const promptMap: Record<string, string> = {
    executive: `Buat Executive Summary yang komprehensif untuk workroom di atas. Struktur:
1. **Ringkasan Eksekutif** (2-3 kalimat, cocok untuk presentasi ke leadership)
2. **Progress Overview** (status pipeline, persentase completion, highlight per stage)
3. **Key Achievements** (apa yang sudah berhasil dicapai)
4. **Risiko & Blockers Aktif** (apa yang perlu perhatian segera)
5. **Deliverables Status** (output apa yang sudah/akan dihasilkan)
6. **Next Steps** (3-5 langkah konkret yang harus dikerjakan sekarang)
7. **Health Score** (beri penilaian 1-10 dengan reasoning singkat)`,

    retrospective: `Buat Laporan Retrospektif untuk workroom di atas. Struktur:
1. **Apa yang Berjalan Baik** (wins dan keberhasilan)
2. **Apa yang Perlu Diperbaiki** (pain points dan masalah)
3. **Pembelajaran Kunci** (insights yang bisa dibawa ke proyek berikutnya)
4. **Keputusan yang Dibuat dan Dampaknya**
5. **Rekomendasi untuk Proyek Serupa**`,

    stakeholder: `Buat Laporan untuk Stakeholder untuk workroom di atas. Gunakan bahasa non-teknis yang mudah dipahami. Struktur:
1. **Apa yang Sedang Dikerjakan** (dalam 1 paragraf sederhana)
2. **Progress Saat Ini** (gunakan persentase dan visual yang jelas)
3. **Hasil yang Sudah Dicapai**
4. **Timeline dan Milestone Berikutnya**
5. **Apa yang Dibutuhkan dari Stakeholder** (decision, resource, approval)`,
  };

  const systemContent = `Kamu adalah analis proyek senior yang ahli dalam membuat laporan yang jelas, akurat, dan actionable dari data proyek. Gunakan data yang diberikan — jangan mengarang informasi yang tidak ada. Jika data tidak tersedia, katakan "data belum tersedia" dengan ringkas.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const stream = await resolveAIClient("gpt-4o-mini").chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: `${contextPrompt}\n\n---\n\n${promptMap[summaryType] ?? promptMap.executive}` },
      ],
      stream: true,
      max_tokens: 2000,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── AI Task Suggester ─────────────────────────────────────────────────────────
router.post("/workrooms/:workroomId/stages/:stageId/suggest-tasks", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const stageId = parseInt(req.params.stageId);

  const [workrooms, stages] = await Promise.all([
    db.select({ name: workroomsTable.name, objective: workroomsTable.objective })
      .from(workroomsTable).where(eq(workroomsTable.id, workroomId)).limit(1),
    db.select({ name: workroomStagesTable.name, operandPattern: workroomStagesTable.operandPattern })
      .from(workroomStagesTable).where(eq(workroomStagesTable.id, stageId)).limit(1),
  ]);

  const workroom = workrooms[0];
  const stage = stages[0];

  const prompt = `Kamu adalah AI assistant yang membantu manajer proyek membuat task list yang spesifik dan actionable.

PROJECT:
- Workroom: ${workroom?.name ?? "Project"}
- Objective: ${workroom?.objective ?? "Tidak tersedia"}

STAGE SAAT INI:
- Nama Stage: ${stage?.name ?? "Unknown"}
- Mode Eksekusi: ${stage?.operandPattern ?? "sequential"}

Buatkan TEPAT 4 task yang spesifik, terukur, dan relevan untuk stage ini.
Setiap task harus konkret — bukan abstrak — dan langsung bisa dikerjakan.

Role yang tersedia:
- strategis: framing, analisis, perencanaan strategis
- skeptis: validasi, risk assessment, critical review
- eksekutor: implementasi, SOP, operasional konkret
- narasumber: riset, knowledge, domain expertise
- pack_compiler: dokumentasi, kompilasi, output final

Kembalikan HANYA JSON valid dengan format:
{
  "tasks": [
    {
      "title": "string (max 60 karakter, jelas dan spesifik)",
      "description": "string (1-2 kalimat, jelaskan deliverable-nya)",
      "priority": "high|medium|low",
      "functionRole": "strategis|skeptis|eksekutor|narasumber|pack_compiler"
    }
  ]
}`;

  try {
    const response = await resolveAIClient("gpt-4o-mini").chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.8,
    });

    const raw = response.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as { tasks?: unknown[] };
    res.json({ tasks: parsed.tasks ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export { AGENT_PERSONAS };
export default router;
