import { io, type Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/types";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket() {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || undefined;

    socket = io(socketUrl, {
      autoConnect: false,
      // Allow polling fallback because some mobile browsers/networks block websocket upgrades.
      transports: ["websocket", "polling"],
      path: "/socket.io",
      reconnection: true
    });
  }

  return socket;
}