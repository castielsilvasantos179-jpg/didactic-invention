import { Request, Response, NextFunction } from "express";
import * as db from "./db";
import {
  isFacebookBot,
  isBot,
  detectDeviceType,
  parseBrowser,
  getGeoLocation,
  formatDateToYYYYMMDD,
  verifyPassword,
} from "./utils";

// Rotas reservadas pelo SPA que NÃO devem ser tratadas como short codes
const SPA_ROUTES = new Set([
  "dashboard",
  "link",
  "404",
  "api",
  "__manus__",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

/**
 * Gera as meta tags Open Graph para o link
 */
function generateOpenGraphTags(link: any): string {
  const title = link.ogTitle || "LinkShort";
  const description = link.ogDescription || "Um link encurtado com LinkShort";
  const image = link.ogImage || "https://linkshort.app/og-image.png";
  const url = `https://linkshort.app/${link.shortCode || link.customAlias}`;

  return `
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="${link.ogType || "website"}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  `;
}

/**
 * Escapa caracteres HTML para evitar XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Gera HTML para exibir ao Facebook bot
 */
function generateFacebookPreviewHtml(link: any): string {
  const ogTags = generateOpenGraphTags(link);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(link.ogTitle || "LinkShort")}</title>
      ${ogTags}
      <script>
        // Redirecionar usuários reais para o link original
        if (!/facebookexternalhit|facebot|whatsapp|linkedinbot|twitterbot/i.test(navigator.userAgent)) {
          window.location.replace('${escapeHtml(link.originalUrl)}');
        }
      </script>
    </head>
    <body>
      <p>Redirecionando...</p>
    </body>
    </html>
  `;
}

/**
 * Handler para rota de redirecionamento /:shortCode
 * Se o shortCode não for encontrado no banco, passa para o próximo middleware (SPA)
 */
export async function handleRedirect(req: Request, res: Response, next: NextFunction) {
  const { shortCode } = req.params;
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection.remoteAddress || "";
  const referrer = req.headers.referer || "";

  // Se for uma rota reservada do SPA, passa para o próximo middleware
  if (SPA_ROUTES.has(shortCode)) {
    return next();
  }

  try {
    // Buscar link no banco de dados
    let link = await db.getLinkByShortCode(shortCode);

    // Se não encontrar por shortCode, tentar por customAlias
    if (!link) {
      link = await db.getLinkByCustomAlias(shortCode);
    }

    // Se não encontrar o link, passa para o próximo middleware (SPA vai tratar)
    if (!link) {
      return next();
    }

    // Verificar se o link expirou
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Link expirado" });
    }

    // Verificar se tem senha
    if (link.password) {
      const password = req.query.pwd as string;
      if (!password || !verifyPassword(password, link.password)) {
        return res.status(401).json({ error: "Link protegido por senha" });
      }
    }

    // Detectar se é Facebook bot
    const isFacebook = isFacebookBot(userAgent);
    const isABot = isBot(userAgent);

    // Registrar clique
    const deviceType = detectDeviceType(userAgent);
    const { browser, os } = parseBrowser(userAgent);
    const geoLocation = await getGeoLocation(ipAddress);
    const date = formatDateToYYYYMMDD(new Date());

    await db.recordClick(link.id, link.userId, {
      userAgent,
      ipAddress,
      referrer: referrer || undefined,
      country: geoLocation.country,
      countryName: geoLocation.countryName,
      city: geoLocation.city,
      latitude: geoLocation.latitude,
      longitude: geoLocation.longitude,
      deviceType,
      browser,
      os,
      isBot: isABot,
      botName: isFacebook ? "Facebook" : isABot ? "Bot" : undefined,
    });

    // Incrementar contador de cliques
    await db.incrementLinkClicks(link.id);

    // Se for Facebook bot, retornar HTML com Open Graph tags
    if (isFacebook) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(generateFacebookPreviewHtml(link));
    }

    // Para usuários reais, redirecionar para URL original
    res.redirect(301, link.originalUrl);
  } catch (error) {
    console.error("Error handling redirect:", error);
    // On database errors or unexpected failures, pass to next middleware (SPA)
    // This prevents 500 errors from blocking SPA routes when DB is unavailable
    return next();
  }
}

/**
 * Handler para API de redirecionamento (sem autenticação)
 */
export async function handlePublicRedirect(req: Request, res: Response) {
  const { code } = req.params;
  const password = req.query.pwd as string;

  try {
    // Buscar link
    let link = await db.getLinkByShortCode(code);
    if (!link) {
      link = await db.getLinkByCustomAlias(code);
    }

    if (!link) {
      return res.status(404).json({ error: "Link não encontrado" });
    }

    // Verificar expiração
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Link expirado" });
    }

    // Verificar senha
    if (link.password) {
      if (!password || !verifyPassword(password, link.password)) {
        return res.status(401).json({ error: "Link protegido por senha" });
      }
    }

    // Retornar informações do link
    return res.json({
      shortCode: link.shortCode,
      customAlias: link.customAlias,
      originalUrl: link.originalUrl,
      ogTitle: link.ogTitle,
      ogDescription: link.ogDescription,
      ogImage: link.ogImage,
      totalClicks: link.totalClicks,
      createdAt: link.createdAt,
    });
  } catch (error) {
    console.error("Error handling public redirect:", error);
    res.status(500).json({ error: "Erro ao processar requisição" });
  }
}
