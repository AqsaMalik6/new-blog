"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Link as LinkIcon } from "lucide-react";

interface ChatInputProps {
  onSend: (query: string, url?: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;

    // Detect URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatch = input.match(urlRegex);
    const url = urlMatch ? urlMatch[0] : undefined;

    onSend(input.trim(), url);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-md p-4 md:p-6">
      <form 
        onSubmit={handleSubmit}
        className="container mx-auto max-w-4xl relative"
      >
        <div className="relative flex items-end gap-2 bg-card border border-border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <div className="p-3 text-muted-foreground">
            <LinkIcon size={20} />
          </div>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Enter a topic, question, or paste a product URL..."
            className="flex-1 bg-transparent border-none outline-none resize-none py-3 pr-12 text-sm md:text-base disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="absolute right-3 bottom-3 p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-all hover:opacity-90"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="mt-2 text-[10px] md:text-xs text-center text-muted-foreground">
          Shift + Enter for new line. Powered by SEO, AEO & GEO Agents.
        </p>
      </form>
    </div>
  );
}
