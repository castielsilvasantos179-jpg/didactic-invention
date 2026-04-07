import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  links,
  clicks,
  apiKeys,
  dailyAnalytics,
  webhooks,
  userSettings,
  type Link,
  type Click,
  type ApiKey,
  type DailyAnalytic,
  type Webhook,
  type UserSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Links Operations
// ============================================================================

export async function createLink(
  userId: number,
  data: {
    shortCode: string;
    customAlias?: string;
    originalUrl: string;
    password?: string;
    expiresAt?: Date;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(links).values({
    userId,
    shortCode: data.shortCode,
    customAlias: data.customAlias || null,
    originalUrl: data.originalUrl,
    password: data.password || null,
    expiresAt: data.expiresAt || null,
    ogTitle: data.ogTitle || null,
    ogDescription: data.ogDescription || null,
    ogImage: data.ogImage || null,
  });

  return result;
}

export async function getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(links)
    .where(eq(links.shortCode, shortCode))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getLinkByCustomAlias(customAlias: string): Promise<Link | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(links)
    .where(eq(links.customAlias, customAlias))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getLinkById(linkId: number, userId: number): Promise<Link | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserLinks(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateLink(
  linkId: number,
  userId: number,
  data: Partial<{
    customAlias: string | null;
    password: string | null;
    expiresAt: Date | null;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(links)
    .set(data)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)));
}

export async function deleteLink(linkId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated clicks and analytics first
  await db.delete(clicks).where(eq(clicks.linkId, linkId));
  await db.delete(dailyAnalytics).where(eq(dailyAnalytics.linkId, linkId));

  return db
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)));
}

export async function incrementLinkClicks(linkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(links)
    .set({
      totalClicks: sql`${links.totalClicks} + 1`,
      lastClickAt: new Date(),
    })
    .where(eq(links.id, linkId));
}

// ============================================================================
// Clicks Operations
// ============================================================================

export async function recordClick(
  linkId: number,
  userId: number,
  data: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    country?: string;
    countryName?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    deviceType?: "mobile" | "tablet" | "desktop" | "unknown";
    browser?: string;
    os?: string;
    isBot?: boolean;
    botName?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(clicks).values({
    linkId,
    userId,
    userAgent: data.userAgent || null,
    ipAddress: data.ipAddress || null,
    referrer: data.referrer || null,
    country: data.country || null,
    countryName: data.countryName || null,
    city: data.city || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    deviceType: data.deviceType || "unknown",
    browser: data.browser || null,
    os: data.os || null,
    isBot: data.isBot || false,
    botName: data.botName || null,
  });
}

export async function getLinkClicks(linkId: number, userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.userId, userId)))
    .orderBy(desc(clicks.createdAt))
    .limit(limit);
}

export async function getLinkClickStats(linkId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      totalClicks: sql<number>`COUNT(*)`,
      uniqueIps: sql<number>`COUNT(DISTINCT ${clicks.ipAddress})`,
      lastClick: sql<Date>`MAX(${clicks.createdAt})`,
    })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.userId, userId)));

  return result[0] || { totalClicks: 0, uniqueIps: 0, lastClick: null };
}

export async function getClicksByCountry(linkId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      country: clicks.countryName,
      count: sql<number>`COUNT(*) as count`,
    })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.userId, userId)))
    .groupBy(clicks.countryName)
    .orderBy(desc(sql`count`));
}

export async function getClicksByDevice(linkId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      deviceType: clicks.deviceType,
      count: sql<number>`COUNT(*) as count`,
    })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.userId, userId)))
    .groupBy(clicks.deviceType)
    .orderBy(desc(sql`count`));
}

// ============================================================================
// API Keys Operations
// ============================================================================

export async function createApiKey(userId: number, name: string, key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(apiKeys).values({
    userId,
    name,
    key,
  });
}

export async function getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function deleteApiKey(keyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

export async function updateApiKeyLastUsed(keyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

// ============================================================================
// Daily Analytics Operations
// ============================================================================

export async function recordDailyAnalytic(
  linkId: number,
  userId: number,
  date: string,
  clickCount: number,
  uniqueIps: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .insert(dailyAnalytics)
    .values({
      linkId,
      userId,
      date,
      clickCount,
      uniqueIps,
    })
    .onDuplicateKeyUpdate({
      set: {
        clickCount: sql`${dailyAnalytics.clickCount} + ${clickCount}`,
        uniqueIps: sql`${dailyAnalytics.uniqueIps} + ${uniqueIps}`,
      },
    });
}

export async function getDailyAnalytics(
  linkId: number,
  userId: number,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(dailyAnalytics.linkId, linkId), eq(dailyAnalytics.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(dailyAnalytics.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(dailyAnalytics.date, endDate));
  }

  return db
    .select()
    .from(dailyAnalytics)
    .where(and(...conditions))
    .orderBy(desc(dailyAnalytics.date));
}


// ============================================================================
// Webhooks Operations
// ============================================================================

export async function createWebhook(userId: number, url: string, events: string, secret: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(webhooks).values({
    userId,
    url,
    events,
    secret,
  });
}

export async function getUserWebhooks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(webhooks)
    .where(eq(webhooks.userId, userId))
    .orderBy(desc(webhooks.createdAt));
}

export async function deleteWebhook(webhookId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(webhooks)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)));
}

export async function updateWebhook(webhookId: number, userId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
  }
  if (updates.events !== undefined) {
    updateData.events = JSON.stringify(updates.events);
  }

  return db
    .update(webhooks)
    .set(updateData)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)));
}

// ============================================================================
// User Settings Operations
// ============================================================================

export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  // Create default settings if they don't exist
  await db.insert(userSettings).values({
    userId,
    theme: "light",
    notificationsEnabled: true,
  });

  return db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)
    .then((r) => (r.length > 0 ? r[0] : undefined));
}

export async function updateUserSettings(userId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.theme !== undefined) {
    updateData.theme = updates.theme;
  }
  if (updates.notificationsEnabled !== undefined) {
    updateData.notificationsEnabled = updates.notificationsEnabled;
  }
  if (updates.notificationEmail !== undefined) {
    updateData.notificationEmail = updates.notificationEmail || null;
  }
  if (updates.defaultOgImage !== undefined) {
    updateData.defaultOgImage = updates.defaultOgImage || null;
  }

  return db
    .update(userSettings)
    .set(updateData)
    .where(eq(userSettings.userId, userId));
}
