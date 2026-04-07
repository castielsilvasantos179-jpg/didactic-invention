import { describe, it, expect } from "vitest";
import {
  generateShortCode,
  isValidUrl,
  isFacebookBot,
  isBot,
  detectDeviceType,
  parseBrowser,
  hashPassword,
  verifyPassword,
  isValidAlias,
  sanitizeUrl,
} from "./utils";

describe("Utils", () => {
  describe("generateShortCode", () => {
    it("should generate a short code of specified length", () => {
      const code = generateShortCode(6);
      expect(code).toHaveLength(6);
      expect(/^[a-zA-Z0-9_-]+$/.test(code)).toBe(true);
    });

    it("should generate different codes on multiple calls", () => {
      const code1 = generateShortCode();
      const code2 = generateShortCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe("isValidUrl", () => {
    it("should validate correct URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com/path")).toBe(true);
      expect(isValidUrl("https://example.com/path?query=value")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
    });
  });

  describe("isFacebookBot", () => {
    it("should detect Facebook bots", () => {
      expect(isFacebookBot("facebookexternalhit/1.1")).toBe(true);
      expect(isFacebookBot("Facebot")).toBe(true);
      expect(isFacebookBot("WhatsApp/2.21.0")).toBe(true);
      expect(isFacebookBot("LinkedInBot/1.0")).toBe(true);
    });

    it("should not detect regular browsers as bots", () => {
      expect(isFacebookBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")).toBe(false);
      expect(isFacebookBot("")).toBe(false);
    });
  });

  describe("isBot", () => {
    it("should detect various bots", () => {
      expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
      expect(isBot("curl/7.64.1")).toBe(true);
      expect(isBot("python-requests/2.25.1")).toBe(true);
    });

    it("should not detect regular browsers as bots", () => {
      expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")).toBe(false);
      expect(isBot("")).toBe(false);
    });
  });

  describe("detectDeviceType", () => {
    it("should detect mobile devices", () => {
      expect(detectDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")).toBe("mobile");
      expect(detectDeviceType("Mozilla/5.0 (Linux; Android 10)")).toBe("mobile");
    });

    it("should detect tablets", () => {
      expect(detectDeviceType("Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)")).toBe("tablet");
      expect(detectDeviceType("Mozilla/5.0 (Kindle Fire)")).toBe("tablet");
    });

    it("should detect desktop", () => {
      expect(detectDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
      expect(detectDeviceType("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("desktop");
    });

    it("should return unknown for empty user agent", () => {
      expect(detectDeviceType("")).toBe("unknown");
    });
  });

  describe("parseBrowser", () => {
    it("should parse Chrome browser", () => {
      const result = parseBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0");
      expect(result.browser).toBe("Chrome");
      expect(result.os).toBe("Windows");
    });

    it("should parse Firefox browser", () => {
      const result = parseBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0");
      expect(result.browser).toBe("Firefox");
      expect(result.os).toBe("Windows");
    });

    it("should parse Safari browser", () => {
      const result = parseBrowser("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15");
      expect(result.browser).toBe("Safari");
      expect(result.os).toBe("macOS");
    });
  });

  describe("Password hashing", () => {
    it("should hash passwords", () => {
      const password = "myPassword123";
      const hash = hashPassword(password);
      expect(hash).toHaveLength(64); // SHA-256 hex length
      expect(hash).not.toBe(password);
    });

    it("should verify correct passwords", () => {
      const password = "myPassword123";
      const hash = hashPassword(password);
      expect(verifyPassword(password, hash)).toBe(true);
    });

    it("should reject incorrect passwords", () => {
      const password = "myPassword123";
      const hash = hashPassword(password);
      expect(verifyPassword("wrongPassword", hash)).toBe(false);
    });

    it("should produce same hash for same password", () => {
      const password = "myPassword123";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      expect(hash1).toBe(hash2);
    });
  });

  describe("isValidAlias", () => {
    it("should accept valid aliases", () => {
      expect(isValidAlias("my-link")).toBe(true);
      expect(isValidAlias("my_link")).toBe(true);
      expect(isValidAlias("mylink123")).toBe(true);
      expect(isValidAlias("abc")).toBe(true);
    });

    it("should reject invalid aliases", () => {
      expect(isValidAlias("ab")).toBe(false); // Too short
      expect(isValidAlias("a".repeat(51))).toBe(false); // Too long
      expect(isValidAlias("my link")).toBe(false); // Contains space
      expect(isValidAlias("my@link")).toBe(false); // Contains special char
      expect(isValidAlias("my.link")).toBe(false); // Contains dot
    });
  });

  describe("sanitizeUrl", () => {
    it("should sanitize valid URLs", () => {
      const url = "https://example.com/path";
      expect(sanitizeUrl(url)).toBe(url);
    });

    it("should reject invalid protocols", () => {
      expect(sanitizeUrl("javascript:alert('xss')")).toBe("");
      expect(sanitizeUrl("data:text/html,<script>alert('xss')</script>")).toBe("");
    });

    it("should accept http and https", () => {
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
    });
  });
});
