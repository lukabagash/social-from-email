import type { Provider, SocialProfile } from "../types";
import { candidateHandlesFromEmail, urlLooksAlive } from "../utils";

/**
 * Heuristic provider: guess usernames from the email local-part and probe profile URLs.
 * Confidence is low; return only if the URL looks alive.
 */
export const HeuristicsProvider: Provider = {
  name: "heuristics",

  async findByEmail(email) {
    const handles = candidateHandlesFromEmail(email);
    const networks = [
      { key: "twitter", make: (h: string) => `https://x.com/${h}` },
      { key: "instagram", make: (h: string) => `https://www.instagram.com/${h}/` },
      { key: "facebook", make: (h: string) => `https://www.facebook.com/${h}` },
      { key: "linkedin", make: (h: string) => `https://www.linkedin.com/in/${h}/` }
    ] as const;

    const found: Record<string, SocialProfile> = {};

    for (const net of networks) {
      // If we already found something (from Gravatar later), skip here.
      if (found[net.key]) continue;

      for (const h of handles) {
        const url = net.make(h);
        const alive = await urlLooksAlive(url);
        if (alive) {
          found[net.key] = {
            network: net.key,
            username: h,
            url,
            exists: true,
            confidence: "low",
            method: "inferred"
          };
          break; // stop trying handles for this network
        }
      }
    }
    return found;
  }
};
