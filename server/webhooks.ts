import axios from "axios";
import crypto from "crypto";
import { type Link } from "../drizzle/schema";

export type WebhookEvent = "link.created" | "link.updated" | "link.deleted" | "click.recorded" | "milestone.reached";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  signature: string;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Send webhook to external URL
 */
export async function sendWebhook(
  url: string,
  event: WebhookEvent,
  data: Record<string, any>,
  secret: string
): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data,
    });

    const signature = generateWebhookSignature(payload, secret);

    const response = await axios.post(url, JSON.parse(payload), {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
      },
      timeout: 10000, // 10 second timeout
    });

    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error(`Failed to send webhook to ${url}:`, error);
    return false;
  }
}

/**
 * Webhook event payloads
 */
export const webhookEvents = {
  linkCreated: (link: Link) => ({
    linkId: link.id,
    shortCode: link.shortCode,
    customAlias: link.customAlias,
    originalUrl: link.originalUrl,
    ogTitle: link.ogTitle,
    createdAt: link.createdAt,
  }),

  linkUpdated: (link: Link, changes: Record<string, any>) => ({
    linkId: link.id,
    shortCode: link.shortCode,
    changes,
    updatedAt: link.updatedAt,
  }),

  linkDeleted: (linkId: number, shortCode: string) => ({
    linkId,
    shortCode,
    deletedAt: new Date().toISOString(),
  }),

  clickRecorded: (linkId: number, country: string | null, deviceType: string, browser: string | null) => ({
    linkId,
    country,
    deviceType,
    browser,
    timestamp: new Date().toISOString(),
  }),

  milestoneReached: (linkId: number, shortCode: string, milestone: number, totalClicks: number) => ({
    linkId,
    shortCode,
    milestone,
    totalClicks,
    timestamp: new Date().toISOString(),
  }),
};
