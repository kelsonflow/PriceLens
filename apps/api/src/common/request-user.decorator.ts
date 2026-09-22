import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedRequest } from "../auth/firebase-auth.middleware";

export interface RequestUser {
  id: string;
  authType: "firebase" | "header" | "anonymous";
  email?: string;
  name?: string;
  picture?: string;
}

export const RequestUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return resolveRequestUser(request);
});

export function resolveRequestUser(request: Pick<AuthenticatedRequest, "headers" | "ip" | "firebaseUser">): RequestUser {
  if (request.firebaseUser) {
    return {
      id: request.firebaseUser.uid,
      authType: "firebase",
      email: request.firebaseUser.email,
      name: request.firebaseUser.name,
      picture: request.firebaseUser.picture
    };
  }
  const headerUserId = firstHeaderValue(request.headers["x-user-id"])?.trim();
  const id = sanitizeUserId(headerUserId || request.ip || "anonymous");
  return {
    id,
    authType: headerUserId ? "header" : "anonymous"
  };
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeUserId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:@-]/g, "_").slice(0, 120) || "anonymous";
}
