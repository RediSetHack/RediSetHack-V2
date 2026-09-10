import {
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { IncomingHttpHeaders } from "node:http";
import type { Request } from "express";
import { Webhook } from "svix";

import { EnsureUserUseCase } from "../../application/ensure-user.use-case.js";
import type { ClerkAuthenticatedUser } from "../../domain/ports/clerk-auth.port.js";

export const CLERK_WEBHOOK_SECRET = Symbol("CLERK_WEBHOOK_SECRET");

type WebhookEvent = {
  type?: string;
  data?: Record<string, unknown>;
};

function extractId(id: unknown): string {
  if (typeof id === "string") {
    return id;
  }
  if (typeof id === "number") {
    return String(id);
  }
  return "";
}

function extractDisplayName(firstName: unknown, lastName: unknown): string | null {
  const first = typeof firstName === "string" && firstName.length > 0 ? firstName : null;
  const last = typeof lastName === "string" && lastName.length > 0 ? lastName : null;

  if (first && last) {
    return `${first} ${last}`;
  }
  return last ?? first;
}

function toClerkAuthenticatedUser(data: Record<string, unknown>): ClerkAuthenticatedUser {
  const addresses = Array.isArray(data["email_addresses"])
    ? (data["email_addresses"] as Array<Record<string, unknown>>)
    : [];
  const primaryId = data["primary_email_address_id"];
  const primary = addresses.find((address) => address["id"] === primaryId) ?? addresses[0];
  const email = primary?.["email_address"];
  const metadata = data["public_metadata"];
  const role =
    metadata != null &&
    typeof metadata === "object" &&
    "role" in metadata &&
    metadata["role"] === "admin"
      ? "admin"
      : "user";
  return {
    id: extractId(data["id"]),
    email: typeof email === "string" && email.length > 0 ? email : null,
    name: extractDisplayName(data["first_name"], data["last_name"]),
    role,
  };
}

@Controller("v1/api/clerk")
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);
  private readonly webhook: Webhook | null;

  constructor(
    private readonly ensureUser: EnsureUserUseCase,
    @Inject(CLERK_WEBHOOK_SECRET) webhookSecret: string,
  ) {
    this.webhook = webhookSecret && webhookSecret.length > 0 ? new Webhook(webhookSecret) : null;
  }

  @Post("webhook")
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers() headers: IncomingHttpHeaders,
  ) {
    if (!this.webhook) {
      this.logger.error("CLERK_WEBHOOK_SECRET is not configured; rejecting webhook");
      throw new ServiceUnavailableException("Webhook endpoint is not configured");
    }

    const payload = request.rawBody?.toString("utf8") ?? "";
    let event: WebhookEvent;
    try {
      this.webhook.verify(payload, headers as Record<string, string>);
    } catch {
      this.logger.warn("Webhook signature verification failed");
      throw new UnauthorizedException("Invalid webhook signature");
    }
    event = JSON.parse(payload) as WebhookEvent;

    if (event.type === "user.created" || event.type === "user.updated") {
      const identity = toClerkAuthenticatedUser(event.data ?? {});
      if (identity.id) {
        await this.ensureUser.execute(identity);
      }
    }

    return { received: true };
  }
}