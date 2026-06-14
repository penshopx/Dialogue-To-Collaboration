import { useState, useEffect } from "react";
import { useGetWorkroomConfig } from "@workspace/api-client-react";
import { Code2, Copy, Eye, EyeOff, Globe, Lock, MessageSquare, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  workroomId: number;
  workroomName?: string;
}

function genToken(id: number) {
  const hash = (id * 7919 + 31337).toString(36).padStart(8, "0");
  return `cb_${hash}_${Math.abs(id * 0x5a4bcdef).toString(16).padStart(8, "0")}`;
}

export function WidgetTab({ workroomId, workroomName }: Props) {
  const { data: config } = useGetWorkroomConfig(workroomId);
  const { toast } = useToast();

  const [accessToken] = useState(() => genToken(workroomId));
  const [publicAccess, setPublicAccess] = useState(true);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [widgetTheme, setWidgetTheme] = useState<"dark" | "light" | "auto">("dark");
  const [previewOpen, setPreviewOpen] = useState(false);

  const persona = {
    name: config?.personaName || workroomName || "Asisten AI",
    emoji: config?.personaEmoji || "🤖",
    tone: config?.personaTone || "professional",
  };

  const baseUrl = window.location.origin;
  const iframeCode = `<iframe
  src="${baseUrl}/widget/${workroomId}?token=${accessToken}"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);"
  allow="microphone"
></iframe>`;

  const scriptCode = `<!-- CollabBuilder Widget -->
<script>
  window.CollabBuilder = {
    workroomId: ${workroomId},
    token: "${accessToken}",
    position: "${widgetPosition}",
    theme: "${widgetTheme}",
    persona: {
      name: "${persona.name}",
      emoji: "${persona.emoji}"
    }
  };
</script>
<script src="${baseUrl}/widget.js" async defer></script>`;

  const apiCode = `curl -X POST ${baseUrl}/api/agent/invoke \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -d '{
    "role": "strategis",
    "prompt": "Pertanyaan Anda di sini",
    "context": ""
  }'`;

  const copy = (text: string, label = "Kode") => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} disalin ✓` });
  };

  const addDomain = () => {
    const d = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d || domains.includes(d)) return;
    setDomains(prev => [...prev, d]);
    setNewDomain("");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Widget & Embed</h3>
        <p className="text-xs text-muted-foreground">— sematkan chatbot AI ini ke website Anda</p>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Embed code tabs */}
          <Tabs defaultValue="script">
            <TabsList className="h-8">
              <TabsTrigger value="script" className="text-xs">Script Tag</TabsTrigger>
              <TabsTrigger value="iframe" className="text-xs">iFrame</TabsTrigger>
              <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="mt-2">
              <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-[11px] text-muted-foreground ml-2">index.html</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => copy(scriptCode, "Script tag")}>
                    <Copy className="w-2.5 h-2.5" /> Salin
                  </Button>
                </div>
                <pre className="text-[11px] text-muted-foreground p-3 leading-relaxed overflow-x-auto">{scriptCode}</pre>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Tempel di bagian <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> halaman Anda. Widget muncul otomatis di pojok {widgetPosition === "bottom-right" ? "kanan bawah" : "kiri bawah"}.</p>
            </TabsContent>

            <TabsContent value="iframe" className="mt-2">
              <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
                  <span className="text-[11px] text-muted-foreground">Embed iFrame</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => copy(iframeCode, "iFrame code")}>
                    <Copy className="w-2.5 h-2.5" /> Salin
                  </Button>
                </div>
                <pre className="text-[11px] text-muted-foreground p-3 leading-relaxed overflow-x-auto">{iframeCode}</pre>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Cocok untuk embed langsung di halaman, seperti halaman kontak atau support page.</p>
            </TabsContent>

            <TabsContent value="api" className="mt-2">
              <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
                  <span className="text-[11px] text-muted-foreground">REST API — curl</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => copy(apiCode, "API code")}>
                    <Copy className="w-2.5 h-2.5" /> Salin
                  </Button>
                </div>
                <pre className="text-[11px] text-muted-foreground p-3 leading-relaxed overflow-x-auto">{apiCode}</pre>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Integrasikan langsung ke WhatsApp bot, Telegram, atau sistem kustom Anda via REST API.</p>
            </TabsContent>
          </Tabs>

          {/* Access Token */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold">Access Token</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setShowToken(v => !v)}>
                {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showToken ? "Sembunyikan" : "Tampilkan"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] bg-muted/60 px-2.5 py-1.5 rounded font-mono truncate">
                {showToken ? accessToken : "•".repeat(accessToken.length)}
              </code>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={() => copy(accessToken, "Token")}>
                <Copy className="w-3 h-3" /> Salin
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Token ini mengautentikasi permintaan API. Jaga kerahasiaannya — jangan expose di client-side code publik.</p>
          </div>

          {/* Domain Whitelist */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold">Domain yang Diizinkan</span>
              {domains.length === 0 && <Badge variant="outline" className="text-[9px] text-green-400">Semua domain</Badge>}
            </div>
            <div className="flex gap-2">
              <Input
                className="text-xs h-7"
                placeholder="contoh.com"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addDomain()}
              />
              <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={addDomain}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
            {domains.length > 0 ? (
              <div className="space-y-1">
                {domains.map(d => (
                  <div key={d} className="flex items-center justify-between px-2 py-1 rounded bg-muted/40 text-xs">
                    <code>{d}</code>
                    <button onClick={() => setDomains(prev => prev.filter(x => x !== d))} className="text-destructive hover:text-destructive/80 ml-2">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">Kosongkan untuk mengizinkan semua domain (tidak direkomendasikan untuk produksi).</p>
            )}
          </div>
        </div>

        {/* Right column — Widget preview + settings */}
        <div className="space-y-3">
          {/* Widget Preview */}
          <div className="rounded-xl border border-border/60 bg-gradient-to-b from-muted/20 to-muted/5 p-3 space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground text-center">Preview Widget</p>

            {/* Simulated chat bubble */}
            <div className="relative mx-auto" style={{ width: 220 }}>
              <div className="rounded-xl bg-card border border-border/60 shadow-lg overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-border/40">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">{persona.emoji}</div>
                  <div>
                    <p className="text-[11px] font-semibold leading-none">{persona.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <p className="text-[9px] text-muted-foreground">Online</p>
                    </div>
                  </div>
                </div>
                {/* Mock messages */}
                <div className="p-2 space-y-1.5 bg-background/40">
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] shrink-0">{persona.emoji}</div>
                    <div className="bg-muted/60 rounded-lg rounded-tl-none px-2 py-1 max-w-[80%]">
                      <p className="text-[10px] leading-relaxed">Halo! Saya {persona.name}. Ada yang bisa saya bantu?</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary/20 rounded-lg rounded-tr-none px-2 py-1 max-w-[80%]">
                      <p className="text-[10px] leading-relaxed">Apa yang bisa kamu lakukan?</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] shrink-0">{persona.emoji}</div>
                    <div className="bg-muted/60 rounded-lg rounded-tl-none px-2 py-1 max-w-[80%]">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Input */}
                <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border/40">
                  <div className="flex-1 h-5 bg-muted/40 rounded text-[9px] px-1.5 flex items-center text-muted-foreground">Ketik pesan…</div>
                  <div className="w-5 h-5 rounded bg-primary flex items-center justify-center"><MessageSquare className="w-2.5 h-2.5 text-primary-foreground" /></div>
                </div>
              </div>
              {/* Floating trigger button */}
              <div className={cn("absolute -bottom-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg", widgetPosition === "bottom-right" ? "-right-3" : "-left-3")}>
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>

            {/* Widget settings */}
            <div className="space-y-2 pt-3">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Posisi</p>
                <div className="grid grid-cols-2 gap-1">
                  {(["bottom-right", "bottom-left"] as const).map(p => (
                    <button key={p} onClick={() => setWidgetPosition(p)} className={cn("text-[10px] py-1 rounded border transition-colors", widgetPosition === p ? "bg-primary/20 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:bg-muted/30")}>
                      {p === "bottom-right" ? "↘ Kanan Bawah" : "↙ Kiri Bawah"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Tema</p>
                <div className="grid grid-cols-3 gap-1">
                  {(["dark", "light", "auto"] as const).map(t => (
                    <button key={t} onClick={() => setWidgetTheme(t)} className={cn("text-[10px] py-1 rounded border capitalize transition-colors", widgetTheme === t ? "bg-primary/20 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:bg-muted/30")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[10px] font-medium">Akses Publik</p>
                  <p className="text-[9px] text-muted-foreground">Tanpa autentikasi</p>
                </div>
                <Switch checked={publicAccess} onCheckedChange={setPublicAccess} />
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-lg border border-border/50 p-3 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Integrasi Populer</p>
            {[
              { icon: "💬", label: "WhatsApp Business", badge: "Via API" },
              { icon: "✈️", label: "Telegram Bot", badge: "Via API" },
              { icon: "🌐", label: "Website Builder", badge: "Script" },
              { icon: "📧", label: "Email Footer", badge: "iFrame" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className="text-sm">{item.icon}</span>
                <span className="flex-1 text-muted-foreground">{item.label}</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{item.badge}</Badge>
                <ExternalLink className="w-3 h-3 text-muted-foreground/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
