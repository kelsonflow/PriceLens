import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export interface RequestUser {
  id: string;
  authType: "header" | "anonymous";
}

export const RequestUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return resolveRequestUser(request);
});

export function resolveRequestUser(request: Pick<Request, "headers" | "ip">): RequestUser {
  const headerUserId = firstHeaderValue(request.headers["x-user-id"])?.trim();
  const bearer = firstHeaderValue(request.headers.authorization)?.replace(/^Bearer\s+/i, "").trim();
  const id = sanitizeUserId(headerUserId || bearer || request.ip || "anonymous");
  return {
    id,
    authType: headerUserId || bearer ? "header" : "anonymous"
  };
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeUserId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:@-]/g, "_").slice(0, 120) || "anonymous";
}
