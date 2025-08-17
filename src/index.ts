import type { EnrichmentResult, Provider } from "./types";
import { GravatarProvider } from "./providers/gravatar";
import { HeuristicsProvider } from "./providers/heuristics";

export interface Options {
  providers?: Provider[];
  timeoutMs?: number;
}

export async function enrichEmail(email: string, opts: Options = {}): Promise<EnrichmentResult> {
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    throw new Error("Invalid email");
  }

  const providers = opts.providers ?? [GravatarProvider, HeuristicsProvider];
  const attempted: string[] = [];
  const start = Date.now();

  // Run providers sequentially so high-confidence data can win and avoid site throttling.
  const profiles: EnrichmentResult["profiles"] = {};

  for (const p of providers) {
    attempted.push(p.name);
    const part = await p.findByEmail(email);

    for (const [k, v] of Object.entries(part)) {
      const net = k as keyof typeof profiles;
      // prefer highest confidence (gravatar > inferred)
      const prev = profiles[net];
      if (!prev || (prev.confidence === "low" && v.confidence !== "low")) {
        profiles[net] = v;
      }
    }
  }

  return {
    email,
    profiles,
    meta: {
      attempted_providers: attempted,
      timing_ms: Date.now() - start
    }
  };
}

export type { EnrichmentResult };