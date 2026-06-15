import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain, BookOpen, Settings2, User, Bot, AlertTriangle, Plus, Trash2,
  Save, CheckCircle2, Database, Zap, MessageSquare, Cpu, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ClawConfig = {
  id?: number;
  workroomId: number;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  chunkSize: number;
  chunkOverlap: number;
  ragTopK: number;
  greeting: string;
  isActive: boolean;
  updatedAt?: string;
};

type ClawSubAgent = {
  id: number;
  role: string;
  agentId: number | null;
  description: string;
  sortOrder: number;
};

type ClawQuickPrompt = {
  id: number;
  label: string;
  prompt: string;
  sortOrder: number;
};

type ClawBundle = {
  config: ClawConfig | null;
  subAgents: ClawSubAgent[];
  quickPrompts: ClawQuickPrompt[];
  kbCount: number;
};

const DEFAULT_CONFIG: Omit<ClawConfig, "id" | "workroomId" | "updatedAt"> = {
  name: "Claw Orchestrator",
  systemPrompt: "FEDERATION_MODE v2\nSYNTHESIS ORCHESTRATOR\n\n[NAMA-ORCHESTRATOR]\n\nIDENTITAS ORCHESTRATOR\nNama  : \nPeran : Orchestrator multi-agen\nModel : gpt-4o\n\nFUNGSI UTAMA\n...",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2000,
  chunkSize: 800,
  chunkOverlap: 200,
  ragTopK: 5,
  greeting: "",
  isActive: true,
};

const MODELS = [
  { value: "gpt-4o-mini", label: "gpt-4o-mini", desc: "Cepat & hemat" },
  { value: "gpt-4o", label: "gpt-4o", desc: "Akurat & kuat" },
  { value: "deepseek-chat", label: "deepseek-chat", desc: "Math & analitik" },
];

interface Props { workroomId: number }

