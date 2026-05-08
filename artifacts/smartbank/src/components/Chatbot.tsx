import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, X, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { LANGS } from "@/i18n/config";

type Msg = { role: "user" | "assistant"; content: string };

export const Chatbot = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: t("chatbot.intro") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset intro when language changes (only if conversation hasn't started)
  useEffect(() => {
    setMessages((m) =>
      m.length <= 1 ? [{ role: "assistant", content: t("chatbot.intro") }] : m,
    );
  }, [i18n.language, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage: Msg = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setLoading(true);

    try {
      const langLabel =
        LANGS.find((l) => l.code === i18n.language)?.label ?? "English";

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            language: langLabel,
            languageCode: i18n.language,
          }),
        },
      );

      if (!resp.ok) {
        throw new Error("Failed to get response");
      }

      const data = await resp.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I could not generate a response.",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("chatbot.error"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow animate-pulse-glow hover:scale-105 transition-transform"
        aria-label={t("chatbot.open")}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] glass-card flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2 bg-secondary/40">
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-gradient-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <div className="font-semibold text-sm">{t("chatbot.name")}</div>
              <div className="text-xs text-muted-foreground">
                {t("chatbot.subtitle")}
              </div>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-secondary/70 text-foreground"}`}
                >
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />{" "}
                {t("chatbot.typing")}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border/60 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t("chatbot.placeholder")}
              className="flex-1 bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
            />
            <Button
              size="icon"
              onClick={send}
              disabled={loading}
              className="bg-gradient-primary text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
