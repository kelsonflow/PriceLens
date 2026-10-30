import { Injectable, Logger } from "@nestjs/common";
import type { NormalizedOffer } from "@pricelens/shared";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";
import type { PriceAlert } from "../price-alerts/price-alerts.service";
import type { ImportantUpdateDto } from "./dto/important-update.dto";
import type { RegisterDeviceDto } from "./dto/register-device.dto";

interface DeviceRecord extends RegisterDeviceDto { userId: string; updatedAt: string }

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly firebase: FirebaseAdminService) {}

  async register(userId: string, dto: RegisterDeviceDto) {
    const record: DeviceRecord = { ...dto, userId, enabled: dto.enabled ?? true, updatedAt: new Date().toISOString() };
    await this.firebase.firestore.collection("notificationDevices").doc(tokenId(dto.token)).set(record, { merge: true });
    return { registered: true };
  }

  async unregister(userId: string, token: string) {
    const ref = this.firebase.firestore.collection("notificationDevices").doc(tokenId(token));
    const snapshot = await ref.get();
    if (snapshot.data()?.userId === userId) await ref.delete();
    return { registered: false };
  }

  async sendPriceAlert(alert: PriceAlert, offer: NormalizedOffer) {
    return this.sendToUser(alert.userId, {
      title: `PriceLens: ${alert.title}`,
      body: `${formatMoney(offer.totalPrice, offer.currency)} - o preço atingiu o teu objetivo.`,
      data: { type: "price-alert", alertId: alert.id, productUrl: offer.affiliateUrl ?? offer.productUrl }
    });
  }

  async sendImportantUpdate(dto: ImportantUpdateDto) {
    const snapshots = await this.firebase.firestore.collection("notificationDevices").where("enabled", "==", true).get();
    return this.sendTokens(snapshots.docs.map((doc) => (doc.data() as DeviceRecord).token), {
      title: dto.title, body: dto.body, data: { type: "important-update", ...(dto.url ? { url: dto.url } : {}) }
    });
  }

  private async sendToUser(userId: string, notification: { title: string; body: string; data: Record<string, string> }) {
    const snapshots = await this.firebase.firestore.collection("notificationDevices").where("userId", "==", userId).get();
    const tokens = snapshots.docs.map((doc) => doc.data() as DeviceRecord).filter((item) => item.enabled).map((item) => item.token);
    return this.sendTokens(tokens, notification);
  }

  private async sendTokens(tokens: string[], notification: { title: string; body: string; data: Record<string, string> }) {
    if (!tokens.length) return { sent: 0, failed: 0 };
    const expoTokens = tokens.filter(isExpoToken);
    const firebaseTokens = tokens.filter((token) => !isExpoToken(token));
    let sent = 0; let failed = 0;
    for (let index = 0; index < firebaseTokens.length; index += 500) {
      const batch = firebaseTokens.slice(index, index + 500);
      const result = await this.firebase.messaging.sendEachForMulticast({ tokens: batch, notification: { title: notification.title, body: notification.body }, data: notification.data, android: { priority: "high", notification: { channelId: "price-alerts" } } });
      sent += result.successCount; failed += result.failureCount;
      const invalid = result.responses.flatMap((response, offset) => !response.success && isInvalidToken(response.error?.code) ? [batch[offset]] : []);
      await Promise.all(invalid.map((token) => this.firebase.firestore.collection("notificationDevices").doc(tokenId(token)).delete()));
    }
    for (let index = 0; index < expoTokens.length; index += 100) {
      const batch = expoTokens.slice(index, index + 100);
      const result = await sendExpoBatch(batch, notification);
      sent += result.sent;
      failed += result.failed;
      await Promise.all(result.invalid.map((token) => this.firebase.firestore.collection("notificationDevices").doc(tokenId(token)).delete()));
    }
    this.logger.log(`Push delivery complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }
}

function tokenId(token: string) { return Buffer.from(token).toString("base64url").slice(0, 500); }
function isInvalidToken(code?: string) { return code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token"; }
function isExpoToken(token: string) { return /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token); }

async function sendExpoBatch(tokens: string[], notification: { title: string; body: string; data: Record<string, string> }) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(tokens.map((to) => ({ to, title: notification.title, body: notification.body, data: notification.data, sound: "default" })))
  });
  if (!response.ok) throw new Error(`Expo push service returned ${response.status}`);
  const payload = await response.json() as { data?: Array<{ status: "ok" | "error"; details?: { error?: string } }> };
  const tickets = payload.data ?? [];
  const invalid = tickets.flatMap((ticket, index) => ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered" ? [tokens[index]] : []);
  const sent = tickets.filter((ticket) => ticket.status === "ok").length;
  return { sent, failed: tokens.length - sent, invalid };
}
function formatMoney(value: number, currency: string) { return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(value); }