export function ClawConfigPanel({ workroomId }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const BASE = `/api/workrooms/${workroomId}/claw`;

  const { data, isLoading } = useQuery<ClawBundle>({
    queryKey: ["claw-config", workroomId],
    queryFn: () => fetch(BASE).then(r => r.json()),
  });

  const cfg = data?.config;
  const subAgents = data?.subAgents ?? [];
  const quickPrompts = data?.quickPrompts ?? [];
  const kbCount = data?.kbCount ?? 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["claw-config", workroomId] });

  const saveMain = useMutation({
    mutationFn: (body: object) => fetch(BASE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "✓ Pengaturan disimpan" }); },
  });

  const savePersona = useMutation({
    mutationFn: (body: object) => fetch(`${BASE}/persona`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "✓ Persona & UX disimpan" }); },
  });

  const addSubAgent = useMutation({
    mutationFn: (body: object) => fetch(`${BASE}/sub-agents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "✓ Sub-agen ditambahkan" }); },
  });

  const removeSubAgent = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/sub-agents/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "Sub-agen dihapus" }); },
  });

  const addQuickPrompt = useMutation({
    mutationFn: (body: object) => fetch(`${BASE}/quick-prompts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "✓ Prompt cepat ditambahkan" }); },
  });

  const removeQuickPrompt = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/quick-prompts/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "Prompt dihapus" }); },
  });

  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_CONFIG.systemPrompt);
  const [model, setModel] = useState(DEFAULT_CONFIG.model);
  const [temperature, setTemperature] = useState(DEFAULT_CONFIG.temperature);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_CONFIG.maxTokens);
  const [chunkSize, setChunkSize] = useState(DEFAULT_CONFIG.chunkSize);
  const [chunkOverlap, setChunkOverlap] = useState(DEFAULT_CONFIG.chunkOverlap);
  const [ragTopK, setRagTopK] = useState(DEFAULT_CONFIG.ragTopK);
  const [greeting, setGreeting] = useState(DEFAULT_CONFIG.greeting);
  const [isActive, setIsActive] = useState(DEFAULT_CONFIG.isActive);

  const [newRole, setNewRole] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPromptLabel, setNewPromptLabel] = useState("");
  const [newPromptText, setNewPromptText] = useState("");

  useEffect(() => {
    if (cfg) {
      setSystemPrompt(cfg.systemPrompt);
      setModel(cfg.model);
      setTemperature(cfg.temperature);
      setMaxTokens(cfg.maxTokens);
      setChunkSize(cfg.chunkSize);
      setChunkOverlap(cfg.chunkOverlap);
      setRagTopK(cfg.ragTopK);
      setGreeting(cfg.greeting);
      setIsActive(cfg.isActive);
    }
  }, [cfg]);

  const charCount = systemPrompt.length;
  const tokenEstimate = Math.round(charCount / 4);
  const hasFederationMarker = systemPrompt.includes("FEDERATION_MODE");

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-400/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{cfg?.name ?? "Claw Orchestrator"}</h3>
            <p className="text-xs text-muted-foreground">
              {cfg?.model ?? DEFAULT_CONFIG.model} · KB {kbCount} sumber ·
              <span className={cn("ml-1 font-medium", isActive ? "text-green-400" : "text-muted-foreground")}>
                {isActive ? "Aktif" : "Nonaktif"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1">
            <Database className="w-2.5 h-2.5" />
            {kbCount} sumber
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Bot className="w-2.5 h-2.5" />
            {subAgents.length} agen
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="system-prompt">
        <TabsList className="flex-wrap h-auto gap-1 py-1">
          <TabsTrigger value="knowledge-base" className="gap-1.5 text-xs">
            <BookOpen className="w-3 h-3" /> Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="system-prompt" className="gap-1.5 text-xs">
            <Brain className="w-3 h-3" /> System Prompt
          </TabsTrigger>
          <TabsTrigger value="model-rag" className="gap-1.5 text-xs">
            <Settings2 className="w-3 h-3" /> Model & RAG
          </TabsTrigger>
          <TabsTrigger value="persona" className="gap-1.5 text-xs">
            <User className="w-3 h-3" /> Persona & UX
          </TabsTrigger>
          <TabsTrigger value="sub-agents" className="gap-1.5 text-xs">
            <Cpu className="w-3 h-3" /> Sub-Agents
            {subAgents.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px]">{subAgents.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Knowledge Base ─────────────────────────────────── */}
        <TabsContent value="knowledge-base" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                {kbCount} sumber · Agen akan menggunakan KB ini saat menjawab
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{kbCount} artikel tersedia</span>
                </div>
                <Badge variant={kbCount > 0 ? "default" : "outline"}>
                  {kbCount > 0 ? `${kbCount} chunks` : "Kosong"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border border-dashed">
                <p className="font-medium mb-1">Cara menambah Knowledge Base:</p>
                <p>Buka tab <strong>📚 Knowledge</strong> di workroom ini untuk menambah artikel, URL, atau teks ke KB. Claw akan menggunakan konten tersebut sebagai konteks RAG saat menjawab.</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
                <AlertTriangle className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <p className="text-xs text-violet-400/80">
                  Chunk Size: {chunkSize} · Overlap: {chunkOverlap} · Top-K: {ragTopK} — konfigurasi di tab Model & RAG
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── System Prompt ─────────────────────────────────── */}
        <TabsContent value="system-prompt" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                System Prompt
              </CardTitle>
              <CardDescription>Instruksi inti agen. Mengandung persona, keahlian, dan aturan perilaku.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasFederationMarker && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400/90">
                    ⚠ System prompt mengandung marker penting (FEDERATION_MODE v2, SYNTHESIS ORCHESTRATOR, dll). Hati-hati saat mengedit — jangan hapus marker tersebut.
                  </p>
                </div>
              )}
              <Textarea
                rows={16}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                className="font-mono text-xs resize-none leading-relaxed"
                placeholder="FEDERATION_MODE v2&#10;SYNTHESIS ORCHESTRATOR&#10;SCORECARD&#10;&#10;[NAMA-ORCHESTRATOR]&#10;&#10;IDENTITAS ORCHESTRATOR&#10;Nama  : ..."
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {charCount.toLocaleString()} karakter · ~{tokenEstimate.toLocaleString()} tokens
                </span>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={saveMain.isPending}
                  onClick={() => saveMain.mutate({ systemPrompt })}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveMain.isPending ? "Menyimpan…" : "Simpan System Prompt"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Model & RAG ─────────────────────────────────── */}
        <TabsContent value="model-rag" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Model AI
              </CardTitle>
              <CardDescription>Konfigurasi model AI dan parameter Knowledge Base (RAG)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Model AI</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{m.label}</span>
                          <span className="text-xs text-muted-foreground">· {m.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">gpt-4o-mini: cepat & hemat · gpt-4o: akurat & kuat · deepseek-chat: math & analitik</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Temperature</Label>
                  <span className="text-xs font-mono text-muted-foreground">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.1}
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full accent-violet-500"
                />
                <p className="text-[10px] text-muted-foreground">0 = konsisten · 0.7 = default · 1 = kreatif</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Max Tokens</Label>
                  <Input type="number" min={500} max={8000} step={100} value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))} className="h-8 text-xs" />
                  <p className="text-[10px] text-muted-foreground">2000–4000 disarankan</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Top-K Chunks</Label>
                  <Input type="number" min={1} max={20} value={ragTopK} onChange={e => setRagTopK(parseInt(e.target.value))} className="h-8 text-xs" />
                  <p className="text-[10px] text-muted-foreground">Default 5. Naikan ke 8–12 untuk KB tebal</p>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-muted-foreground" />
                  RAG (Retrieval-Augmented Generation)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Chunk Size (tokens)</Label>
                    <Input type="number" min={200} max={2000} step={100} value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="h-8 text-xs" />
                    <p className="text-[10px] text-muted-foreground">Default 800. Lebih kecil = presisi lebih tinggi</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Chunk Overlap (tokens)</Label>
                    <Input type="number" min={0} max={500} step={50} value={chunkOverlap} onChange={e => setChunkOverlap(parseInt(e.target.value))} className="h-8 text-xs" />
                    <p className="text-[10px] text-muted-foreground">Default 200. Overlap antar chunk</p>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                className="gap-1.5"
                disabled={saveMain.isPending}
                onClick={() => saveMain.mutate({ model, temperature, maxTokens, chunkSize, chunkOverlap, ragTopK })}
              >
                <Save className="w-3.5 h-3.5" />
                {saveMain.isPending ? "Menyimpan…" : "Simpan Pengaturan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Persona & UX ─────────────────────────────────── */}
        <TabsContent value="persona" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Persona & Pengalaman Pengguna
              </CardTitle>
              <CardDescription>Pesan sambutan, tombol prompt cepat, dan status aktif Claw</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40">
                <div>
                  <p className="text-sm font-medium">Status Claw</p>
                  <p className="text-xs text-muted-foreground">Nonaktifkan untuk maintenance tanpa menghapus konfigurasi</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", isActive ? "text-green-400" : "text-muted-foreground")}>
                    {isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Pesan Pembuka (Greeting)</Label>
                <p className="text-[10px] text-muted-foreground">Pesan pertama yang muncul saat pengguna membuka chat. Buat ringkas, hangat, dan langsung ke nilai utama Claw.</p>
                <Textarea
                  rows={4}
                  value={greeting}
                  onChange={e => setGreeting(e.target.value)}
                  placeholder={`Halo! Saya ${cfg?.name ?? "Claw"} — asisten AI untuk workroom ini.\n\nSilakan ajukan pertanyaan Anda atau pilih topik di bawah:`}
                  className="text-sm resize-none"
                />
                <p className="text-[10px] text-muted-foreground">{greeting.length} karakter</p>
              </div>

              <Button
                size="sm"
                className="gap-1.5"
                disabled={savePersona.isPending}
                onClick={() => savePersona.mutate({ greeting, isActive })}
              >
                <Save className="w-3.5 h-3.5" />
                {savePersona.isPending ? "Menyimpan…" : "Simpan Persona & UX"}
              </Button>

              <div className="border-t border-border/40 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Prompt Cepat (Conversation Starters)</p>
                    <p className="text-[10px] text-muted-foreground">Tombol prompt di awal chat. Maksimal 6 tombol.</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{quickPrompts.length}/6</Badge>
                </div>

                {quickPrompts.length > 0 ? (
                  <div className="space-y-1.5">
                    {quickPrompts.map(qp => (
                      <div key={qp.id} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card/30">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{qp.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{qp.prompt}</p>
                        </div>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          onClick={() => removeQuickPrompt.mutate(qp.id)}
                          disabled={removeQuickPrompt.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                    Belum ada prompt cepat. Tambahkan 3–6 pertanyaan pemantik di bawah.
                  </p>
                )}

                {quickPrompts.length < 6 && (
                  <div className="space-y-2 p-3 rounded-lg border border-dashed border-border/60 bg-muted/10">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tambah Prompt Cepat</p>
                    <Input
                      placeholder="Label tombol (misal: Apa itu SBU?)"
                      value={newPromptLabel}
                      onChange={e => setNewPromptLabel(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Teks prompt lengkap yang dikirim saat tombol diklik"
                      value={newPromptText}
                      onChange={e => setNewPromptText(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm" variant="outline" className="gap-1.5 w-full text-xs h-8"
                      disabled={!newPromptLabel.trim() || !newPromptText.trim() || addQuickPrompt.isPending}
                      onClick={() => {
                        addQuickPrompt.mutate({ label: newPromptLabel.trim(), prompt: newPromptText.trim() });
                        setNewPromptLabel("");
                        setNewPromptText("");
                      }}
                    >
                      <Plus className="w-3 h-3" /> Tambah Prompt
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sub-Agents ─────────────────────────────────── */}
        <TabsContent value="sub-agents" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                Sub-Agents Konfigurasi
              </CardTitle>
              <CardDescription>
                Edit, tambah, atau hapus agen spesialis yang dipanggil paralel oleh orchestrator ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subAgents.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-medium">Role/Kode</span>
                    <span className="w-16 text-center">Agent ID</span>
                    <span className="flex-1 ml-4">Deskripsi</span>
                    <span className="w-8" />
                  </div>
                  <div className="space-y-1.5">
                    {subAgents.map((sa) => (
                      <div key={sa.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card/30 hover:bg-card/60 transition-colors">
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0 min-w-[60px] justify-center">{sa.role}</Badge>
                        <span className="text-xs text-muted-foreground w-12 text-center font-mono shrink-0">{sa.agentId ?? "—"}</span>
                        <span className="text-xs text-muted-foreground flex-1 truncate">{sa.description}</span>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          onClick={() => removeSubAgent.mutate(sa.id)}
                          disabled={removeSubAgent.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center border border-dashed rounded-lg">
                  <Cpu className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Belum ada sub-agen</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Tambahkan spesialis yang dipanggil paralel oleh orchestrator</p>
                </div>
              )}

              <div className="border-t border-border/40 pt-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3">Tambah Sub-Agent</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Role/Kode</Label>
                    <Input placeholder="MAPPER" value={newRole} onChange={e => setNewRole(e.target.value.toUpperCase())} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Agent ID</Label>
                    <Input type="number" placeholder="1001" value={newAgentId} onChange={e => setNewAgentId(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Deskripsi</Label>
                    <Input placeholder="Fungsi agen…" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <Button
                  size="sm" variant="outline" className="gap-1.5 w-full text-xs h-8"
                  disabled={!newRole.trim() || addSubAgent.isPending}
                  onClick={() => {
                    addSubAgent.mutate({ role: newRole.trim(), agentId: newAgentId ? parseInt(newAgentId) : undefined, description: newDesc.trim() });
                    setNewRole(""); setNewAgentId(""); setNewDesc("");
                  }}
                >
                  <Plus className="w-3 h-3" /> Tambah Sub-Agent
                </Button>
              </div>

              {subAgents.length > 0 && (
                <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Preview JSON
                  </p>
                  <pre className="text-[9px] text-muted-foreground overflow-auto max-h-40 leading-relaxed font-mono">
                    {JSON.stringify(subAgents.map(sa => ({ role: sa.role, agentId: sa.agentId, description: sa.description })), null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
