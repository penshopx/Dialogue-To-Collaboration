import { useState, useEffect, useRef } from "react";
import { useGetWorkroomConfig, useUpdateWorkroomConfig, getGetWorkroomConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Save, Shield, Loader2, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TONE_OPTIONS = [
  { value: "professional", label: "Profesional", desc: "Formal, terstruktur, berbasis data" },
  { value: "casual", label: "Kasual", desc: "Ramah, santai, mudah dipahami" },
  { value: "technical", label: "Teknikal", desc: "Detail teknis, presisi tinggi" },
  { value: "creative", label: "Kreatif", desc: "Inovatif, ekspresif, out-of-the-box" },
];

const LANG_OPTIONS = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
  { value: "bilingual", label: "Bilingual (ID + EN)" },
];

const EMOJI_PRESETS = ["🤖", "🧠", "⚡", "🎯", "💡", "🔥", "🦅", "🚀"];

const KEBIJAKAN_FIELDS = [
  {
    key: "primaryOutcome",
    label: "Primary Outcome",
    icon: "🎯",
    placeholder: "Tujuan bisnis utama yang harus dicapai agen. Contoh: Mendidik & onboard pengguna baru…",
    hint: "Outcome utama yang diburu agen dalam setiap sesi.",
  },
  {
    key: "winConditions",
    label: "Win Conditions",
    icon: "🏆",
    placeholder: "Kapan percakapan dianggap berhasil. Contoh: Pengguna memahami topik dan tahu langkah selanjutnya…",
    hint: "Kondisi konkret yang menandai percakapan sukses.",
  },
  {
    key: "brandVoice",
    label: "Brand Voice",
    icon: "🗣️",
    placeholder: "Gaya bahasa, formalitas, dan karakter komunikasi. Contoh: Gunakan bahasa Indonesia formal, nada otoritatif namun tidak menggurui…",
    hint: "Gaya bahasa yang dipertahankan di SETIAP respons.",
  },
  {
    key: "interactionPolicy",
    label: "Interaction Policy",
    icon: "⚙️",
    placeholder: "Aturan kapan agen bertanya balik, berapa pertanyaan sekaligus, kapan menyimpulkan sendiri…",
    hint: "Panduan alur dialog dan batas interaksi.",
  },
  {
    key: "domainCharter",
    label: "Domain Charter",
    icon: "🗺️",
    placeholder: "Topik dan tindakan yang BOLEH dan TIDAK BOLEH dilakukan agen. Contoh: Agen HANYA membahas topik X…",
    hint: "Batas eksplisit domain agen — disuntikkan ke prompt.",
  },
  {
    key: "qualityBar",
    label: "Quality Bar",
    icon: "✅",
    placeholder: "Standar minimum kualitas jawaban. Contoh: Setiap jawaban harus berdasarkan informasi terverifikasi…",
    hint: "Standar referensi, struktur, dan kelengkapan jawaban.",
  },
  {
    key: "riskCompliance",
    label: "Risk & Compliance",
    icon: "🛡️",
    placeholder: "Aturan regulasi, disclaimer wajib, batasan risiko. Contoh: Selalu tambahkan disclaimer bahwa jawaban bersifat informatif…",
    hint: "Aturan yang TIDAK boleh dikompromikan oleh permintaan pengguna.",
  },
] as const;

type KebijakanKey = typeof KEBIJAKAN_FIELDS[number]["key"];
type KebijakanState = Record<KebijakanKey, string>;

const DEFAULT_KEBIJAKAN: KebijakanState = {
  primaryOutcome: "", winConditions: "", brandVoice: "",
  interactionPolicy: "", domainCharter: "", qualityBar: "", riskCompliance: "",
};

