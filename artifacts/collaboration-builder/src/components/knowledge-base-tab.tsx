import { useState, useRef } from "react";
import { useListKnowledgeItems, useCreateKnowledgeItem, useUpdateKnowledgeItem, useDeleteKnowledgeItem, getListKnowledgeItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Pencil, Trash2, Tag, Search, Save, FileText, Link2, Code2, Sparkles, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TYPE_CONFIG = {
  text:    { label: "Artikel",   icon: FileText, color: "text-blue-400" },
  url:     { label: "URL",       icon: Link2,    color: "text-green-400" },
  snippet: { label: "Snippet",   icon: Code2,    color: "text-purple-400" },
};

const LAYER_CONFIG = {
  foundational: {
    label: "Foundational",
    desc:  "Dokumen dasar & referensi tetap: regulasi, standar, data produk.",
    color: "text-sky-400",
    bg:    "bg-sky-400/10 border-sky-400/20",
    badge: "border-sky-400/40 text-sky-400",
  },
  operational: {
    label: "Operational",
    desc:  "SOP harian & prosedur aktif: panduan kerja, FAQ, template.",
    color: "text-emerald-400",
    bg:    "bg-emerald-400/10 border-emerald-400/20",
    badge: "border-emerald-400/40 text-emerald-400",
  },
  case_memory: {
    label: "Case Memory",
    desc:  "Histori kasus & preseden: notulen, keputusan, pembelajaran.",
    color: "text-amber-400",
    bg:    "bg-amber-400/10 border-amber-400/20",
    badge: "border-amber-400/40 text-amber-400",
  },
};

type LayerKey = keyof typeof LAYER_CONFIG;
const LAYERS: LayerKey[] = ["foundational", "operational", "case_memory"];

interface Props {
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function KnowledgeBaseTab({ workroomId, workroomName, objective }: Props) {
  const { data: items = [], isLoading } = useListKnowledgeItems(workroomId);
  const createItem = useCreateKnowledgeItem();
  const updateItem = useUpdateKnowledgeItem();
  const deleteItem = useDeleteKnowledgeItem();
  const qc = useQueryClient();
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [search, setSearch] = useState("");
  const [activeLayer, setActiveLayer] = useState<LayerKey | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "text", layer: "operational", tags: "" });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListKnowledgeItemsQueryKey(workroomId) });

  const openNew = () => { setForm({ title: "", content: "", type: "text", layer: "operational", tags: "" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (item: typeof items[0]) => {
    setForm({ title: item.title, content: item.content, type: item.type, layer: (item as typeof item & { layer?: string }).layer ?? "operational", tags: item.tags ?? "" });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingId) {
      await updateItem.mutateAsync({ id: editingId, data: form as Parameters<typeof updateItem.mutateAsync>[0]["data"] });
      toast({ title: "Artikel diperbarui ✓" });
    } else {
      await createItem.mutateAsync({ workroomId, data: form as Parameters<typeof createItem.mutateAsync>[0]["data"] });
      toast({ title: "Artikel ditambahkan ✓" });
    }
    invalidate();
    setDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteItem.mutateAsync({ id });
    invalidate();
    toast({ title: "Artikel dihapus" });
  };

  const generateWithAI = async () => {
    setAiLoading(true);
    abortRef.current = new AbortController();

    const ctx = [
      workroomName ? `Workroom: ${workroomName}` : "",
      objective ? `Objective: ${objective}` : "",
    ].filter(Boolean).join(". ") || "platform kolaborasi proyek";

    const prompt = `Kamu adalah generator Knowledge Base untuk sistem AI multi-agen.
Berdasarkan konteks: "${ctx}"

Generate 6 artikel knowledge base yang relevan dalam format JSON array. Balas HANYA dengan JSON valid:
[
  {"title": "...", "content": "...", "type": "text", "layer": "foundational", "tags": "..."},
  ...
]

Layer options: foundational (regulasi/standar/referensi tetap), operational (SOP/FAQ/template), case_memory (histori/keputusan/preseden)
Setiap artikel: title singkat, content 2-3 paragraf substantif, tags 2-3 kata kunci.
Distribusi: 2 foundational, 2 operational, 2 case_memory.`;

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
            try { const d = JSON.parse(line.slice(6)); if (d.text) full += d.text; } catch { /**/ }
          }
        }
      }

      const arrMatch = full.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        const articles = JSON.parse(arrMatch[0]);
        let count = 0;
        for (const a of articles) {
          if (a.title && a.content) {
            await createItem.mutateAsync({ workroomId, data: { title: a.title, content: a.content, type: a.type ?? "text", layer: a.layer ?? "operational", tags: a.tags ?? "" } as Parameters<typeof createItem.mutateAsync>[0]["data"] });
            count++;
          }
        }
        invalidate();
        toast({ title: `✨ ${count} artikel berhasil di-generate` });
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") toast({ title: "Gagal generate KB", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = items.filter(i => {
    const matchLayer = activeLayer === "all" || (i as typeof i & { layer?: string }).layer === activeLayer;
    const q = search.toLowerCase();
    const matchSearch = !q || i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q) || (i.tags ?? "").toLowerCase().includes(q);
    return matchLayer && matchSearch;
  });

  const countsByLayer = LAYERS.reduce((acc, l) => {
    acc[l] = items.filter(i => (i as typeof i & { layer?: string }).layer === l).length;
    return acc;
  }, {} as Record<LayerKey, number>);

  return (
    <div className="space-y-4">
      {/* Layer tabs + search + actions */}
      <div className="space-y-2">
        {/* Lapisan Knowledge */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveLayer("all")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors", activeLayer === "all" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted")}
          >
            <Layers className="w-3 h-3" /> Semua ({items.length})
          </button>
          {LAYERS.map(l => {
            const lc = LAYER_CONFIG[l];
            return (
              <button
                key={l}
                onClick={() => setActiveLayer(l)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border", activeLayer === l ? `${lc.bg} ${lc.color}` : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted")}
              >
                {lc.label} ({countsByLayer[l]})
              </button>
            );
          })}
        </div>

        {/* Layer description */}
        {activeLayer !== "all" && (
          <p className="text-[11px] text-muted-foreground px-1">{LAYER_CONFIG[activeLayer].desc}</p>
        )}

        {/* Search + buttons */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Cari knowledge base…" className="pl-9 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0 h-8" onClick={generateWithAI} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
            {aiLoading ? "Generating…" : "Generate AI"}
          </Button>
          <Button size="sm" className="gap-1.5 shrink-0 h-8" onClick={openNew}>
            <Plus className="w-3.5 h-3.5" /> Tambah
          </Button>
        </div>
      </div>

      {/* RAG summary */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span><strong className="text-foreground">{items.length}</strong> artikel dari <strong className="text-foreground">3</strong> lapisan knowledge — tersedia sebagai konteks RAG untuk semua agen</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Memuat…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">{search ? "Tidak ada hasil" : "Knowledge Base kosong"}</p>
          <p className="text-xs opacity-60 mb-4">{search ? "Coba kata kunci lain" : "Tambahkan artikel atau generate otomatis dengan AI"}</p>
          {!search && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={generateWithAI} disabled={aiLoading}>
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Generate dengan AI
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Tambah Manual</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const tc = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.text;
            const itemLayer = ((item as typeof item & { layer?: string }).layer ?? "operational") as LayerKey;
            const lc = LAYER_CONFIG[itemLayer] ?? LAYER_CONFIG.operational;
            const Icon = tc.icon;
            const isExpanded = expandedId === item.id;
            const tags = item.tags ? item.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
            return (
              <div key={item.id} className="rounded-lg border border-border bg-card/60 overflow-hidden">
                <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-muted mt-0.5", tc.color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.content}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap items-center">
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", lc.badge)}>{lc.label}</Badge>
                      {tags.map(t => <Badge key={t} variant="secondary" className="text-[9px] py-0 h-4 px-1.5">{t}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", tc.color)}>{tc.label}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); openEdit(item); }}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); handleDelete(item.id); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border/50 pt-2">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Artikel" : "Tambah Artikel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Judul</label>
              <Input placeholder="Judul artikel…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Lapisan Knowledge</label>
                <Select value={form.layer} onValueChange={v => setForm(f => ({ ...f, layer: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAYERS.map(l => (
                      <SelectItem key={l} value={l}>
                        <div>
                          <p className="text-sm font-medium">{LAYER_CONFIG[l].label}</p>
                          <p className="text-[10px] text-muted-foreground">{LAYER_CONFIG[l].desc.split(":")[0]}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Tipe</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Konten</label>
              <Textarea rows={6} placeholder="Isi artikel, referensi, atau snippet…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> Tags (pisahkan dengan koma)</label>
              <Input placeholder="regulasi, sop, konstruksi…" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button disabled={!form.title.trim() || !form.content.trim() || createItem.isPending || updateItem.isPending} onClick={handleSave}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
