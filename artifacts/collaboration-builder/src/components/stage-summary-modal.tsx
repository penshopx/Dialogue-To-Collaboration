import { useState, useEffect } from "react";
import { useGetStageSummary, useUpsertStageSummary, getGetStageSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  workroomId: number;
  stageId: number | null;
  stageName?: string;
}

const FIELDS = [
  { key: "ringkasanEksekutif", label: "Ringkasan Eksekutif", placeholder: "Apa yang dicapai di stage ini secara keseluruhan?", rows: 4 },
  { key: "keputusanUtama", label: "Keputusan Utama", placeholder: "Keputusan-keputusan strategis yang dibuat selama stage ini…", rows: 3 },
  { key: "asumsiKunci", label: "Asumsi Kunci", placeholder: "Asumsi apa yang diterima sebagai dasar langkah berikutnya?", rows: 3 },
  { key: "risikoYangDiterima", label: "Risiko yang Diterima", placeholder: "Risiko apa yang diakui dan mitigasinya?", rows: 3 },
] as const;

type SummaryKey = (typeof FIELDS)[number]["key"];

export function StageSummaryModal({ open, onClose, workroomId, stageId, stageName }: Props) {
  const { data: existing, isLoading } = useGetStageSummary(
    workroomId,
    stageId ?? 0,
    { query: { queryKey: getGetStageSummaryQueryKey(workroomId, stageId ?? 0), enabled: open && !!stageId, retry: false } }
  );
  const upsert = useUpsertStageSummary();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<Record<SummaryKey, string>>({
    ringkasanEksekutif: "",
    keputusanUtama: "",
    asumsiKunci: "",
    risikoYangDiterima: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        ringkasanEksekutif: existing.ringkasanEksekutif ?? "",
        keputusanUtama: existing.keputusanUtama ?? "",
        asumsiKunci: existing.asumsiKunci ?? "",
        risikoYangDiterima: existing.risikoYangDiterima ?? "",
      });
    } else {
      setForm({ ringkasanEksekutif: "", keputusanUtama: "", asumsiKunci: "", risikoYangDiterima: "" });
    }
  }, [existing, open, stageId]);

  async function handleSave() {
    if (!stageId) return;
    setSaving(true);
    try {
      await upsert.mutateAsync({
        workroomId,
        stageId,
        data: form as Parameters<typeof upsert.mutateAsync>[0]["data"],
      });
      qc.invalidateQueries({ queryKey: ["getStageSummary", workroomId, stageId] });
      toast({ title: `Ringkasan stage "${stageName}" disimpan ✓` });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const hasContent = Object.values(form).some(v => v.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Ringkasan Stage: {stageName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {FIELDS.map(({ key, label, placeholder, rows }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {label}
                </Label>
                <Textarea
                  rows={rows}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="resize-none text-sm"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
                <X className="w-3.5 h-3.5" /> Tutup
              </Button>
              <Button
                size="sm"
                disabled={!hasContent || saving}
                onClick={handleSave}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Ringkasan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
