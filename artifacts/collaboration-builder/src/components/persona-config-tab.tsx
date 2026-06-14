import { useState, useEffect } from "react";
import { useGetWorkroomConfig, useUpdateWorkroomConfig, getGetWorkroomConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Save, Plus, Trash2, Shield, Loader2, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface Props { workroomId: number }

export function PersonaConfigTab({ workroomId }: Props) {
  const { data: config, isLoading } = useGetWorkroomConfig(workroomId);
  const updateConfig = useUpdateWorkroomConfig();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    personaName: "", personaDesc: "", personaTone: "professional",
    personaLanguage: "id", personaEmoji: "🤖",
  });
  const [policies, setPolicies] = useState<string[]>([]);
  const [newPolicy, setNewPolicy] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        personaName: config.personaName ?? "",
        personaDesc: config.personaDesc ?? "",
        personaTone: config.personaTone ?? "professional",
        personaLanguage: config.personaLanguage ?? "id",
        personaEmoji: config.personaEmoji ?? "🤖",
      });
      try { setPolicies(JSON.parse(config.policies ?? "[]")); } catch { setPolicies([]); }
      setDirty(false);
    }
  }, [config]);

  const setField = (key: string, val: string) => { setForm(f => ({ ...f, [key]: val })); setDirty(true); };

  const addPolicy = () => {
    if (!newPolicy.trim()) return;
    setPolicies(p => [...p, newPolicy.trim()]);
    setNewPolicy("");
    setDirty(true);
  };

  const removePolicy = (i: number) => { setPolicies(p => p.filter((_, idx) => idx !== i)); setDirty(true); };

  const handleSave = async () => {
    await updateConfig.mutateAsync({
      workroomId,
      data: { ...form, policies: JSON.stringify(policies) } as Parameters<typeof updateConfig.mutateAsync>[0]["data"],
    });
    qc.invalidateQueries({ queryKey: getGetWorkroomConfigQueryKey(workroomId) });
    setDirty(false);
    toast({ title: "Konfigurasi AI disimpan ✓" });
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Memuat…</div>;

  const selectedTone = TONE_OPTIONS.find(t => t.value === form.personaTone);

  return (
    <div className="space-y-6">
      {/* Persona */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Persona AI</h3>
          <p className="text-xs text-muted-foreground ml-1">— karakter agen AI untuk workroom ini</p>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
          <div className="space-y-2">
            <label className="text-xs font-medium">Emoji</label>
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
              <label className="text-xs font-medium">Nama Persona</label>
              <Input className="mt-1" placeholder="Contoh: Asisten Strategis Proyek" value={form.personaName} onChange={e => setField("personaName", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Deskripsi Singkat</label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="Jelaskan karakter dan spesialisasi persona ini…" value={form.personaDesc} onChange={e => setField("personaDesc", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Preview card */}
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
            <label className="text-xs font-medium">Tone Komunikasi</label>
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
          <div>
            <label className="text-xs font-medium">Bahasa</label>
            <Select value={form.personaLanguage} onValueChange={v => setField("personaLanguage", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANG_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Policies */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Kebijakan Agen</h3>
          <p className="text-xs text-muted-foreground ml-1">— aturan yang selalu diikuti semua agen</p>
        </div>

        <div className="space-y-2">
          {policies.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-lg">Belum ada kebijakan. Tambahkan aturan untuk mengatur perilaku agen.</p>
          ) : (
            policies.map((p, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-amber-400/5">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs flex-1 leading-relaxed">{p}</p>
                <button onClick={() => removePolicy(i)} className="text-destructive hover:text-destructive/80 shrink-0"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            className="text-sm"
            placeholder="Contoh: Selalu jawab dalam bahasa Indonesia yang formal…"
            value={newPolicy}
            onChange={e => setNewPolicy(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addPolicy()}
          />
          <Button variant="outline" size="icon" onClick={addPolicy} disabled={!newPolicy.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
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
