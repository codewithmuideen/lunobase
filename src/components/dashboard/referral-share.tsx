"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Mail, MessageCircle, Send, Share2 } from "lucide-react";

/** Referral link with copy + share buttons. The link wraps instead of overflowing on small screens. */
export function ReferralShare({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const message = "Join me on Lunobase to buy, sell and trade crypto securely. Sign up with my link:";
  const text = encodeURIComponent(`${message} ${link}`);
  const url = encodeURIComponent(link);
  const msg = encodeURIComponent(message);

  const copy = async (value: string, what: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      toast.success(what === "link" ? "Referral link copied" : "Referral code copied");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Couldn't copy. Please select the text and copy it manually.");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "Join me on Lunobase", text: message, url: link });
    } catch {
      /* user closed the share sheet */
    }
  };

  const channels = [
    { label: "WhatsApp", href: `https://wa.me/?text=${text}`, icon: MessageCircle, tone: "hover:border-[#25D366]/50 hover:text-[#25D366]" },
    { label: "Telegram", href: `https://t.me/share/url?url=${url}&text=${msg}`, icon: Send, tone: "hover:border-[#2AABEE]/50 hover:text-[#2AABEE]" },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${msg}&url=${url}`, icon: XIcon, tone: "hover:border-white/40 hover:text-white" },
    { label: "Email", href: `mailto:?subject=${encodeURIComponent("Join me on Lunobase")}&body=${text}`, icon: Mail, tone: "hover:border-brand-500/50 hover:text-brand-300" },
  ];

  return (
    <div>
      {/* Link */}
      <div className="rounded-2xl border border-white/10 bg-ink-950/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Your referral link</p>
        <p className="mt-2 select-all break-all font-mono text-sm leading-relaxed text-white">{link}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => copy(link, "link")}
            className="btn-shine inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2a6bff] to-brand-600 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(0_82_255/0.8)]"
          >
            {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={nativeShare}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Share2 className="size-4" /> Share
            </button>
          )}
        </div>
      </div>

      {/* Code */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-950/40 px-4 py-3">
        <p className="text-sm text-slate">
          Referral code <span className="ml-1 font-mono text-base font-bold tracking-wider text-white">{code}</span>
        </p>
        <button type="button" onClick={() => copy(code, "code")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300">
          {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
      </div>

      {/* Share channels */}
      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted">Share via</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {channels.map(({ label, href, icon: Icon, tone }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-silver transition ${tone}`}
          >
            <Icon className="size-4" /> {label}
          </a>
        ))}
      </div>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2H21.5l-7.11 8.127L22.75 22h-6.555l-5.134-6.713L5.187 22H1.93l7.605-8.692L1.5 2h6.72l4.64 6.135L18.244 2Zm-1.142 18.05h1.804L7.01 3.847H5.074L17.102 20.05Z" />
    </svg>
  );
}
