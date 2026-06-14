import { useState } from "react";
import { useListDeliverables, useCreateDeliverable, useUpdateDeliverable, useDeleteDeliverable, getListDeliverablesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, FileSpreadsheet, Presentation, BarChart3, Package, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { WorkroomStage } from "@workspace/api-client-react";

const FORMAT_CONFIG = {
  document: { label: "Dokumen", icon: FileText, color: "text-blue-400" },
  spreadsheet: { label: "Spreadsheet", icon: FileSpreadsheet, color: "text-green-400" },
  presentation: { label: "Presentasi", icon: Presentation, color: "text-amber-400" },
  report: { label: "Laporan", icon: BarChart3, color: "text-purple-400" },
  data: { label: "Data", icon: Package, color: "text-cyan-400" },
};

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  review: { label: "Review", color: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
  final: { label: "Final", color: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-400", dot: "bg-green-400" },
};

interface Props { workroomId: number; stages: WorkroomStage[] }

export function DeliverablesTab({ workroomId, stages }: Props) {
  const { data: items = [], isLoading } = useListDeliverables(workroomId);
  const createItem = useCreateDeliverable();
  const updateItem = useUpdateDeliverable();
  const deleteItem = useDeleteDeliverable();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", format: "document", status: "draft", stageId: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListDeliverablesQueryKey(workroomId) });
  const stageMap: Record<number, string> = {};
  for (const s of stages) stageMap[s.id] = s.name;

  const openNew = () => { setForm({ title: "", content: "", format: "document", status: "draft", stageId: "" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (item: typeof items[0]) => {
    setForm({ title: item.title, content: item.content ?? "", format: item.format, status: item.status, stageId: item.stageId ? String(item.stageId) : "" });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const payload = { title: form.title, content: form.content || undefined, format: form.format, status: form.status, stageId: form.stageId ? Number(form.stageId) : undefined };
    if (editingId) {
      await updateItem.mutateAsync({ id: editingId, data: payload as Parameters<typeof updateItem.mutateAsync>[0]["data"] });
      toast({ title: "Deliverable diperbarui ✓" });
    } else {
      await createItem.mutateAsync({ workroomId, data: payload as Parameters<typeof createItem.mutateAsync>[0]["data"] });
      toast({ title: "Deliverable ditambahkan ✓" });
    }
    invalidate();
    setDialogOpen(false);
  };

  const cycleStatus = async (id: number, current: string) => {
    const cycle = { draft: "review", review: "final", final: "approved", approved: "draft" } as Record<string, string>;
    await updateItem.mutateAsync({ id, data: { status: cycle[current] ?? "draft" } as Parameters<typeof updateItem.mutateAsync>[0]["data"] });
    invalidate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Object.entries(STATUS_CONFIG).map(([k, v]) => {
            const count = items.filter(i => i.status === k).length;
            return count > 0 ? (
              <div key={k} className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", v.dot)} />
                <span className="text-xs text-muted-foreground">{count} {v.label}</span>
              </div>
            ) : null;
          })}
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Tambah</Button>
      </div>

      {isLoading ? <div className="py-12 text-center text-muted-foreground text-sm">Memuat…</div>
        : items.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Belum ada Deliverable</p>
            <p className="text-xs opacity-60">Tambahkan artefak output dari setiap stage pipeline</p>
            <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Tambah Pertama</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const fmt = FORMAT_CONFIG[item.format as keyof typeof FORMAT_CONFIG] ?? FORMAT_CONFIG.document;
              const stat = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
              const Icon = fmt.icon;
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} className="rounded-lg border border-border bg-card/60 overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted", fmt.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.stageId && <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">{stageMap[item.stageId] ?? `Stage ${item.stageId}`}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", fmt.color)}>{fmt.label}</Badge>
                        <button onClick={() => cycleStatus(item.id, item.status)} className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", stat.color)}>
                          {stat.label} →
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.content && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={async () => { await deleteItem.mutateAsync({ id: item.id }); invalidate(); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {isExpanded && item.content && (
                    <div className="px-3 pb-3 border-t border-border/50 pt-2">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Deliverable" : "Tambah Deliverable"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Format</label>
                <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(FORMAT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Judul</label>
              <Input placeholder="Nama deliverable…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Stage (opsional)</label>
              <Select value={form.stageId || "none"} onValueChange={v => setForm(f => ({ ...f, stageId: v === "none" ? "" : v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pilih stage…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak terikat stage —</SelectItem>
                  {stages.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.order}. {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Konten / Deskripsi</label>
              <Textarea rows={5} placeholder="Isi deliverable atau deskripsi singkat…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button disabled={!form.title.trim() || createItem.isPending || updateItem.isPending} onClick={handleSave}>
              {(createItem.isPending || updateItem.isPending) ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
