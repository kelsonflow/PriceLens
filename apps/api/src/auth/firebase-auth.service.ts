import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { type DecodedIdToken } from "firebase-admin/auth";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);

  constructor(private readonly firebase: FirebaseAdminService) {}

  isEnabled(): boolean {
    return process.env.FIREBASE_AUTH_ENABLED === "true";
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.isEnabled()) throw new UnauthorizedException("Firebase authentication is not enabled");
    try {
      return await this.firebase.auth.verifyIdToken(idToken, true);
    } catch (error) {
      this.logger.warn(`Firebase ID token verification failed: ${String(error)}`);
      throw new UnauthorizedException("Invalid or expired authentication token");
    }
  }

  async deleteUser(uid: string): Promise<void> {
    if (!this.isEnabled()) throw new UnauthorizedException("Firebase authentication is not enabled");
    await this.firebase.auth.deleteUser(uid);
  }
}
