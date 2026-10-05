import { SITE_URL } from "@/lib/env";

// Branded transactional email templates. Table-based HTML for maximum client support.

const APP_URL = SITE_URL;
// Email images must load from a public address. In local dev the site is on localhost,
// which mail clients can't reach, so fall back to the deployed app.
const ASSET_BASE = /localhost|127\.0\.0\.1/.test(SITE_URL) ? "https://lunobase.vercel.app" : SITE_URL;
const YEAR = new Date().getFullYear();

export type EmailContent = { subject: string; html: string; text: string };

type LayoutOpts = {
  preheader: string;
  title: string;
  body: string;
  cta?: { label: string; url: string };
  antiPhishing?: string | null;
  footerNote?: string;
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout({ preheader, title, body, cta, antiPhishing, footerNote }: LayoutOpts) {
  const antiPhishingBlock = antiPhishing
    ? `<tr><td style="padding:0 40px 8px"><table role="presentation" width="100%" style="background:#EDF2FF;border-radius:10px"><tr><td style="padding:10px 14px;font:500 12px/1.5 Inter,Arial,sans-serif;color:#1d2a4d">Anti-phishing code: <strong style="letter-spacing:.5px">${esc(antiPhishing)}</strong></td></tr></table></td></tr>`
    : "";
  const ctaBlock = cta
    ? `<tr><td style="padding:8px 40px 8px"><a href="${cta.url}" style="display:inline-block;background:#0052FF;color:#ffffff;text-decoration:none;font:600 15px/1 Inter,Arial,sans-serif;padding:15px 26px;border-radius:12px">${esc(cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#EEF1F7">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F7;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E3E7F0">
<tr><td bgcolor="#0B0F19" style="background:#0B0F19;padding:26px 40px"><a href="${APP_URL}" style="text-decoration:none"><img src="${ASSET_BASE}/brand/email-logo.png" alt="Lunobase" width="105" height="38" style="display:block;width:105px;height:38px;border:0;outline:none;color:#ffffff;font:700 20px Arial,sans-serif"></a></td></tr>
<tr><td style="height:4px;background:#0052FF;background:linear-gradient(90deg,#0052FF,#4F7FFF);font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:36px 40px 8px;font:700 22px/1.3 Inter,Arial,sans-serif;color:#0B0F19">${esc(title)}</td></tr>
<tr><td style="padding:4px 40px 20px;font:400 15px/1.65 Inter,Arial,sans-serif;color:#3B4252">${body}</td></tr>
${ctaBlock}
${antiPhishingBlock}
<tr><td style="padding:16px 40px 4px;font:400 12px/1.6 Inter,Arial,sans-serif;color:#9498A1">${footerNote ?? "If you didn't request this, secure your account immediately by changing your password and contacting support."}</td></tr>
<tr><td style="padding:20px 40px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #E9EDF5;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
<tr><td style="padding:18px 40px 30px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="44" valign="middle"><img src="${ASSET_BASE}/brand/app-icon-192.png" alt="" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:12px;border:0"></td>
<td valign="middle" style="padding-left:14px;font:400 13px/1.5 Inter,Arial,sans-serif;color:#6B7185">
<span style="font:600 14px/1.4 Inter,Arial,sans-serif;color:#0B0F19">The Lunobase Team</span><br>
Secure digital asset platform<br>
<a href="mailto:info@lunobase.com" style="color:#0052FF;text-decoration:none">info@lunobase.com</a>
</td>
</tr></table>
</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:22px 16px 8px;text-align:center;font:400 12px/1.7 Inter,Arial,sans-serif;color:#9498A1">
<a href="${APP_URL}/dashboard" style="color:#4F6BB5;text-decoration:none">Dashboard</a> &nbsp;·&nbsp;
<a href="${APP_URL}/support" style="color:#4F6BB5;text-decoration:none">Help center</a> &nbsp;·&nbsp;
<a href="${APP_URL}/security" style="color:#4F6BB5;text-decoration:none">Security</a> &nbsp;·&nbsp;
<a href="${APP_URL}/legal/privacy" style="color:#4F6BB5;text-decoration:none">Privacy</a>
</td></tr>
<tr><td style="padding:4px 16px 24px;text-align:center;font:400 11px/1.7 Inter,Arial,sans-serif;color:#A3A8B5">
Lunobase staff will never ask for your password, login codes or recovery phrase.<br>
Payments: <a href="mailto:payment@lunobase.com" style="color:#8A90A0;text-decoration:underline">payment@lunobase.com</a><br>
You received this email because you have a Lunobase account.<br>
&copy; ${YEAR} Lunobase. All rights reserved.
</td></tr></table>
</td></tr></table></body></html>`;
}

function codeBlock(code: string) {
  return `<table role="presentation" style="margin:18px 0 6px"><tr><td style="background:#F3F6FD;border:1px solid #DCE4F7;border-radius:14px;padding:18px 28px;font:700 32px/1 'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:10px;color:#0B0F19">${esc(code)}</td></tr></table>`;
}

function rows(pairs: [string, string][]) {
  return `<table role="presentation" width="100%" style="margin:16px 0;border-collapse:collapse">${pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 0;border-bottom:1px solid #EEF1F7;color:#9498A1;font-size:13px">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #EEF1F7;text-align:right;color:#0B0F19;font-weight:600;font-size:13px">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

type Common = { name?: string | null; antiPhishing?: string | null };

const hello = (name?: string | null) => `Hi ${esc(name?.split(" ")[0] || "there")},`;

export const templates = {
  verifyEmail({ name, url }: Common & { url: string }): EmailContent {
    return {
      subject: "Verify your Lunobase account",
      text: `Welcome to Lunobase. Verify your email: ${url}`,
      html: layout({
        preheader: "Confirm your email to activate your account.",
        title: "Confirm your email",
        body: `${hello(name)}<br><br>Welcome to Lunobase. Confirm your email address to activate your account and start trading. This link expires in 24 hours.`,
        cta: { label: "Verify email address", url },
        footerNote: "If you didn't create a Lunobase account, you can safely ignore this email.",
      }),
    };
  },

  resetPassword({ name, url, antiPhishing }: Common & { url: string }): EmailContent {
    return {
      subject: "Reset your Lunobase password",
      text: `Reset your password: ${url}`,
      html: layout({
        preheader: "A password reset was requested for your account.",
        title: "Reset your password",
        body: `${hello(name)}<br><br>We received a request to reset your password. For your security, withdrawals may be paused for 24 hours after a password change. This link expires in 1 hour.`,
        cta: { label: "Choose a new password", url },
        antiPhishing,
      }),
    };
  },

  loginCode({ name, code, device, ip, antiPhishing }: Common & { code: string; device: string; ip: string }): EmailContent {
    return {
      subject: `${code} is your Lunobase login code`,
      text: `Your Lunobase login code is ${code}. It expires in 10 minutes. Device: ${device}, IP: ${ip}.`,
      html: layout({
        preheader: `Your login code is ${code}. It expires in 10 minutes.`,
        title: "Your login verification code",
        body: `${hello(name)}<br><br>Enter this code to finish signing in. It expires in <strong>10 minutes</strong> and can only be used once.${codeBlock(code)}${rows([
          ["Device", device],
          ["IP address", ip],
        ])}Never share this code with anyone - not even Lunobase support.`,
        antiPhishing,
        footerNote: "Didn't try to sign in? Someone may know your password. Change it now and contact support.",
      }),
    };
  },

  newLogin({ name, device, ip, when, antiPhishing }: Common & { device: string; ip: string; when: string }): EmailContent {
    return {
      subject: "New sign-in to your Lunobase account",
      text: `New sign-in: ${device} from ${ip} at ${when}.`,
      html: layout({
        preheader: "We noticed a sign-in from a new device.",
        title: "New device sign-in",
        body: `${hello(name)}<br><br>Your account was just accessed from a device we haven't seen before.${rows([
          ["Device", device],
          ["IP address", ip],
          ["Time", when],
        ])}If this was you, no action is needed. If not, freeze your account from Security settings and contact support right away.`,
        cta: { label: "Review security activity", url: `${APP_URL}/dashboard/security` },
        antiPhishing,
      }),
    };
  },

  welcome({ name }: Common): EmailContent {
    return {
      subject: "Welcome to Lunobase",
      text: "Your account is verified. Fund your wallet to start trading.",
      html: layout({
        preheader: "Your account is ready.",
        title: "You're in. Welcome to Lunobase.",
        body: `${hello(name)}<br><br>Your email is verified and your account is ready. Fund your wallet, buy your first asset in seconds, and track everything from one dashboard.<br><br><strong>Security tip:</strong> set an anti-phishing code in Security settings so you can always recognise genuine Lunobase emails.`,
        cta: { label: "Go to dashboard", url: `${APP_URL}/dashboard` },
        footerNote: "Digital assets are volatile. Only invest what you can afford to lose.",
      }),
    };
  },

  depositSubmitted({ name, amount, asset, reference, antiPhishing }: Common & { amount: string; asset: string; reference: string }): EmailContent {
    return {
      subject: `Deposit received: ${amount} ${asset} pending confirmation`,
      text: `We received your deposit notice for ${amount} ${asset}. We'll credit your wallet once confirmed.`,
      html: layout({
        preheader: "Your deposit is being confirmed.",
        title: "Deposit pending confirmation",
        body: `${hello(name)}<br><br>We've received your deposit notice. Your wallet will update automatically as soon as it's confirmed.${rows([
          ["Amount", `${amount} ${asset}`],
          ["Reference", reference || "-"],
          ["Status", "Pending"],
        ])}`,
        cta: { label: "View wallet", url: `${APP_URL}/dashboard/wallet` },
        antiPhishing,
      }),
    };
  },

  depositApproved({ name, amount, asset, antiPhishing }: Common & { amount: string; asset: string }): EmailContent {
    return {
      subject: `Deposit confirmed: ${amount} ${asset}`,
      text: `${amount} ${asset} has been credited to your Lunobase wallet.`,
      html: layout({
        preheader: "Funds are now available in your wallet.",
        title: "Deposit confirmed",
        body: `${hello(name)}<br><br><strong>${esc(amount)} ${esc(asset)}</strong> has been credited to your wallet and is ready to trade.`,
        cta: { label: "Start trading", url: `${APP_URL}/dashboard/trade` },
        antiPhishing,
      }),
    };
  },

  depositRejected({ name, amount, asset, note, antiPhishing }: Common & { amount: string; asset: string; note?: string | null }): EmailContent {
    return {
      subject: "We couldn't confirm your deposit",
      text: `Your deposit of ${amount} ${asset} could not be confirmed. ${note ?? ""}`,
      html: layout({
        preheader: "Action may be required on your deposit.",
        title: "Deposit not confirmed",
        body: `${hello(name)}<br><br>We couldn't confirm your deposit of <strong>${esc(amount)} ${esc(asset)}</strong>.${note ? `<br><br>Reason: ${esc(note)}` : ""}<br><br>If you believe this is a mistake, reply via a support ticket with your payment proof.`,
        cta: { label: "Contact support", url: `${APP_URL}/dashboard/support` },
        antiPhishing,
      }),
    };
  },

  tradeFilled({ name, side, quantity, asset, price, total, fee, antiPhishing }: Common & { side: string; quantity: string; asset: string; price: string; total: string; fee: string }): EmailContent {
    return {
      subject: `Order filled: ${side} ${quantity} ${asset}`,
      text: `${side} ${quantity} ${asset} @ ${price}. Total ${total}.`,
      html: layout({
        preheader: `${side} ${quantity} ${asset} at ${price}`,
        title: `${side} order filled`,
        body: `${hello(name)}<br><br>Your market order was executed.${rows([
          ["Asset", asset],
          ["Quantity", quantity],
          ["Price", price],
          ["Fee", fee],
          ["Total", total],
        ])}`,
        cta: { label: "View portfolio", url: `${APP_URL}/dashboard` },
        antiPhishing,
        footerNote: "You can turn off trade confirmation emails in Settings.",
      }),
    };
  },

  withdrawalRequested({ name, amount, asset, destination, antiPhishing }: Common & { amount: string; asset: string; destination: string }): EmailContent {
    return {
      subject: `Withdrawal request received: ${amount} ${asset}`,
      text: `Your withdrawal of ${amount} ${asset} to ${destination} is under review.`,
      html: layout({
        preheader: "Your withdrawal is under security review.",
        title: "Withdrawal under review",
        body: `${hello(name)}<br><br>Every withdrawal is manually reviewed by our security team. Funds are held safely until review completes.${rows([
          ["Amount", `${amount} ${asset}`],
          ["Destination", destination],
          ["Status", "Under review"],
        ])}`,
        antiPhishing,
        footerNote: "Didn't request this? Freeze your account immediately from Security settings and contact support.",
      }),
    };
  },

  withdrawalUpdate({ name, amount, asset, approved, txHash, note, antiPhishing }: Common & { amount: string; asset: string; approved: boolean; txHash?: string | null; note?: string | null }): EmailContent {
    return {
      subject: approved ? `Withdrawal sent: ${amount} ${asset}` : "Withdrawal declined",
      text: approved ? `Your withdrawal of ${amount} ${asset} was sent.` : `Your withdrawal was declined. ${note ?? ""}`,
      html: layout({
        preheader: approved ? "Your funds are on the way." : "Your funds were returned to your wallet.",
        title: approved ? "Withdrawal completed" : "Withdrawal declined",
        body: approved
          ? `${hello(name)}<br><br><strong>${esc(amount)} ${esc(asset)}</strong> has been sent.${txHash ? rows([["Transaction", txHash]]) : ""}`
          : `${hello(name)}<br><br>Your withdrawal of <strong>${esc(amount)} ${esc(asset)}</strong> was declined and the funds were returned to your wallet.${note ? `<br><br>Reason: ${esc(note)}` : ""}`,
        cta: { label: "View wallet", url: `${APP_URL}/dashboard/wallet` },
        antiPhishing,
      }),
    };
  },

  ticketReply({ name, subject, message, ticketId, antiPhishing }: Common & { subject: string; message: string; ticketId: string }): EmailContent {
    return {
      subject: `Re: ${subject}`,
      text: message,
      html: layout({
        preheader: "Lunobase support replied to your ticket.",
        title: "Support replied to your ticket",
        body: `${hello(name)}<br><br><div style="background:#F6F8FC;border-left:3px solid #0052FF;border-radius:8px;padding:14px 16px;white-space:pre-wrap">${esc(message)}</div>`,
        cta: { label: "View conversation", url: `${APP_URL}/dashboard/support/${ticketId}` },
        antiPhishing,
      }),
    };
  },

  accountStatus({ name, status, antiPhishing }: Common & { status: string }): EmailContent {
    return {
      subject: status === "frozen" ? "Your Lunobase account is frozen" : `Your account status: ${status}`,
      text: `Your account status changed to ${status}.`,
      html: layout({
        preheader: `Account status changed to ${status}.`,
        title: status === "frozen" ? "Account frozen" : "Account status updated",
        body: `${hello(name)}<br><br>Your account status is now <strong>${esc(status)}</strong>. ${
          status === "frozen"
            ? "Trading and withdrawals are paused. To unfreeze, contact support from your dashboard."
            : status === "active"
              ? "Full access has been restored."
              : "Please contact support for more information."
        }`,
        cta: { label: "Contact support", url: `${APP_URL}/dashboard/support` },
        antiPhishing,
      }),
    };
  },

  adminAlert({ title, lines, url }: { title: string; lines: [string, string][]; url: string }): EmailContent {
    return {
      subject: `[Lunobase Admin] ${title}`,
      text: `${title}\n${lines.map(([k, v]) => `${k}: ${v}`).join("\n")}\n${url}`,
      html: layout({
        preheader: title,
        title,
        body: rows(lines),
        cta: { label: "Open admin panel", url },
        footerNote: "You're receiving this because you are a Lunobase administrator.",
      }),
    };
  },
};
