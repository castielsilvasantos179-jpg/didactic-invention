import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// Mock the db module
vi.mock("./db", () => ({
  getLinkByShortCode: vi.fn(),
  getLinkByCustomAlias: vi.fn(),
  recordClick: vi.fn(),
  incrementLinkClicks: vi.fn(),
}));

// Mock the utils module
vi.mock("./utils", () => ({
  isFacebookBot: vi.fn().mockReturnValue(false),
  isBot: vi.fn().mockReturnValue(false),
  detectDeviceType: vi.fn().mockReturnValue("desktop"),
  parseBrowser: vi.fn().mockReturnValue({ browser: "Chrome", os: "Windows" }),
  getGeoLocation: vi.fn().mockResolvedValue({ country: "BR", countryName: "Brazil", city: "São Paulo", latitude: "-23.5", longitude: "-46.6" }),
  formatDateToYYYYMMDD: vi.fn().mockReturnValue("2024-01-01"),
  verifyPassword: vi.fn().mockReturnValue(true),
}));

import * as db from "./db";
import { handleRedirect } from "./redirect-handler";

describe("handleRedirect", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: { shortCode: "abc123" },
      headers: { "user-agent": "Mozilla/5.0" },
      ip: "127.0.0.1",
      connection: { remoteAddress: "127.0.0.1" } as any,
      query: {},
    };

    mockRes = {
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      send: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it("should call next() when link is not found (allows SPA to handle the route)", async () => {
    vi.mocked(db.getLinkByShortCode).mockResolvedValue(null);
    vi.mocked(db.getLinkByCustomAlias).mockResolvedValue(null);

    await handleRedirect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.redirect).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should call next() for SPA reserved routes like 'dashboard'", async () => {
    mockReq.params = { shortCode: "dashboard" };

    await handleRedirect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(db.getLinkByShortCode).not.toHaveBeenCalled();
  });

  it("should call next() for SPA reserved routes like 'link'", async () => {
    mockReq.params = { shortCode: "link" };

    await handleRedirect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(db.getLinkByShortCode).not.toHaveBeenCalled();
  });

  it("should redirect to original URL when link is found", async () => {
    const mockLink = {
      id: 1,
      userId: 1,
      shortCode: "abc123",
      customAlias: null,
      originalUrl: "https://example.com",
      password: null,
      expiresAt: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      ogType: "website",
      totalClicks: 0,
      lastClickAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getLinkByShortCode).mockResolvedValue(mockLink as any);
    vi.mocked(db.recordClick).mockResolvedValue(undefined as any);
    vi.mocked(db.incrementLinkClicks).mockResolvedValue(undefined as any);

    await handleRedirect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.redirect).toHaveBeenCalledWith(301, "https://example.com");
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 410 for expired links", async () => {
    const mockLink = {
      id: 1,
      userId: 1,
      shortCode: "abc123",
      customAlias: null,
      originalUrl: "https://example.com",
      password: null,
      expiresAt: new Date("2020-01-01"), // expired
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      ogType: "website",
      totalClicks: 0,
      lastClickAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getLinkByShortCode).mockResolvedValue(mockLink as any);

    await handleRedirect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(410);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Link expirado" });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
