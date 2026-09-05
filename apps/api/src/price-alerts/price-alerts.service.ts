import { Injectable, NotFoundException } from "@nestjs/common";
import { type NormalizedOffer } from "@pricelens/shared";
import { ShoppingProvidersService } from "../shopping-providers/shopping-providers.service";
import { CreatePriceAlertDto } from "./dto/create-price-alert.dto";
import { UpdatePriceAlertDto } from "./dto/update-price-alert.dto";

export interface PriceAlert {
  id: string;
  userId: string;
  query: string;
  title: string;
  brand?: string;
  model?: string;
  country: string;
  currency: string;
  targetPrice: number;
  enabled: boolean;
  lastCheckedAt?: string;
  lastMatchedAt?: string;
  lastBestOffer?: NormalizedOffer;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PriceAlertsService {
  private readonly alertsByUser = new Map<string, PriceAlert[]>();

  constructor(private readonly shoppingProvidersService: ShoppingProvidersService) {}

  list(userId: string) {
    return this.alertsByUser.get(userId) ?? [];
  }

  create(userId: string, dto: CreatePriceAlertDto) {
    const now = new Date().toISOString();
    const alert: PriceAlert = {
      id: `alert_${crypto.randomUUID()}`,
      userId,
      query: dto.query.trim(),
      title: dto.title?.trim() || dto.query.trim(),
      brand: dto.brand?.trim() || undefined,
      model: dto.model?.trim() || undefined,
      country: dto.country?.trim() || "PT",
      currency: dto.currency?.trim() || "EUR",
      targetPrice: dto.targetPrice,
      enabled: dto.enabled ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.alertsByUser.set(userId, [alert, ...this.list(userId)]);
    return alert;
  }

  update(userId: string, id: string, dto: UpdatePriceAlertDto) {
    const { alert, alerts, index } = this.findForUser(userId, id);
    const updated: PriceAlert = {
      ...alert,
      query: dto.query?.trim() ?? alert.query,
      title: dto.title?.trim() ?? alert.title,
      brand: dto.brand?.trim() ?? alert.brand,
      model: dto.model?.trim() ?? alert.model,
      country: dto.country?.trim() ?? alert.country,
      currency: dto.currency?.trim() ?? alert.currency,
      targetPrice: dto.targetPrice ?? alert.targetPrice,
      enabled: dto.enabled ?? alert.enabled,
      updatedAt: new Date().toISOString()
    };
    alerts[index] = updated;
    return updated;
  }

  remove(userId: string, id: string) {
    const { alert, alerts, index } = this.findForUser(userId, id);
    alerts.splice(index, 1);
    return alert;
  }

  async check(userId: string, id: string) {
    const { alert, alerts, index } = this.findForUser(userId, id);
    const checkedAt = new Date().toISOString();
    if (!alert.enabled) {
      const updated = { ...alert, lastCheckedAt: checkedAt, updatedAt: checkedAt };
      alerts[index] = updated;
      return { alert: updated, matched: false, bestOffer: undefined, offers: [] };
    }

    const offers = await this.shoppingProvidersService.search({
      query: alert.query,
      brand: alert.brand,
      model: alert.model,
      country: alert.country,
      currency: alert.currency
    });
    const bestOffer = offers[0];
    const matched = Boolean(bestOffer && bestOffer.totalPrice <= alert.targetPrice);
    const updated: PriceAlert = {
      ...alert,
      lastCheckedAt: checkedAt,
      lastMatchedAt: matched ? checkedAt : alert.lastMatchedAt,
      lastBestOffer: bestOffer,
      updatedAt: checkedAt
    };
    alerts[index] = updated;
    return { alert: updated, matched, bestOffer, offers };
  }

  async checkAll(userId: string) {
    const alerts = this.list(userId).filter((alert) => alert.enabled);
    const results = [];
    for (const alert of alerts) {
      results.push(await this.check(userId, alert.id));
    }
    return { results, checkedAt: new Date().toISOString() };
  }

  private findForUser(userId: string, id: string) {
    const alerts = this.list(userId);
    const index = alerts.findIndex((alert) => alert.id === id);
    if (index < 0) throw new NotFoundException("Price alert not found");
    return { alert: alerts[index], alerts, index };
  }
}
