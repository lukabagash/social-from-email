import type { Provider, SocialProfile } from "../types";
import { md5Lower, toUserAgent } from "../utils";

const GRAVATAR_HOSTS = [
  "https://www.gravatar.com",
  "https://en.gravatar.com",
  "https://secure.gravatar.com"
];

const SOCIAL_MAP = new Map<string, SocialProfile["network"]>([
  ["twitter", "twitter"],
  ["x", "twitter"],
  ["instagram", "instagram"],
  ["facebook", "facebook"],
  ["linkedin", "linkedin"]
]);

export const GravatarProvider: Provider = {
  name: "gravatar",

  async findByEmail(email, options) {
    const hash = md5Lower(email);
    const headers = { "User-Agent": toUserAgent(), "Accept": "application/json" };

    // Try multiple gravatar hosts; return first that responds with a profile
    for (const base of GRAVATAR_HOSTS) {
      try {
        const res = await fetch(`${base}/${hash}.json`, { headers });
        if (!res.ok) continue;
        const data: any = await res.json();
        const entry = data?.entry?.[0];
        if (!entry) continue;

        const out: Record<string, SocialProfile> = {};
        const accounts = Array.isArray(entry.accounts) ? entry.accounts : [];
        const urls = Array.isArray(entry.urls) ? entry.urls : [];

        const push = (network: SocialProfile["network"], url: string, username: string | null) => {
          out[network] = {
            network,
            exists: true,
            url,
            username,
            confidence: "high",
            method: "gravatar"
          };
        };

        for (const acc of accounts) {
          const shortname = String(acc.shortname || acc.domain || "").toLowerCase();
          const mapped = SOCIAL_MAP.get(shortname);
          if (mapped) push(mapped, String(acc.url || ""), acc.username ?? null);
        }

        for (const u of urls) {
          const value = String(u.value || "");
          if (!value) continue;
          const l = value.toLowerCase();
          if (l.includes("twitter.com")) push("twitter", value, null);
          else if (l.includes("instagram.com")) push("instagram", value, null);
          else if (l.includes("facebook.com")) push("facebook", value, null);
          else if (l.includes("linkedin.com")) push("linkedin", value, null);
        }

        return out;
      } catch {
        // try next host
      }
    }
    return {};
  }
};
