import { Injectable } from "@nestjs/common";
import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

@Injectable()
export class FirebaseAdminService {
  readonly app: App;
  private readonly database;

  constructor() {
    this.app = getApps()[0] ?? initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT
    });
    this.database = getFirestore(this.app);
    this.database.settings({ ignoreUndefinedProperties: true });
  }

  get auth() { return getAuth(this.app); }
  get firestore() { return this.database; }
  get messaging() { return getMessaging(this.app); }
}