interface Props {
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function PersonaConfigTab({ workroomId, workroomName, objective }: Props) {
  const { data: config, isLoading } = useGetWorkroomConfig(workroomId);
  const updateConfig = useUpdateWorkroomConfig();
  const qc = useQueryClient();
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [form, setForm] = useState({
    personaName: "", personaDesc: "", personaTone: "professional",
    personaLanguage: "id", personaEmoji: "🤖",
  });
  const [kebijakan, setKebijakan] = useState<KebijakanState>(DEFAULT_KEBIJAKAN);
  const [dirty, setDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiField, setAiField] = useState<KebijakanKey | "all" | null>(null);

  useEffect(() => {
    if (config) {
      setForm({
        personaName: config.personaName ?? "",
        personaDesc: config.personaDesc ?? "",
        personaTone: config.personaTone ?? "professional",
        personaLanguage: config.personaLanguage ?? "id",
        personaEmoji: config.personaEmoji ?? "🤖",
      });
      try {
        const parsed = JSON.parse(config.policies ?? "{}");
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          setKebijakan({ ...DEFAULT_KEBIJAKAN, ...parsed });
        }
      } catch { setKebijakan(DEFAULT_KEBIJAKAN); }
      setDirty(false);
    }
  }, [config]);

  const setField = (key: string, val: string) => { setForm(f => ({ ...f, [key]: val })); setDirty(true); };
  const setKebField = (key: KebijakanKey, val: string) => { setKebijakan(k => ({ ...k, [key]: val })); setDirty(true); };

  const filledCount = [
    form.personaName, form.personaDesc,
    ...Object.values(kebijakan),
  ].filter(v => v.trim().length > 0).length;
  const totalFields = 2 + KEBIJAKAN_FIELDS.length;
  const completeness = Math.round((filledCount / totalFields) * 100);

  const handleSave = async () => {
    await updateConfig.mutateAsync({
      workroomId,
      data: { ...form, policies: JSON.stringify(kebijakan) } as Parameters<typeof updateConfig.mutateAsync>[0]["data"],
    });
    qc.invalidateQueries({ queryKey: getGetWorkroomConfigQueryKey(workroomId) });
    setDirty(false);
    toast({ title: "Konfigurasi AI disimpan ✓" });
  };

