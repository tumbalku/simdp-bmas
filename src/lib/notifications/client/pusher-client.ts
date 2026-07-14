import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  if (!pusherClient) {
    pusherClient = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/v1/auth/pusher",
    });
  }
  return pusherClient;
}
