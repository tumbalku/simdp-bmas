import { NextRequest } from "next/server";
import Pusher from "pusher";
import { z } from "zod";

import { errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";

const pusherAuthSchema = z.object({
  socket_id: z.string().min(1),
  channel_name: z.string().min(1),
});

function isPusherConfigured() {
  return Boolean(
    env.PUSHER_APP_ID &&
      (env.PUSHER_KEY || env.NEXT_PUBLIC_PUSHER_KEY) &&
      env.PUSHER_SECRET &&
      (env.PUSHER_CLUSTER || env.NEXT_PUBLIC_PUSHER_CLUSTER),
  );
}

async function parsePusherAuthRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return pusherAuthSchema.parse(await request.json());
  }

  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);
  return pusherAuthSchema.parse({
    socket_id: params.get("socket_id"),
    channel_name: params.get("channel_name"),
  });
}

function canSubscribeToChannel(channelName: string, session: { userId: string; role: string }) {
  if (channelName.startsWith("private-user-")) {
    return channelName.substring("private-user-".length) === session.userId;
  }

  if (channelName.startsWith("private-role-")) {
    const targetRole = channelName.substring("private-role-".length).toUpperCase();
    return session.role === "ADMIN" || session.role === targetRole;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (!isPusherConfigured()) {
      return errorResponse("PROVIDER_NOT_CONFIGURED", "Provider realtime belum dikonfigurasi.", undefined, 501);
    }

    const { socket_id: socketId, channel_name: channelName } = await parsePusherAuthRequest(request);

    if (!canSubscribeToChannel(channelName, session)) {
      return errorResponse("FORBIDDEN", "Channel notifikasi tidak diizinkan.", undefined, 403);
    }

    const pusher = new Pusher({
      appId: env.PUSHER_APP_ID!,
      key: (env.PUSHER_KEY ?? env.NEXT_PUBLIC_PUSHER_KEY)!,
      secret: env.PUSHER_SECRET!,
      cluster: (env.PUSHER_CLUSTER ?? env.NEXT_PUBLIC_PUSHER_CLUSTER)!,
      useTLS: true,
    });

    return Response.json(pusher.authorizeChannel(socketId, channelName));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Input auth Pusher tidak valid.",
        error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        400,
      );
    }

    console.error("Pusher auth error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
