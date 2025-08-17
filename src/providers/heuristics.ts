import type { Provider, SocialProfile } from "../types";
import { candidateHandlesFromEmail } from "../utils";
import { verifyTwitter, verifyInstagram, verifyFacebook, verifyLinkedIn } from "../networks";

/**
 * Heuristic provider: generate candidate handles, then verify using public pages/APIs.
 * - No auth, no password-reset, no sign-up probes.
 * - Returns only positive signals; ambiguous checks are skipped.
 */
export const HeuristicsProvider: Provider = {
  name: "heuristics",

  async findByEmail(email) {
    const handles = candidateHandlesFromEmail(email);
    const found: Record<string, SocialProfile> = {};

    const networks = [
      {
        key: "twitter",
        maker: (h: string) => `https://x.com/${h}`,
        verify: verifyTwitter
      },
      {
        key: "instagram",
        maker: (h: string) => `https://www.instagram.com/${h}/`,
        verify: verifyInstagram
      },
      {
        key: "facebook",
        maker: (h: string) => `https://www.facebook.com/${h}`,
        verify: verifyFacebook
      },
      {
        key: "linkedin",
        maker: (h: string) => `https://www.linkedin.com/in/${h}/`,
        verify: verifyLinkedIn
      }
    ] as const;

    for (const net of networks) {
      for (const h of handles) {
        const exists = await net.verify(h);
        if (exists === true) {
          found[net.key] = {
            network: net.key as any,
            username: h,
            url: net.maker(h),
            exists: true,
            confidence: net.key === "twitter" ? "medium" : "low",
            method: "inferred"
          };
          break;
        }
        // false => keep trying other handles; null => unknown, also try next handle
      }
    }

    return found;
  }
};
