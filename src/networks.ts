// Lightweight, unauthenticated existence checks per network.
// Returns: true = exists, false = definitely not found, null = unknown/undeterminable.

export type Existence = boolean | null;

function ua() {
  return "social-from-email/0.1 (+https://www.npmjs.com/)";
}

export async function verifyTwitter(handle: string): Promise<Existence> {
  try {
    const url = `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(handle)}`;
    const res = await fetch(url, { headers: { "User-Agent": ua(), "Accept": "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? true : false;
  } catch {
    return null;
  }
}

export async function verifyInstagram(handle: string): Promise<Existence> {
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      redirect: "follow",
      headers: { "User-Agent": ua() }
    });
    if (res.status === 404) return false;
    if (res.status >= 200 && res.status < 400) return true; // login wall still implies the handle exists
    return null;
  } catch {
    return null;
  }
}

export async function verifyFacebook(handle: string): Promise<Existence> {
  try {
    const res = await fetch(`https://m.facebook.com/${encodeURIComponent(handle)}`, {
      redirect: "follow",
      headers: { "User-Agent": ua() }
    });
    if (res.status === 404) return false;
    if (res.status >= 200 && res.status < 400) return null; // ambiguous without auth
    return null;
  } catch {
    return null;
  }
}

export async function verifyLinkedIn(handle: string): Promise<Existence> {
  try {
    const res = await fetch(`https://www.linkedin.com/in/${encodeURIComponent(handle)}/`, {
      redirect: "follow",
      headers: { "User-Agent": ua() }
    });
    if (res.status === 404) return false;
    if (res.status === 999) return null; // anti-bot
    if (res.status >= 200 && res.status < 400) return true;
    return null;
  } catch {
    return null;
  }
}
