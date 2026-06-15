import { useState, useRef, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, RefreshCw, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  workroomId: number;
  workroomName: string;
  model?: string;
}

export function StandupModal({ open, onClose, workroomId, workroomName, model = "gpt-4o-mini" }: Props) {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && !text) generate();
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function generate() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setText("");
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/workrooms/${workroomId}/standup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal" }));
        toast({ title: "Error", description: (err as { error: string }).error, variant: "destructive" });
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let out = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") break;
          try {
            const { content } = JSON.parse(payload) as { content: string };
            out += content;
            setText(out);
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") {
        toast({ title: "Error", description: "Gagal menghasilkan standup.", variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
    }
  }

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    abortRef.current?.abort();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            Laporan Standup Harian
            <Badge variant="outline" className="text-[10px] font-normal ml-1">{workroomName}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isStreaming && !text ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Membuat laporan standup…</span>
            </div>
          ) : text ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className={cn(
                "whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/40 rounded-lg p-4 border",
                isStreaming && "animate-pulse"
              )}>
                {text}
                {isStreaming && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />}
              </pre>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Klik "Regenerasi" untuk memulai.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t gap-2">
          <Button variant="outline" size="sm" onClick={generate} disabled={isStreaming} className="gap-1.5">
            <RefreshCw className={cn("w-3.5 h-3.5", isStreaming && "animate-spin")} />
            Regenerasi
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copy} disabled={!text} className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Tersalin!" : "Salin"}
            </Button>
            <Button size="sm" onClick={handleClose}>Tutup</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
