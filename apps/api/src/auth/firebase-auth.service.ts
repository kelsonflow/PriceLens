import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);

  isEnabled(): boolean {
    return process.env.FIREBASE_AUTH_ENABLED === "true";
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.isEnabled()) throw new UnauthorizedException("Firebase authentication is not enabled");
    try {
      return await getAuth(this.app()).verifyIdToken(idToken, true);
    } catch (error) {
      this.logger.warn(`Firebase ID token verification failed: ${String(error)}`);
      throw new UnauthorizedException("Invalid or expired authentication token");
    }
  }

  async deleteUser(uid: string): Promise<void> {
    if (!this.isEnabled()) throw new UnauthorizedException("Firebase authentication is not enabled");
    await getAuth(this.app()).deleteUser(uid);
  }

  private app() {
    const existing = getApps()[0];
    if (existing) return existing;
    return initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT
    });
  }
}
