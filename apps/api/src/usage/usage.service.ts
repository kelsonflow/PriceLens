import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import type { RequestUser } from "../common/request-user.decorator";

export type UsageResource = "comparison" | "textIdentification" | "imageRecognition";
export type UsagePlan = "guest" | "starter" | "premium";

interface UsageRecord {
  userId: string;
  period: string;
  comparison: number;
  textIdentification: number;
  imageRecognition: number;
  updatedAt: string;
}

const LIMITS: Record<UsagePlan, Record<UsageResource, number>> = {
  guest: { comparison: 1, textIdentification: 1, imageRecognition: 1 },
  starter: { comparison: 5, textIdentification: 5, imageRecognition: 2 },
  premium: { comparison: 50, textIdentification: 50, imageRecognition: 20 }
};

@Injectable()
export class UsageService {
  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly subscriptions: SubscriptionsService
  ) {}

  async consume(user: RequestUser, resource: UsageResource) {
    const plan = await this.planFor(user);
    const limit = this.limit(plan, resource);
    const period = currentPeriod();
    const ref = this.firebase.firestore.collection("monthlyUsage").doc(documentId(user.id, period));

    const used = await this.firebase.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const record = snapshot.data() as Partial<UsageRecord> | undefined;
      const current = Number(record?.[resource] ?? 0);
      if (current >= limit) {
        throw quotaExceeded(plan, resource, current, limit, period);
      }
      const next = current + 1;
      transaction.set(ref, {
        userId: user.id,
        period,
        comparison: Number(record?.comparison ?? 0),
        textIdentification: Number(record?.textIdentification ?? 0),
        imageRecognition: Number(record?.imageRecognition ?? 0),
        [resource]: next,
        updatedAt: new Date().toISOString()
      } satisfies UsageRecord);
      return next;
    });

    return { plan, resource, used, limit, remaining: Math.max(0, limit - used), period };
  }

  async summary(user: RequestUser) {
    const plan = await this.planFor(user);
    const period = currentPeriod();
    const snapshot = await this.firebase.firestore.collection("monthlyUsage").doc(documentId(user.id, period)).get();
    const record = snapshot.data() as Partial<UsageRecord> | undefined;
    return {
      plan,
      period,
      resources: Object.fromEntries((Object.keys(LIMITS[plan]) as UsageResource[]).map((resource) => {
        const used = Number(record?.[resource] ?? 0);
        const limit = this.limit(plan, resource);
        return [resource, { used, limit, remaining: Math.max(0, limit - used) }];
      }))
    };
  }

  async assertCountry(user: RequestUser, country?: string) {
    if (!country || country.toUpperCase() === "PT") return;
    if (await this.planFor(user) !== "premium") {
      throw new HttpException({
        statusCode: HttpStatus.FORBIDDEN,
        code: "PREMIUM_COUNTRY_REQUIRED",
        message: "Comparisons outside Portugal require Premium"
      }, HttpStatus.FORBIDDEN);
    }
  }

  async removeAll(userId: string) {
    const snapshot = await this.firebase.firestore.collection("monthlyUsage").where("userId", "==", userId).get();
    const batch = this.firebase.firestore.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
    return snapshot.size;
  }

  private async planFor(user: RequestUser): Promise<UsagePlan> {
    if (user.authType !== "firebase") return "guest";
    return await this.subscriptions.isPremium(user.id) ? "premium" : "starter";
  }

  private limit(plan: UsagePlan, resource: UsageResource) {
    const envName = `USAGE_${plan.toUpperCase()}_${resource.replace(/([A-Z])/g, "_$1").toUpperCase()}_LIMIT`;
    const configured = Number(process.env[envName]);
    return Number.isFinite(configured) && configured >= 0 ? Math.floor(configured) : LIMITS[plan][resource];
  }
}

function quotaExceeded(plan: UsagePlan, resource: UsageResource, used: number, limit: number, period: string) {
  return new HttpException({
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    code: "MONTHLY_USAGE_LIMIT_REACHED",
    message: plan === "guest" ? "Sign in to continue using PriceLens" : "Monthly usage limit reached",
    plan,
    resource,
    used,
    limit,
    remaining: 0,
    period
  }, HttpStatus.TOO_MANY_REQUESTS);
}

function currentPeriod(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function documentId(userId: string, period: string) {
  return `${period}_${createHash("sha256").update(userId).digest("hex")}`;
}
