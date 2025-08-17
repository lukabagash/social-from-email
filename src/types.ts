export type Network = "twitter" | "instagram" | "facebook" | "linkedin";

export type Confidence = "high" | "medium" | "low";

export interface SocialProfile {
  network: Network;
  username: string | null;
  url: string | null;
  exists: boolean;
  confidence: Confidence;
  method: "gravatar" | "inferred" | "search";
}

export interface EnrichmentResult {
  email: string;
  profiles: Partial<Record<Network, SocialProfile>>;
  meta: {
    attempted_providers: string[];
    timing_ms: number;
  };
}

export interface Provider {
  name: string;
  findByEmail(email: string, options?: { firstName?: string; lastName?: string }): Promise<Partial<Record<Network, SocialProfile>>>;
}
