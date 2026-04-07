import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * API Keys table for programmatic access
 */
export const apiKeys = mysqlTable(
  "apiKeys",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    key: varchar("key", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    lastUsedAt: timestamp("lastUsedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("apiKeys_userId_idx").on(table.userId),
  })
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Shortened Links table
 */
export const links = mysqlTable(
  "links",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    shortCode: varchar("shortCode", { length: 20 }).notNull().unique(),
    customAlias: varchar("customAlias", { length: 255 }).unique(),
    originalUrl: text("originalUrl").notNull(),
    password: varchar("password", { length: 255 }),
    expiresAt: timestamp("expiresAt"),
    
    // Open Graph metadata
    ogTitle: varchar("ogTitle", { length: 255 }),
    ogDescription: text("ogDescription"),
    ogImage: text("ogImage"),
    ogType: varchar("ogType", { length: 50 }).default("website"),
    
    // Statistics
    totalClicks: int("totalClicks").default(0).notNull(),
    lastClickAt: timestamp("lastClickAt"),
    
    // Metadata
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("links_userId_idx").on(table.userId),
    shortCodeIdx: index("links_shortCode_idx").on(table.shortCode),
    customAliasIdx: index("links_customAlias_idx").on(table.customAlias),
    expiresAtIdx: index("links_expiresAt_idx").on(table.expiresAt),
  })
);

export type Link = typeof links.$inferSelect;
export type InsertLink = typeof links.$inferInsert;

/**
 * Click Analytics table - tracks each click on a shortened link
 */
export const clicks = mysqlTable(
  "clicks",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    linkId: int("linkId").notNull(),
    userId: int("userId").notNull(),
    
    // Request metadata
    userAgent: text("userAgent"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    referrer: text("referrer"),
    
    // Geolocation
    country: varchar("country", { length: 2 }),
    countryName: varchar("countryName", { length: 100 }),
    city: varchar("city", { length: 100 }),
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),
    
    // Device detection
    deviceType: mysqlEnum("deviceType", ["mobile", "tablet", "desktop", "unknown"])
      .default("unknown")
      .notNull(),
    browser: varchar("browser", { length: 100 }),
    os: varchar("os", { length: 100 }),
    
    // Bot detection
    isBot: boolean("isBot").default(false).notNull(),
    botName: varchar("botName", { length: 100 }),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    linkIdIdx: index("clicks_linkId_idx").on(table.linkId),
    userIdIdx: index("clicks_userId_idx").on(table.userId),
    createdAtIdx: index("clicks_createdAt_idx").on(table.createdAt),
    countryIdx: index("clicks_country_idx").on(table.country),
    deviceTypeIdx: index("clicks_deviceType_idx").on(table.deviceType),
  })
);

export type Click = typeof clicks.$inferSelect;
export type InsertClick = typeof clicks.$inferInsert;

/**
 * Daily Analytics Summary - for faster queries
 */
export const dailyAnalytics = mysqlTable(
  "dailyAnalytics",
  {
    id: int("id").autoincrement().primaryKey(),
    linkId: int("linkId").notNull(),
    userId: int("userId").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
    
    clickCount: int("clickCount").default(0).notNull(),
    uniqueIps: int("uniqueIps").default(0).notNull(),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    linkIdDateIdx: index("dailyAnalytics_linkId_date_idx").on(
      table.linkId,
      table.date
    ),
    userIdIdx: index("dailyAnalytics_userId_idx").on(table.userId),
  })
);

export type DailyAnalytic = typeof dailyAnalytics.$inferSelect;
export type InsertDailyAnalytic = typeof dailyAnalytics.$inferInsert;

/**
 * Webhooks table - for sending events to external services
 */
export const webhooks = mysqlTable(
  "webhooks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    url: text("url").notNull(),
    events: varchar("events", { length: 255 }).notNull(), // JSON array of events
    secret: varchar("secret", { length: 255 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("webhooks_userId_idx").on(table.userId),
  })
);

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

/**
 * User Settings table - for customization and preferences
 */
export const userSettings = mysqlTable(
  "userSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    customDomain: varchar("customDomain", { length: 255 }),
    theme: mysqlEnum("theme", ["light", "dark"]).default("light").notNull(),
    notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
    notificationEmail: varchar("notificationEmail", { length: 320 }),
    defaultOgImage: text("defaultOgImage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userSettings_userId_idx").on(table.userId),
  })
);

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Rate Limit Tracking - for API rate limiting
 */
export const rateLimitTracking = mysqlTable(
  "rateLimitTracking",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: int("userId"),
    apiKey: varchar("apiKey", { length: 64 }),
    ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    requestCount: int("requestCount").default(1).notNull(),
    windowStart: timestamp("windowStart").notNull(),
    windowEnd: timestamp("windowEnd").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("rateLimitTracking_userId_idx").on(table.userId),
    ipAddressIdx: index("rateLimitTracking_ipAddress_idx").on(table.ipAddress),
    windowIdx: index("rateLimitTracking_window_idx").on(table.windowStart, table.windowEnd),
  })
);

export type RateLimitTracking = typeof rateLimitTracking.$inferSelect;
export type InsertRateLimitTracking = typeof rateLimitTracking.$inferInsert;