  const fillWithAI = async () => {
    setAiLoading(true);
    setAiField("all");
    abortRef.current = new AbortController();

    const topic = [
      workroomName ? `Workroom: ${workroomName}` : "",
      objective ? `Objective: ${objective}` : "",
    ].filter(Boolean).join(". ") || "platform kolaborasi multi-agen AI";

    const prompt = `Kamu adalah generator kebijakan agen AI. Berdasarkan konteks berikut:
"${topic}"

Generate 7 field kebijakan agen dalam format JSON yang ketat. Balas HANYA dengan JSON valid, tanpa markdown, tanpa komentar:
{
  "primaryOutcome": "...",
  "winConditions": "...",
  "brandVoice": "...",
  "interactionPolicy": "...",
  "domainCharter": "...",
  "qualityBar": "...",
  "riskCompliance": "..."
}

Setiap field 1-3 kalimat, bahasa Indonesia, spesifik dan actionable.`;

    try {
      const res = await fetch("/api/agent/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "sintetis", prompt, context: "" }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.text) full += d.text;
            } catch { /* skip */ }
          }
        }
      }

      const jsonMatch = full.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const next: KebijakanState = { ...kebijakan };
        for (const k of Object.keys(DEFAULT_KEBIJAKAN) as KebijakanKey[]) {
          if (parsed[k]) next[k] = parsed[k];
        }
        setKebijakan(next);
        if (!form.personaName && workroomName) setField("personaName", `Agen ${workroomName}`);
        if (!form.personaDesc && parsed.primaryOutcome) setField("personaDesc", parsed.primaryOutcome.slice(0, 120));
        setDirty(true);
        toast({ title: "✨ Kebijakan AI berhasil di-generate" });
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") toast({ title: "Gagal generate", variant: "destructive" });
    } finally {
      setAiLoading(false);
      setAiField(null);
    }
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Memuat…</div>;

  const selectedTone = TONE_OPTIONS.find(t => t.value === form.personaTone);

  return (
    <div className="space-y-6">
      {/* Completeness bar */}
      <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Kelengkapan Persona</span>
          <span className={cn("text-sm font-bold", completeness >= 80 ? "text-green-400" : completeness >= 50 ? "text-amber-400" : "text-muted-foreground")}>
            {completeness}%
          </span>
        </div>
        <Progress value={completeness} className="h-1.5" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {filledCount} / {totalFields} field diisi
            {completeness < 100 && ` — ${totalFields - filledCount} field belum diisi`}
          </p>
          <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 px-2" onClick={fillWithAI} disabled={aiLoading}>
            {aiLoading && aiField === "all"
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Sparkles className="w-3 h-3 text-violet-400" />}
            {aiLoading && aiField === "all" ? "Generating…" : "✨ Isi dengan AI — OpenClaw/MultiClaw"}
          </Button>
        </div>
      </div>

      {/* Persona Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Identitas Persona</h3>
          <p className="text-xs text-muted-foreground ml-1">— karakter agen AI untuk workroom ini</p>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
          <div className="space-y-2">
            <label className="text-xs font-medium">Avatar</label>
            <div className="flex flex-wrap gap-1 w-36">
              {EMOJI_PRESETS.map(e => (
                <button key={e} onClick={() => setField("personaEmoji", e)} className={cn("w-8 h-8 rounded-md text-base hover:bg-muted transition-colors", form.personaEmoji === e && "bg-primary/20 ring-1 ring-primary")}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 flex-1">
            <div>
              <label className="text-xs font-medium">Nama Chatbot</label>
              <Input className="mt-1" placeholder="Contoh: Asisten Strategis Proyek" value={form.personaName} onChange={e => setField("personaName", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Deskripsi / Tagline</label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="Jelaskan karakter dan spesialisasi persona ini…" value={form.personaDesc} onChange={e => setField("personaDesc", e.target.value)} />
            </div>
          </div>
        </div>

        {(form.personaName || form.personaDesc) && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">{form.personaEmoji}</div>
            <div>
              <p className="text-sm font-semibold">{form.personaName || "Nama Persona"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{form.personaDesc || "Deskripsi persona…"}</p>
              <div className="flex gap-1.5 mt-1.5">
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{selectedTone?.label}</Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{LANG_OPTIONS.find(l => l.value === form.personaLanguage)?.label}</Badge>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Bahasa Utama</label>
            <Select value={form.personaLanguage} onValueChange={v => setField("personaLanguage", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANG_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">Gaya Respons AI</label>
            <Select value={form.personaTone} onValueChange={v => setField("personaTone", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div><p className="text-sm font-medium">{t.label}</p><p className="text-xs text-muted-foreground">{t.desc}</p></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* 7-field Kebijakan Agen */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Kebijakan Agen</h3>
          <p className="text-xs text-muted-foreground ml-1">— 7 aturan tetap yang disuntikkan ke setiap prompt</p>
        </div>

        <div className="space-y-3">
          {KEBIJAKAN_FIELDS.map(field => {
            const val = kebijakan[field.key];
            const filled = val.trim().length > 0;
            return (
              <div key={field.key} className={cn("rounded-lg border p-3 space-y-1.5 transition-colors", filled ? "border-amber-400/30 bg-amber-400/5" : "border-border bg-card/40")}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <span>{field.icon}</span> {field.label}
                    {filled
                      ? <CheckCircle2 className="w-3 h-3 text-green-400" />
                      : <Circle className="w-3 h-3 text-muted-foreground/40" />}
                  </label>
                  <span className="text-[10px] text-muted-foreground">{field.hint}</span>
                </div>
                <Textarea
                  className="resize-none text-xs min-h-[60px]"
                  placeholder={field.placeholder}
                  value={val}
                  onChange={e => setKebField(field.key, e.target.value)}
                  rows={2}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button disabled={!dirty || updateConfig.isPending} onClick={handleSave} className="gap-1.5">
          {updateConfig.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan Konfigurasi
        </Button>
      </div>
    </div>
  );
}
