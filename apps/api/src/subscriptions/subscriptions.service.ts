import { ForbiddenException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly cache = new Map<string, { active: boolean; expiresAt: number }>();

  async assertPremium(userId: string) {
    if (!await this.isPremium(userId, true)) throw new ForbiddenException("Premium subscription required");
  }

  async isPremium(userId: string, strict = false): Promise<boolean> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.active;
    const key = process.env.REVENUECAT_SECRET_API_KEY;
    if (!key) {
      this.logger.error("REVENUECAT_SECRET_API_KEY is not configured");
      if (strict) throw new ServiceUnavailableException("Subscription validation is unavailable");
      return false;
    }
    try {
      const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
      if (!response.ok) throw new Error(`RevenueCat returned ${response.status}`);
      const payload = await response.json() as { subscriber?: { entitlements?: Record<string, { expires_date?: string | null }> } };
      const premium = payload.subscriber?.entitlements?.premium;
      const active = Boolean(premium && (!premium.expires_date || Date.parse(premium.expires_date) > Date.now()));
      this.cache.set(userId, { active, expiresAt: Date.now() + Number(process.env.SUBSCRIPTION_CACHE_TTL_MS ?? 5 * 60 * 1000) });
      return active;
    } catch (error) {
      this.logger.warn(`Could not validate subscription: ${String(error)}`);
      if (strict) throw new ServiceUnavailableException("Could not validate subscription");
      return false;
    }
  }
}
