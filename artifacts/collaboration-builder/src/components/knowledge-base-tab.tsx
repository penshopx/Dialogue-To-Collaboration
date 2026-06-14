import { useState } from "react";
import { useListKnowledgeItems, useCreateKnowledgeItem, useUpdateKnowledgeItem, useDeleteKnowledgeItem, getListKnowledgeItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Pencil, Trash2, Tag, Search, Save, X, FileText, Link2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TYPE_CONFIG = {
  text: { label: "Artikel", icon: FileText, color: "text-blue-400" },
  url: { label: "Referensi URL", icon: Link2, color: "text-green-400" },
  snippet: { label: "Kode/Snippet", icon: Code2, color: "text-purple-400" },
};

interface Props { workroomId: number }

export function KnowledgeBaseTab({ workroomId }: Props) {
  const { data: items = [], isLoading } = useListKnowledgeItems(workroomId);
  const createItem = useCreateKnowledgeItem();
  const updateItem = useUpdateKnowledgeItem();
  const deleteItem = useDeleteKnowledgeItem();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "text", tags: "" });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListKnowledgeItemsQueryKey(workroomId) });

  const openNew = () => { setForm({ title: "", content: "", type: "text", tags: "" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (item: typeof items[0]) => { setForm({ title: item.title, content: item.content, type: item.type, tags: item.tags ?? "" }); setEditingId(item.id); setDialogOpen(true); };

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

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.content.toLowerCase().includes(search.toLowerCase()) ||
    (i.tags ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Cari knowledge base…" className="pl-9 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={openNew}>
          <Plus className="w-3.5 h-3.5" /> Tambah Artikel
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Memuat…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">{search ? "Tidak ada hasil" : "Knowledge Base kosong"}</p>
          <p className="text-xs opacity-60">{search ? "Coba kata kunci lain" : "Tambahkan artikel pengetahuan sebagai konteks untuk agen AI"}</p>
          {!search && <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Tambah Pertama</Button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const tc = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.text;
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
                    {tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {tags.map(t => <Badge key={t} variant="secondary" className="text-[9px] py-0 h-4 px-1.5">{t}</Badge>)}
                      </div>
                    )}
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
            <div className="space-y-1">
              <label className="text-xs font-medium">Tipe</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Konten</label>
              <Textarea rows={6} placeholder="Isi artikel, referensi, atau snippet…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> Tags (pisahkan dengan koma)</label>
              <Input placeholder="iso9001, regulasi, hukum…" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
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
