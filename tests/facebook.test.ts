import { describe, it, expect, beforeEach, vi } from "vitest";
import { verifyFacebook } from "../src/networks";

// Mock fetch to avoid making real HTTP requests during tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("verifyFacebook", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should return null when initial page request fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(null);
  });

  it("should return null when lsd token is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<html><body>No tokens here</body></html>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(null);
  });

  it("should return null when jazoest token is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><body>No jazoest here</body>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(null);
  });

  it("should return null when search request fails", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(null);
  });

  it("should return null when view request fails", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(null);
  });

  it("should return false when no account information is found", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds but no account info
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<html><body>No account found</body></html>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(false);
  });

  it("should return true when exact name match is found", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds with matching name
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="bb bc">John Doe</div>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(true);
  });

  it("should return true when reversed name match is found", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds with reversed name
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="bb bc">Doe John</div>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(true);
  });

  it("should return true when name contains both first and last names", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds with partial name match
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="bb bc">John Michael Doe Jr.</div>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(true);
  });

  it("should return true when email/phone confirmation elements are found", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds with email/phone elements
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="bk bl">john****@example.com</div>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(true);
  });

  it("should be case insensitive for name matching", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds with uppercase name
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="bb bc">JOHN DOE</div>')
    });

    const result = await verifyFacebook("john", "doe", "john.doe@example.com");
    expect(result).toBe(true);
  });

  it("should return false when name doesn't match", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds with different name
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="bb bc">Jane Smith</div>')
    });

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(false);
  });

  it("should return null when network error occurs", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await verifyFacebook("John", "Doe", "john.doe@example.com");
    expect(result).toBe(null);
  });

  it("should make requests with correct parameters", async () => {
    // Initial request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<input name="lsd" value="test_lsd"><input name="jazoest" value="test_jazoest">')
    });

    // Search request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    // View request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="bb bc">John Doe</div>')
    });

    await verifyFacebook("John", "Doe", "john.doe@example.com");

    // Check that the correct number of requests were made
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Check initial request
    expect(mockFetch).toHaveBeenNthCalledWith(1, 
      "https://mbasic.facebook.com/login/identify/?ctx=recover&search_attempts=0&alternate_search=0&toggle_search_mode=0",
      expect.objectContaining({
        headers: expect.objectContaining({ "User-Agent": "social-from-email/0.1 (+https://www.npmjs.com/)" }),
        redirect: "follow"
      })
    );

    // Check search request
    expect(mockFetch).toHaveBeenNthCalledWith(2,
      "https://mbasic.facebook.com/login/identify/?ctx=recover&search_attempts=0&alternate_search=0&toggle_search_mode=0",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "User-Agent": "social-from-email/0.1 (+https://www.npmjs.com/)",
          "Content-Type": "application/x-www-form-urlencoded"
        }),
        body: "lsd=test_lsd&jazoest=test_jazoest&email=john.doe%40example.com&did_submit=Search",
        redirect: "follow"
      })
    );

    // Check view request
    expect(mockFetch).toHaveBeenNthCalledWith(3,
      "https://mbasic.facebook.com/recover/initiate/?c=%2Flogin%2F&fl=initiate_view&ctx=msite_initiate_view",
      expect.objectContaining({
        headers: expect.objectContaining({ "User-Agent": "social-from-email/0.1 (+https://www.npmjs.com/)" }),
        redirect: "follow"
      })
    );
  });
});
