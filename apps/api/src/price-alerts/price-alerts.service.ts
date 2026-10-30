import { forwardRef, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { type NormalizedOffer } from "@pricelens/shared";
import { FieldPath } from "firebase-admin/firestore";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SearchesService } from "../searches/searches.service";
import { CreatePriceAlertDto } from "./dto/create-price-alert.dto";
import { UpdatePriceAlertDto } from "./dto/update-price-alert.dto";

export interface PriceAlert {
  id: string; userId: string; query: string; title: string; brand?: string; model?: string;
  country: string; currency: string; targetPrice: number; enabled: boolean;
  lastCheckedAt?: string; lastMatchedAt?: string; lastNotifiedAt?: string;
  lastBestOffer?: NormalizedOffer; createdAt: string; updatedAt: string;
}

@Injectable()
export class PriceAlertsService {
  private readonly collection;

  constructor(
    private readonly searchesService: SearchesService,
    private readonly firebase: FirebaseAdminService,
    @Inject(forwardRef(() => NotificationsService)) private readonly notifications: NotificationsService
  ) { this.collection = this.firebase.firestore.collection("priceAlerts"); }

  async list(userId: string) {
    const snapshot = await this.collection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as PriceAlert).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(userId: string, dto: CreatePriceAlertDto) {
    const limit = boundedNumber("PREMIUM_PRICE_ALERT_LIMIT", 5, 1, 100);
    const current = await this.list(userId);
    if (current.length >= limit) {
      throw new HttpException({
        statusCode: HttpStatus.CONFLICT,
        code: "PRICE_ALERT_LIMIT_REACHED",
        message: `Premium includes up to ${limit} active price alerts`,
        limit
      }, HttpStatus.CONFLICT);
    }
    const now = new Date().toISOString(); const ref = this.collection.doc();
    const alert: PriceAlert = { id: ref.id, userId, query: dto.query.trim(), title: dto.title?.trim() || dto.query.trim(), brand: dto.brand?.trim() || undefined, model: dto.model?.trim() || undefined, country: dto.country?.trim() || "PT", currency: dto.currency?.trim() || "EUR", targetPrice: dto.targetPrice, enabled: dto.enabled ?? true, createdAt: now, updatedAt: now };
    await ref.set(clean(alert)); return alert;
  }

  async update(userId: string, id: string, dto: UpdatePriceAlertDto) {
    const alert = await this.findForUser(userId, id);
    const updated: PriceAlert = { ...alert, query: dto.query?.trim() ?? alert.query, title: dto.title?.trim() ?? alert.title, brand: dto.brand?.trim() ?? alert.brand, model: dto.model?.trim() ?? alert.model, country: dto.country?.trim() ?? alert.country, currency: dto.currency?.trim() ?? alert.currency, targetPrice: dto.targetPrice ?? alert.targetPrice, enabled: dto.enabled ?? alert.enabled, updatedAt: new Date().toISOString() };
    await this.collection.doc(id).set(clean(updated)); return updated;
  }

  async remove(userId: string, id: string) { const alert = await this.findForUser(userId, id); await this.collection.doc(id).delete(); return alert; }

  async check(userId: string, id: string) {
    const alert = await this.findForUser(userId, id); const checkedAt = new Date().toISOString();
    if (!alert.enabled) { const updated = { ...alert, lastCheckedAt: checkedAt, updatedAt: checkedAt }; await this.collection.doc(id).set(clean(updated)); return { alert: updated, matched: false, bestOffer: undefined, offers: [], notified: false }; }
    const offers = (await this.searchesService.searchOffers(searchDto(alert))).results;
    return this.applyOffers(alert, offers, checkedAt);
  }

