import type { NextFunction, Request, Response } from "express";
import { FirebaseAuthService } from "./firebase-auth.service";

export interface AuthenticatedRequest extends Request {
  firebaseUser?: {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

export function firebaseAuthMiddleware(auth: FirebaseAuthService) {
  return async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const token = bearerToken(request.headers.authorization);
    if (!token || token === process.env.API_ACCESS_TOKEN || !auth.isEnabled()) {
      next();
      return;
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      request.firebaseUser = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      };
      next();
    } catch {
      response.status(401).json({ statusCode: 401, message: "Invalid or expired authentication token" });
    }
  };
}

function bearerToken(value?: string): string | undefined {
  return value?.replace(/^Bearer\s+/i, "").trim() || undefined;
}
