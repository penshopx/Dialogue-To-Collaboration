import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import {
  db,
  workroomsTable,
  workflowTemplatesTable,
  workroomStagesTable,
  workroomTasksTable,
  workroomBrainTable,
} from "@workspace/db";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1",
});

const router: IRouter = Router();

router.post("/workrooms/:workroomId/summarize", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId ?? "0");
  if (!workroomId) {
    res.status(400).json({ error: "Invalid workroomId" });
    return;
  }

  const [workroom] = await db
    .select()
    .from(workroomsTable)
    .where(eq(workroomsTable.id, workroomId));

  if (!workroom) {
    res.status(404).json({ error: "Workroom not found" });
    return;
  }

  const [template] = await db
    .select({ name: workflowTemplatesTable.name, sector: workflowTemplatesTable.sector })
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, workroom.templateId));

  const stages = await db
    .select()
    .from(workroomStagesTable)
    .where(eq(workroomStagesTable.workroomId, workroomId))
    .orderBy(workroomStagesTable.order);

  const tasks = await db
    .select()
    .from(workroomTasksTable)
    .where(eq(workroomTasksTable.workroomId, workroomId));

  const [brain] = await db
    .select()
    .from(workroomBrainTable)
    .where(eq(workroomBrainTable.workroomId, workroomId));

  const completedTasks = tasks.filter((t) => t.status === "done");
  const doingTasks = tasks.filter((t) => t.status === "doing");
  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const pendingTasks = tasks.filter((t) => t.status === "todo");

  const stagesSummary = stages
    .map((s) => {
      const stageTasks = tasks.filter((t) => t.stageId === s.id);
      const done = stageTasks.filter((t) => t.status === "done").length;
      const total = stageTasks.length;
      const taskLine = total > 0 ? ` (${done}/${total} tasks selesai)` : "";
      const notesLine = s.notes ? `\n   Catatan: ${s.notes}` : "";
      const gateInfo =
        s.stageType === "gate" && s.gateDecision
          ? ` [Gate: ${s.gateDecision}${s.gateNote ? " — " + s.gateNote : ""}]`
          : "";
      return `  Stage ${s.order}. ${s.name} — Status: ${s.status}${gateInfo}${taskLine}${notesLine}`;
    })
    .join("\n");

  const brainSection = brain
    ? [
        brain.context ? `Konteks: ${brain.context}` : "",
        brain.goals ? `Tujuan: ${brain.goals}` : "",
        brain.constraints ? `Batasan: ${brain.constraints}` : "",
        brain.stakeholders ? `Stakeholders: ${brain.stakeholders}` : "",
        brain.decisions ? `Keputusan tercatat: ${brain.decisions}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "Belum ada informasi di Project Brain.";

  const prompt = `Kamu adalah DocuGen — spesialis ringkasan eksekutif proyek. Buat **Rangkuman Eksekutif** workroom berikut dalam Bahasa Indonesia yang profesional dan terstruktur.

## Data Workroom

**Nama:** ${workroom.name}
**Template:** ${template?.name ?? "-"} (Sektor: ${template?.sector ?? "-"})
**Status:** ${workroom.status}
**Progress:** ${workroom.progress}%
**Objektif:** ${workroom.objective ?? "Tidak disebutkan"}

## Pipeline (8 Stage)
${stagesSummary}

## Ringkasan Tasks
- Selesai (done): ${completedTasks.length}
- Sedang dikerjakan (doing): ${doingTasks.length}
- Tertunda (todo): ${pendingTasks.length}
- Terblokir (blocked): ${blockedTasks.length}
- Total: ${tasks.length}

## Project Brain
${brainSection}

---

Buat Rangkuman Eksekutif dengan format berikut:

### 📊 Status Progress
[Ringkasan singkat progres keseluruhan pipeline — berapa stage selesai, gate dilewati, dsb.]

### ✅ Pencapaian Utama
[Daftar poin apa yang sudah berhasil diselesaikan — stage, task, keputusan gate, dsb.]

### ⚠️ Blocker & Risiko
[Apa yang sedang tertunda, terblokir, atau membutuhkan perhatian segera. Jika tidak ada, tulis "Tidak ada blocker saat ini."]

### 🎯 Keputusan Kunci
[Ringkasan keputusan penting yang telah dibuat — gate decisions, catatan stage, atau dari Project Brain.]

### 🚀 Langkah Selanjutnya
[3-5 aksi konkret yang perlu dilakukan untuk melanjutkan pipeline — berdasarkan status stage aktif dan tasks yang pending.]

Gunakan bahasa profesional, ringkas, dan siap disampaikan ke stakeholder.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true,
      max_completion_tokens: 2000,
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

export default router;
