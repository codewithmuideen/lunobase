"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function PasswordInput({
  showStrength,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { showStrength?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");

  const checks = [
    { ok: value.length >= 10, label: "10+ characters" },
    { ok: /[a-z]/.test(value) && /[A-Z]/.test(value), label: "Upper & lower case" },
    { ok: /\d/.test(value), label: "A number" },
    { ok: /[^A-Za-z0-9]/.test(value), label: "A symbol (recommended)" },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-down", "bg-down", "bg-warn", "bg-brand-500", "bg-up"];

  return (
    <div>
      <div className="relative">
        <Input
          {...props}
          type={visible ? "text" : "password"}
          className="pr-12"
          onChange={(e) => {
            setValue(e.target.value);
            props.onChange?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-3">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("h-1 flex-1 rounded-full bg-white/10 transition-colors", i < score && colors[score])} />
            ))}
          </div>
          <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
            {checks.map((c) => (
              <li key={c.label} className={cn("flex items-center gap-1.5 text-xs", c.ok ? "text-up" : "text-muted")}>
                <Check className="size-3" /> {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
