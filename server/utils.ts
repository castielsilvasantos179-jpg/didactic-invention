import { nanoid } from "nanoid";
import * as crypto from "crypto";

/**
 * Gera um short code único e aleatório
 */
export function generateShortCode(length: number = 6): string {
  return nanoid(length);
}

/**
 * Valida uma URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detecta se o user-agent é um bot do Facebook
 */
export function isFacebookBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const facebookBots = [
    "facebookexternalhit",
    "facebot",
    "facebook",
    "og-bot",
    "whatsapp",
    "linkedinbot",
    "twitterbot",
  ];
  return facebookBots.some((bot) => userAgent.toLowerCase().includes(bot));
}

/**
 * Detecta se é um bot em geral
 */
export function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "curl",
    "wget",
    "python",
    "java",
    "ruby",
    "php",
    "perl",
    "node",
    "go-http-client",
    "axios",
    "httpx",
    "requests",
  ];
  return botPatterns.some((pattern) => userAgent.toLowerCase().includes(pattern));
}

/**
 * Detecta tipo de dispositivo a partir do user-agent
 */
export function detectDeviceType(
  userAgent: string
): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();

  // Mobile patterns
  if (
    /mobile|android|iphone|ipod|blackberry|windows phone|opera mini|iemobile/.test(ua)
  ) {
    return "mobile";
  }

  // Tablet patterns
  if (/ipad|tablet|kindle|playbook|nexus 7|nexus 10|xoom|silk/.test(ua)) {
    return "tablet";
  }

  // Desktop
  if (/windows|macintosh|linux|x11/.test(ua)) {
    return "desktop";
  }

  return "unknown";
}

/**
 * Extrai informações do browser a partir do user-agent
 */
export function parseBrowser(userAgent: string): { browser: string; os: string } {
  if (!userAgent) return { browser: "Unknown", os: "Unknown" };

  const ua = userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  // Detect OS
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|macintel/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/iphone|ios/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";

  // Detect Browser
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/trident/i.test(ua)) browser = "IE";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  return { browser, os };
}

/**
 * Criptografa uma senha com hash SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verifica se uma senha corresponde ao hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Gera uma API key aleatória
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Formata uma data para o formato YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extrai informações de geolocalização a partir de um IP
 * Nota: Esta é uma função stub. Em produção, usar um serviço como MaxMind GeoIP2
 */
export async function getGeoLocation(
  ipAddress: string
): Promise<{
  country?: string;
  countryName?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
}> {
  // Stub implementation - em produção, chamar um serviço de geolocalização
  // Por exemplo: https://ip-api.com/json/{ip}
  // ou usar MaxMind GeoIP2

  try {
    // Exemplo com ip-api.com (free tier)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,city,lat,lon,countryCode`);
    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.countryCode,
        countryName: data.country,
        city: data.city,
        latitude: String(data.lat),
        longitude: String(data.lon),
      };
    }
  } catch (error) {
    console.error("Error getting geolocation:", error);
  }

  return {};
}

/**
 * Sanitiza uma URL para evitar XSS
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Apenas permitir protocolos http e https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Valida um alias personalizado
 */
export function isValidAlias(alias: string): boolean {
  // Apenas letras, números, hífens e underscores
  // Mínimo 3 caracteres, máximo 50
  const aliasRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return aliasRegex.test(alias);
}
