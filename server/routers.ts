import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import {
  generateShortCode,
  isValidUrl,
  isValidAlias,
  sanitizeUrl,
  hashPassword,
  verifyPassword,
  generateApiKey,
  formatDateToYYYYMMDD,
  getGeoLocation,
  detectDeviceType,
  parseBrowser,
  isFacebookBot,
  isBot,
} from "./utils";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // Links Management
  // ============================================================================
  links: router({
    create: protectedProcedure
      .input(
        z.object({
          originalUrl: z.string().url("URL inválida"),
          customAlias: z.string().optional(),
          password: z.string().optional(),
          expiresAt: z.date().optional(),
          ogTitle: z.string().optional(),
          ogDescription: z.string().optional(),
          ogImage: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isValidUrl(input.originalUrl)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "URL inválida",
          });
        }

        let customAlias = input.customAlias;
        if (customAlias) {
          if (!isValidAlias(customAlias)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Alias inválido. Use apenas letras, números, hífens e underscores (3-50 caracteres)",
            });
          }

          const existing = await db.getLinkByCustomAlias(customAlias);
          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Alias já está em uso",
            });
          }
        } else {
          customAlias = undefined;
        }

        const shortCode = generateShortCode();
        const sanitizedUrl = sanitizeUrl(input.originalUrl);
        const hashedPassword = input.password ? hashPassword(input.password) : undefined;

        const link = await db.createLink(ctx.user.id, {
          shortCode,
          customAlias,
          originalUrl: sanitizedUrl,
          password: hashedPassword,
          expiresAt: input.expiresAt,
          ogTitle: input.ogTitle,
          ogDescription: input.ogDescription,
          ogImage: input.ogImage,
        });

        return link;
      }),

    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          search: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserLinks(ctx.user.id, input.limit, input.offset);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const link = await db.getLinkById(input.id, ctx.user.id);
        if (!link) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Link não encontrado",
          });
        }
        return link;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          customAlias: z.string().optional(),
          password: z.string().optional(),
          expiresAt: z.date().optional(),
          ogTitle: z.string().optional(),
          ogDescription: z.string().optional(),
          ogImage: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const link = await db.getLinkById(input.id, ctx.user.id);
        if (!link) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Link não encontrado",
          });
        }

        const updateData: any = {};

        if (input.customAlias !== undefined) {
          if (input.customAlias && !isValidAlias(input.customAlias)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Alias inválido",
            });
          }
          updateData.customAlias = input.customAlias || null;
        }

        if (input.password !== undefined) {
          updateData.password = input.password ? hashPassword(input.password) : null;
        }

        if (input.expiresAt !== undefined) {
          updateData.expiresAt = input.expiresAt || null;
        }

        if (input.ogTitle !== undefined) {
          updateData.ogTitle = input.ogTitle || null;
        }

        if (input.ogDescription !== undefined) {
          updateData.ogDescription = input.ogDescription || null;
        }

        if (input.ogImage !== undefined) {
          updateData.ogImage = input.ogImage || null;
        }

        await db.updateLink(input.id, ctx.user.id, updateData);
        return await db.getLinkById(input.id, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const link = await db.getLinkById(input.id, ctx.user.id);
        if (!link) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Link não encontrado",
          });
        }

        await db.deleteLink(input.id, ctx.user.id);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const link = await db.getLinkById(input.id, ctx.user.id);
        if (!link) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Link não encontrado",
          });
        }

        const stats = await db.getLinkClickStats(input.id, ctx.user.id);
        const byCountry = await db.getClicksByCountry(input.id, ctx.user.id);
        const byDevice = await db.getClicksByDevice(input.id, ctx.user.id);

        return {
          totalClicks: stats.totalClicks,
          uniqueIps: stats.uniqueIps,
          lastClick: stats.lastClick,
          byCountry,
          byDevice,
        };
      }),

    recentClicks: protectedProcedure
      .input(z.object({ id: z.number(), limit: z.number().max(100).default(20) }))
      .query(async ({ ctx, input }) => {
        const link = await db.getLinkById(input.id, ctx.user.id);
        if (!link) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Link não encontrado",
          });
        }

        return db.getLinkClicks(input.id, ctx.user.id, input.limit);
      }),
  }),

  // ============================================================================
  // API Keys Management
  // ============================================================================
  apiKeys: router({
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const key = generateApiKey();
        await db.createApiKey(ctx.user.id, input.name, key);
        return { key };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const keys = await db.getUserApiKeys(ctx.user.id);
      return keys.map((k) => ({
        ...k,
        key: `...${k.key.slice(-4)}`,
      }));
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteApiKey(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // Webhooks Management
  // ============================================================================
  webhooks: router({
    create: protectedProcedure
      .input(
        z.object({
          url: z.string().url("URL inválida"),
          events: z.array(z.enum(["link.created", "link.updated", "link.deleted", "click.recorded", "milestone.reached"])),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const secret = generateApiKey();
        return await db.createWebhook(ctx.user.id, input.url, JSON.stringify(input.events), secret);
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserWebhooks(ctx.user.id);
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteWebhook(input.id, ctx.user.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          isActive: z.boolean().optional(),
          events: z.array(z.enum(["link.created", "link.updated", "link.deleted", "click.recorded", "milestone.reached"])).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.updateWebhook(input.id, ctx.user.id, input);
      }),
  }),

  // ============================================================================
  // User Settings
  // ============================================================================
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          theme: z.enum(["light", "dark"]).optional(),
          notificationsEnabled: z.boolean().optional(),
          notificationEmail: z.string().email().optional(),
          defaultOgImage: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.updateUserSettings(ctx.user.id, input);
      }),
  }),

  // ============================================================================
  // Dashboard Stats
  // ============================================================================
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const links = await db.getUserLinks(ctx.user.id, 1000, 0);
      const totalLinks = links.length;

      let totalClicks = 0;

      for (const link of links) {
        totalClicks += link.totalClicks || 0;
      }

      return {
        totalLinks,
        totalClicks,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