  private async applyOffers(alert: PriceAlert, offers: NormalizedOffer[], checkedAt = new Date().toISOString()) {
    const bestOffer = offers[0]; const matched = Boolean(bestOffer && bestOffer.totalPrice <= alert.targetPrice);
    const shouldNotify = matched && (!alert.lastNotifiedAt || alert.lastBestOffer?.totalPrice !== bestOffer?.totalPrice);
    const updated: PriceAlert = { ...alert, lastCheckedAt: checkedAt, lastMatchedAt: matched ? checkedAt : alert.lastMatchedAt, lastNotifiedAt: shouldNotify ? checkedAt : alert.lastNotifiedAt, lastBestOffer: bestOffer, updatedAt: checkedAt };
    await this.collection.doc(alert.id).set(clean(updated));
    if (shouldNotify && bestOffer) await this.notifications.sendPriceAlert(updated, bestOffer);
    return { alert: updated, matched, bestOffer, offers, notified: shouldNotify };
  }

  async checkAll(userId: string) { const alerts = (await this.list(userId)).filter((item) => item.enabled); const results = []; for (const alert of alerts) results.push(await this.check(userId, alert.id)); return { results, checkedAt: new Date().toISOString() }; }
  async checkAllUsers() {
    const batchSize = boundedNumber("ALERT_BATCH_SIZE", 250, 1, 1000);
    const maxSearches = boundedNumber("ALERT_MAX_UNIQUE_SEARCHES_PER_RUN", 40, 1, batchSize);
    const concurrency = boundedNumber("ALERT_SEARCH_CONCURRENCY", 3, 1, 10);
    const stateRef = this.firebase.firestore.collection("systemState").doc("priceAlertScan");
    const state = (await stateRef.get()).data() as { cursor?: string } | undefined;
    let query = this.collection.where("enabled", "==", true).orderBy(FieldPath.documentId()).limit(batchSize);
    if (state?.cursor) query = query.startAfter(state.cursor);
    let snapshot = await query.get();
    if (snapshot.empty && state?.cursor) {
      snapshot = await this.collection.where("enabled", "==", true).orderBy(FieldPath.documentId()).limit(batchSize).get();
    }
    if (snapshot.empty) return { checked: 0, searches: 0, deferred: 0, results: [], checkedAt: new Date().toISOString() };

    const groups = new Map<string, PriceAlert[]>();
    for (const doc of snapshot.docs) {
      const alert = doc.data() as PriceAlert;
      const key = searchKey(alert);
      groups.set(key, [...(groups.get(key) ?? []), alert]);
    }
    const selected = [...groups.values()].slice(0, maxSearches);
    const deferred = [...groups.values()].slice(maxSearches).reduce((count, alerts) => count + alerts.length, 0);
    const checkedAt = new Date().toISOString();
    const nested = await mapLimit(selected, concurrency, async (alerts) => {
      try {
        const offers = (await this.searchesService.searchOffers(searchDto(alerts[0]))).results;
        return mapLimit(alerts, 10, (alert) => this.applyOffers(alert, offers, checkedAt));
      } catch (error) {
        return alerts.map((alert) => ({ alertId: alert.id, error: String(error) }));
      }
    });
    const results = nested.flat();
    await stateRef.set({ cursor: snapshot.docs.at(-1)?.id, updatedAt: checkedAt });
    return { checked: results.length, searches: selected.length, deferred, results, checkedAt };
  }
  async removeAll(userId: string) { const alerts = await this.list(userId); const batch = this.firebase.firestore.batch(); alerts.forEach((item) => batch.delete(this.collection.doc(item.id))); await batch.commit(); return alerts.length; }
  private async findForUser(userId: string, id: string) { const snapshot = await this.collection.doc(id).get(); const alert = snapshot.data() as PriceAlert | undefined; if (!alert || alert.userId !== userId) throw new NotFoundException("Price alert not found"); return alert; }
}

function clean<T extends object>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T; }

function searchDto(alert: PriceAlert) {
  return { query: alert.query, brand: alert.brand, model: alert.model, country: alert.country, currency: alert.currency, condition: "any" as const };
}

function searchKey(alert: PriceAlert) {
  return JSON.stringify(searchDto(alert), (_key, value) => typeof value === "string" ? value.trim().toLowerCase() : value);
}

function boundedNumber(name: string, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(process.env[name] ?? fallback);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, Math.floor(parsed))) : fallback;
}

async function mapLimit<T, R>(items: T[], concurrency: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  }));
  return results;
}
