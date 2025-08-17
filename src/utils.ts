import crypto from "node:crypto";

export function md5Lower(input: string) {
  return crypto.createHash("md5").update(input.trim().toLowerCase()).digest("hex");
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const t = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
  return Promise.race([p, t]);
}

export function toUserAgent() {
  return "social-from-email/0.1 (+https://www.npmjs.com/)";
}

/** minimal existence check (200-ish = maybe exists, 404 = no) */
export async function urlLooksAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": toUserAgent() }
    });
    // 200 OK or 301/302 -> OK final
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/** produce a few plausible handles from the email local-part */
export function candidateHandlesFromEmail(email: string): string[] {
  const local = email.split("@")[0] || "";
  const core = local.split("+")[0]; // drop +tag
  const naked = core.replace(/[\.\-_]/g, "");
  const parts = core.split(/[.\-_]/).filter(Boolean);

  const cands = new Set<string>();
  if (core.length >= 3) cands.add(core);
  if (naked.length >= 3) cands.add(naked);
  if (parts.length >= 2) {
    const [a, b] = parts;
    if ((a + b).length >= 3) cands.add(a + b);
    if ((b + a).length >= 3) cands.add(b + a);
    if ((a + "_" + b).length >= 3) cands.add(`${a}_${b}`);
  }
  // Keep short and sane
  return Array.from(cands).slice(0, 6);
}