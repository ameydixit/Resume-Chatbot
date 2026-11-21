"use client";

import {
  ArrowUp,
  Check,
  FileText,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/interview";

type Resume = {
  fileName: string;
  resumeText: string;
  characterCount: number;
};

type ConversationMessage = ChatMessage & { id: string };

const suggestedQuestions = [
  "Tell me about yourself.",
  "What accomplishment are you most proud of?",
  "Tell me about a time you improved a system.",
];

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function uploadResume(file: File) {
    setError("");
    setIsUploading(true);
    setMessages([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/resume", { method: "POST", body: formData });
      const data = (await response.json()) as Resume & { error?: string };
      if (!response.ok) throw new Error(data.error || "We couldn't read that resume.");

      setResume(data);
    } catch (uploadError) {
      setResume(null);
      setError(uploadError instanceof Error ? uploadError.message : "Resume upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadResume(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void uploadResume(file);
  }

  async function sendQuestion(event?: FormEvent<HTMLFormElement>, suggested?: string) {
    event?.preventDefault();
    const text = (suggested ?? question).trim();
    if (!resume || !text || isSending || messages.length >= 20) return;

    const nextMessages: ConversationMessage[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", content: text },
    ];
    setMessages(nextMessages);
    setQuestion("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resume.resumeText,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "The candidate couldn't answer. Please try again.");
      const answer = data.answer;
      if (!answer) throw new Error("The candidate sent an empty answer. Please try again.");

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: answer },
      ]);
    } catch (chatError) {
      setMessages((current) => current.filter((message) => message.id !== nextMessages[nextMessages.length - 1].id));
      setQuestion(text);
      setError(chatError instanceof Error ? chatError.message : "Your question could not be sent.");
    } finally {
      setIsSending(false);
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion();
    }
  }

  function startOver() {
    setMessages([]);
    setQuestion("");
    setError("");
  }

  function removeResume() {
    setResume(null);
    startOver();
  }

  const hasStarted = messages.length > 0;
  const isLimitReached = messages.length >= 20;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Folio home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageCircle size={18} strokeWidth={2.2} />
            </span>
            <span className="font-semibold tracking-tight">folio<span className="text-primary">.</span></span>
            <span className="hidden border-l pl-3 text-sm text-muted-foreground sm:inline">Interview studio</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Private workspace
            </span>
            <div className="grid size-9 place-items-center rounded-full border bg-card text-muted-foreground">
              <UserRound size={17} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1440px] lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-[#faf9f6] p-5 lg:block">
          <div className="flex items-center justify-between px-2 pb-4 pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">BETA</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-medium shadow-sm ring-1 ring-border/70">
              <span className="grid size-8 place-items-center rounded-lg bg-secondary text-primary">
                <MessageCircle size={16} />
              </span>
              Interview practice
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            </div>
          </div>

          <div className="mb-3 mt-9 flex items-center justify-between px-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your resume</span>
            {resume && (
              <button onClick={removeResume} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                Change
              </button>
            )}
          </div>

          {resume ? (
            <div className="rounded-xl border bg-white p-3.5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf6f3] text-primary">
                  <FileText size={17} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="truncate text-sm font-medium">{resume.fileName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{resume.characterCount.toLocaleString()} characters</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t pt-3 text-[11px] text-emerald-700">
                <Check size={13} />
                Resume ready
              </div>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed bg-white/70 p-3.5 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-white disabled:opacity-60"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-muted">
                <Upload size={16} />
              </span>
              <span>{isUploading ? "Reading resume…" : "Add a resume"}</span>
            </button>
          )}

          <div className="mt-8 rounded-2xl bg-[#eff5f1] p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <ShieldCheck size={16} />
              <span className="text-xs font-semibold">Grounded in your resume</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Your candidate answers from the experience you provide—no made-up achievements.
            </p>
          </div>

          <div className="absolute bottom-8 hidden max-w-[220px] items-center gap-2 px-2 text-[11px] leading-relaxed text-muted-foreground lg:flex">
            <ShieldCheck size={14} className="shrink-0" />
            Sent to your AI provider for answers; not saved by this app.
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-68px)] min-w-0 flex-col">
          <div className="flex flex-1 flex-col">
            {!resume ? (
              <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col justify-center px-5 py-12 sm:px-10 lg:px-14">
                <div className="animate-fade-in">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                    <Sparkles size={14} className="text-primary" />
                    A better way to prep
                  </div>
                  <h1 className="max-w-[680px] text-4xl font-semibold leading-[1.13] tracking-[-0.045em] sm:text-5xl">
                    Practice the interview.
                    <br />
                    <span className="text-primary">Meet your future self.</span>
                  </h1>
                  <p className="mt-5 max-w-[560px] text-base leading-7 text-muted-foreground">
                    Upload a resume and interview an AI version of the candidate. Ask anything, then see how a confident, honest answer can sound.
                  </p>

                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={onDrop}
                    className="dot-grid mt-9 rounded-3xl border border-dashed border-primary/25 bg-white/65 p-5 sm:p-8"
                  >
                    <div className="flex flex-col items-center rounded-2xl border bg-white px-5 py-8 text-center shadow-[0_8px_30px_-24px_rgba(20,50,45,0.28)] sm:py-10">
                      <span className="grid size-12 place-items-center rounded-2xl bg-[#edf6f3] text-primary">
                        {isUploading ? (
                          <span className="size-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                        ) : (
                          <Upload size={21} />
                        )}
                      </span>
                      <h2 className="mt-4 text-base font-semibold">
                        {isUploading ? "Reading your resume…" : "Drop your resume here"}
                      </h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">PDF or plain text, up to 10 MB</p>
                      <Button
                        type="button"
                        className="mt-5"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                      >
                        Choose a file
                      </Button>
                      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck size={13} />
                        Sent to your AI provider for answers. Not saved by this app.
                      </p>
                    </div>
                  </div>
                  {error && (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      <X size={16} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="mt-9 grid gap-4 sm:grid-cols-3">
                    {[
                      ["01", "Upload your resume", "Give your candidate real experience to draw from."],
                      ["02", "Ask anything", "Practice with openers, follow-ups, and tough questions."],
                      ["03", "Learn by example", "Hear concise answers without invented experience."],
                    ].map(([number, title, description]) => (
                      <div key={number} className="border-t pt-4">
                        <span className="text-xs font-semibold text-primary">{number}</span>
                        <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b px-5 py-4 sm:px-8 lg:px-10">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf6f3] text-primary">
                      <Sparkles size={18} />
                    </span>
                    <div className="min-w-0">
                      <h1 className="truncate text-sm font-semibold">Interview practice</h1>
                      <p className="text-xs text-muted-foreground">Candidate is ready · grounded in your resume</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={startOver} disabled={!hasStarted || isSending}>
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">New interview</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                </div>

                <div className="chat-scroll flex-1 overflow-y-auto">
                  <div className="mx-auto flex min-h-full w-full max-w-[850px] flex-col px-5 pb-8 pt-7 sm:px-9">
                    {!hasStarted ? (
                      <div className="my-auto animate-fade-in py-10">
                        <div className="mb-6 flex items-end gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                            <Sparkles size={20} />
                          </span>
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">YOUR CANDIDATE</p>
                            <div className="rounded-2xl rounded-bl-md border bg-white px-5 py-4 shadow-sm">
                              <p className="text-sm leading-relaxed">
                                Hi! I&apos;m ready for my interview. Ask me about my experience, projects, or anything else on my resume.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-14 mt-8">
                          <p className="mb-3 text-xs font-medium text-muted-foreground">NOT SURE WHERE TO START?</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedQuestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => void sendQuestion(undefined, suggestion)}
                                disabled={isSending}
                                className="rounded-full border bg-white px-4 py-2 text-left text-xs text-slate-700 shadow-sm transition hover:border-primary/40 hover:bg-[#f5faf8] hover:text-primary disabled:opacity-50"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-7">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex animate-fade-in items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                          >
                            <span
                              className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                message.role === "user" ? "border bg-white text-slate-600" : "bg-primary text-primary-foreground"
                              }`}
                            >
                              {message.role === "user" ? <UserRound size={16} /> : <Sparkles size={16} />}
                            </span>
                            <div className={`max-w-[min(82%,640px)] ${message.role === "user" ? "text-right" : ""}`}>
                              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                                {message.role === "user" ? "YOU" : "CANDIDATE"}
                              </p>
                              <div
                                className={`rounded-2xl px-4 py-3 text-left text-sm leading-7 ${
                                  message.role === "user"
                                    ? "rounded-tr-md bg-[#e8f2ef] text-slate-800"
                                    : "rounded-tl-md border bg-white shadow-sm"
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                        {isSending && (
                          <div className="flex animate-fade-in items-start gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                              <Sparkles size={16} />
                            </span>
                            <div>
                              <p className="mb-2 text-[11px] font-medium text-muted-foreground">CANDIDATE</p>
                              <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border bg-white px-4 py-4 shadow-sm">
                                <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.2s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.1s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-primary/70" />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t bg-background/95 px-5 pb-5 pt-4 sm:px-8 lg:px-10">
                  <div className="mx-auto max-w-[850px]">
                    {error && (
                      <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        <span>{error}</span>
                        <button onClick={() => setError("")} aria-label="Dismiss error" className="shrink-0">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    {isLimitReached && (
                      <div className="mb-3 rounded-xl border bg-muted px-4 py-2.5 text-center text-xs text-muted-foreground">
                        You&apos;ve reached 20 messages for this interview. Start a new interview to keep practicing.
                      </div>
                    )}
                    <form onSubmit={(event) => void sendQuestion(event)} className="relative rounded-2xl border bg-white p-2 shadow-[0_10px_30px_-22px_rgba(27,50,45,0.4)] focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/10">
                      <Textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        onKeyDown={onComposerKeyDown}
                        placeholder="Ask your interview question…"
                        aria-label="Interview question"
                        maxLength={2000}
                        disabled={isSending || isLimitReached}
                        rows={2}
                        className="min-h-[58px] resize-none border-0 bg-transparent px-3 py-2.5 pr-14 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="absolute bottom-2.5 right-2.5 size-9 rounded-xl"
                        disabled={!question.trim() || isSending || isLimitReached}
                        aria-label="Send question"
                      >
                        <ArrowUp size={17} />
                      </Button>
                    </form>
                    <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
                      <span>Enter to send · Shift + Enter for a new line</span>
                      <span>{question.length}/2,000</span>
                    </div>
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                      <ShieldCheck size={12} />
                      Answers are generated from the uploaded resume. Don&apos;t share sensitive personal information.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        onChange={onFileChange}
        className="sr-only"
        aria-label="Choose a PDF or text resume"
      />
    </main>
  );
}
