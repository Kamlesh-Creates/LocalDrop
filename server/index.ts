import { createServer } from "http";
import { parse } from "url";

import next from "next";
import { Server as SocketIOServer } from "socket.io";

import type {
  DeviceInfo,
  SendAck,
  SendFilePayload,
  SendMessagePayload,
  SharedFile,
  SharedMessage
} from "../lib/types";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB ?? 15);
const maxFileSizeBytes = Math.max(1, maxFileSizeMb) * 1024 * 1024;

// Do not pass 0.0.0.0 into Next's hostname option.
// Let Next infer the request host so browser asset URLs match the LAN IP.
const app = next({ dev, port });
const handle = app.getRequestHandler();
const devices = new Map<string, DeviceInfo>();

function broadcastDevices(io: SocketIOServer) {
  io.emit("devices:update", {
    devices: Array.from(devices.values())
  });
}

function getDevice(socketId: string) {
  return devices.get(socketId) ?? null;
}

function createMessagePayload(sender: DeviceInfo, payload: SendMessagePayload): SharedMessage {
  return {
    id: payload.id,
    fromId: sender.id,
    fromName: sender.name,
    toId: payload.toId,
    text: payload.text,
    createdAt: payload.createdAt,
    kind: "text"
  };
}

function createFilePayload(sender: DeviceInfo, payload: SendFilePayload): SharedFile {
  return {
    id: payload.id,
    fromId: sender.id,
    fromName: sender.name,
    toId: payload.toId,
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    size: payload.size,
    dataUrl: payload.dataUrl,
    createdAt: payload.createdAt,
    kind: "file"
  };
}

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    void handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    maxHttpBufferSize: Math.max(maxFileSizeBytes * 2, 5 * 1024 * 1024),
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("devices:update", {
      devices: Array.from(devices.values())
    });

    socket.on("device:register", ({ name }) => {
      const trimmedName = name.trim() || "LocalDrop Device";
      const nextDevice: DeviceInfo = {
        id: socket.id,
        name: trimmedName,
        connectedAt: Date.now()
      };

      devices.set(socket.id, nextDevice);
      broadcastDevices(io);
    });

    socket.on("message:send", (payload: SendMessagePayload, callback: (ack: SendAck) => void) => {
      const sender = getDevice(socket.id);
      const recipient = getDevice(payload.toId);

      if (!sender || !recipient) {
        callback({ ok: false, error: "Recipient is offline." });
        return;
      }

      io.to(recipient.id).emit("message:receive", createMessagePayload(sender, payload));
      callback({ ok: true });
    });

    socket.on("file:send", (payload: SendFilePayload, callback: (ack: SendAck) => void) => {
      const sender = getDevice(socket.id);
      const recipient = getDevice(payload.toId);

      if (!sender || !recipient) {
        callback({ ok: false, error: "Recipient is offline." });
        return;
      }

      if (payload.size > maxFileSizeBytes) {
        callback({ ok: false, error: `File is too large. Limit is ${maxFileSizeMb} MB.` });
        return;
      }

      io.to(recipient.id).emit("file:receive", createFilePayload(sender, payload));
      callback({ ok: true });
    });

    socket.on("disconnect", () => {
      if (devices.delete(socket.id)) {
        broadcastDevices(io);
      }
    });
  });

  server.listen(port, host, () => {
    console.log(`LocalDrop is running at http://${host}:${port}`);
  });
});