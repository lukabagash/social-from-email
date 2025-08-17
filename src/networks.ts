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

export async function verifyFacebook(firstName: string, lastName: string, email: string): Promise<Existence> {
  try {
    // Step 1: Get the initial page to extract required form parameters
    const initRes = await fetch("https://mbasic.facebook.com/login/identify/?ctx=recover&search_attempts=0&alternate_search=0&toggle_search_mode=0", {
      headers: { "User-Agent": ua() },
      redirect: "follow"
    });
    
    if (!initRes.ok) return null;
    
    const initHtml = await initRes.text();
    
    // Extract lsd and jazoest tokens from the HTML
    const lsdMatch = initHtml.match(/name="lsd"[^>]*value="([^"]+)"/);
    const jazoestMatch = initHtml.match(/name="jazoest"[^>]*value="([^"]+)"/);
    
    if (!lsdMatch || !jazoestMatch) return null;
    
    const lsd = lsdMatch[1];
    const jazoest = jazoestMatch[1];
    
    // Step 2: Submit the search form with email
    const formData = new URLSearchParams({
      lsd: lsd,
      jazoest: jazoest,
      email: email,
      did_submit: "Search"
    });
    
    const searchRes = await fetch("https://mbasic.facebook.com/login/identify/?ctx=recover&search_attempts=0&alternate_search=0&toggle_search_mode=0", {
      method: "POST",
      headers: {
        "User-Agent": ua(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString(),
      redirect: "follow"
    });
    
    if (!searchRes.ok) return null;
    
    // Step 3: Check the results page
    const viewRes = await fetch("https://mbasic.facebook.com/recover/initiate/?c=%2Flogin%2F&fl=initiate_view&ctx=msite_initiate_view", {
      headers: { "User-Agent": ua() },
      redirect: "follow"
    });
    
    if (!viewRes.ok) return null;
    
    const viewHtml = await viewRes.text();
    
    // Check if the page contains account information
    // Look for the account name container and verify it matches the provided names
    const nameMatch = viewHtml.match(/<div[^>]*class="bb bc"[^>]*>([^<]+)</);
    
    if (nameMatch) {
      const foundName = nameMatch[1].trim().toLowerCase();
      const expectedName1 = `${firstName} ${lastName}`.toLowerCase();
      const expectedName2 = `${lastName} ${firstName}`.toLowerCase();
      
      // Check if the found name contains both first and last names
      if (foundName.includes(firstName.toLowerCase()) && foundName.includes(lastName.toLowerCase()) ||
          foundName === expectedName1 || foundName === expectedName2) {
        return true;
      }
    }
    
    // Check for email/phone confirmation elements
    const emailPhonePattern = /<div[^>]*class="bk bl"[^>]*>/;
    if (emailPhonePattern.test(viewHtml)) {
      return true; // Account exists but need more verification
    }
    
    return false;
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
