import rateLimit from "express-rate-limit";
import { type Request, type Response, type NextFunction } from "express";

// Rate limiter for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});

// Stricter rate limiter for link creation
export const createLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 link creations per hour
  message: "Limite de criação de links atingido. Tente novamente em 1 hora.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 attempts per windowMs
  message: "Muitas tentativas de login. Tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Custom rate limiter that checks API keys
export const apiKeyLimiter = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["authorization"]?.replace("Bearer ", "");
  
  if (apiKey) {
    // API key authenticated requests get higher limits
    const limiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000, // 1000 requests per hour for authenticated users
      keyGenerator: () => apiKey,
      skip: () => false,
    });
    return limiter(req, res, next);
  }
  
  // Non-authenticated requests use standard limits
  return apiLimiter(req, res, next);
};
