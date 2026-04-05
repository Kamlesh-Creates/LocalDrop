"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import { DeviceSidebar } from "@/components/device-sidebar";
import { TransferPanel } from "@/components/transfer-panel";
import { createRandomDeviceName, readFileAsDataUrl } from "@/lib/helpers";
import { getSocket } from "@/lib/socket";
import type { DeviceInfo, SendAck, SharedFile, SharedMessage, TransferItem } from "@/lib/types";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 15);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function createMessageId() {
  return `message_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createFileId() {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mergeTransfers(existing: TransferItem[], incoming: TransferItem) {
  return [...existing, incoming].sort((left, right) => left.createdAt - right.createdAt);
}

function emitMessageWithAck(
  payload: { id: string; toId: string; text: string; createdAt: number },
  callback: (ack: SendAck) => void
) {
  const socket = getSocket();
  socket.emit("message:send", payload, callback);
}

function emitFileWithAck(
  payload: {
    id: string;
    toId: string;
    fileName: string;
    mimeType: string;
    size: number;
    dataUrl: string;
    createdAt: number;
  },
  callback: (ack: SendAck) => void
) {
  const socket = getSocket();
  socket.emit("file:send", payload, callback);
}

export default function HomePage() {
  const [deviceName, setDeviceName] = useState("");
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [transfersByDevice, setTransfersByDevice] = useState<Record<string, TransferItem[]>>({});
  const previousDeviceIds = useRef<string[]>([]);
  const latestDevicesRef = useRef<DeviceInfo[]>([]);

  useEffect(() => {
    let storedName: string | null = null;

    try {
      storedName = window.sessionStorage.getItem("localdrop-device-name");
    } catch {
      storedName = null;
    }

    const nextName = storedName ?? createRandomDeviceName();

    if (!storedName) {
      try {
        window.sessionStorage.setItem("localdrop-device-name", nextName);
      } catch {
        // Ignore storage failures (for example, strict privacy mode on mobile browsers).
      }
    }

    setDeviceName(nextName);
  }, []);

  useEffect(() => {
    if (!deviceName) {
      return;
    }

    const socket = getSocket();

    const handleConnect = () => {
      setConnectionStatus("connected");
      setCurrentDeviceId(socket.id ?? null);
      socket.emit("device:register", { name: deviceName });
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      setCurrentDeviceId(null);
    };

    const handleDevicesUpdate = ({ devices: nextDevices }: { devices: DeviceInfo[] }) => {
      const previousDevices = latestDevicesRef.current;
      setDevices(nextDevices);
      latestDevicesRef.current = nextDevices;

      const nextDeviceIds = nextDevices.map((device) => device.id);
      const previousDeviceSet = new Set(previousDeviceIds.current);

      nextDevices.forEach((device) => {
        if (!previousDeviceSet.has(device.id) && device.id !== socket.id) {
          toast.success(`${device.name} connected`);
        }
      });

      previousDeviceIds.current.forEach((deviceId) => {
        if (!nextDeviceIds.includes(deviceId)) {
          const removedDevice = previousDevices.find((device) => device.id === deviceId);
          if (removedDevice && removedDevice.id !== socket.id) {
            toast(`${removedDevice.name} disconnected`);
          }
        }
      });

      previousDeviceIds.current = nextDeviceIds;
      setSelectedDeviceId((currentSelected) => {
        if (currentSelected && nextDeviceIds.includes(currentSelected)) {
          return currentSelected;
        }

        const availableTarget = nextDevices.find((device) => device.id !== socket.id);
        return availableTarget ? availableTarget.id : null;
      });
    };

    const handleMessageReceive = (payload: SharedMessage) => {
      setTransfersByDevice((current) => ({
        ...current,
        [payload.fromId]: mergeTransfers(current[payload.fromId] ?? [], payload)
      }));

      const sender = latestDevicesRef.current.find((device) => device.id === payload.fromId);
      toast.success(`Message from ${sender?.name ?? payload.fromName}`);
    };

    const handleFileReceive = (payload: SharedFile) => {
      setTransfersByDevice((current) => ({
        ...current,
        [payload.fromId]: mergeTransfers(current[payload.fromId] ?? [], payload)
      }));

      const sender = latestDevicesRef.current.find((device) => device.id === payload.fromId);
      toast.success(`File from ${sender?.name ?? payload.fromName}`);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("devices:update", handleDevicesUpdate);
    socket.on("message:receive", handleMessageReceive);
    socket.on("file:receive", handleFileReceive);

    setConnectionStatus(socket.connected ? "connected" : "connecting");

    if (!socket.connected) {
      socket.connect();
    } else {
      // If already connected (for example after a fast refresh), still register this device.
      setCurrentDeviceId(socket.id ?? null);
      socket.emit("device:register", { name: deviceName });
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("devices:update", handleDevicesUpdate);
      socket.off("message:receive", handleMessageReceive);
      socket.off("file:receive", handleFileReceive);
      socket.disconnect();
    };
  }, [deviceName]);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId]
  );

  const activeTransfers = selectedDeviceId ? transfersByDevice[selectedDeviceId] ?? [] : [];

  async function handleSendMessage() {
    if (!selectedDevice || !draftMessage.trim()) {
      return;
    }

    const socket = getSocket();

    if (!socket.connected || !currentDeviceId) {
      toast.error("Connect to the local network first.");
      return;
    }

    const payload: SharedMessage = {
      id: createMessageId(),
      fromId: currentDeviceId,
      fromName: deviceName,
      toId: selectedDevice.id,
      text: draftMessage.trim(),
      createdAt: Date.now(),
      kind: "text"
    };

    emitMessageWithAck(
      {
        id: payload.id,
        toId: payload.toId,
        text: payload.text,
        createdAt: payload.createdAt
      },
      (ack) => {
        if (!ack.ok) {
          toast.error(ack.error ?? "Unable to send message.");
          return;
        }

        setTransfersByDevice((current) => ({
          ...current,
          [selectedDevice.id]: mergeTransfers(current[selectedDevice.id] ?? [], payload)
        }));

        setDraftMessage("");
      }
    );
  }

  async function handleFilesSelected(files: FileList) {
    if (!selectedDevice) {
      toast.error("Select a device first.");
      return;
    }

    const socket = getSocket();

    if (!socket.connected || !currentDeviceId) {
      toast.error("Connect to the local network first.");
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`${file.name} is too large. Max size is ${MAX_FILE_SIZE_MB} MB.`);
        continue;
      }

      let dataUrl = "";

      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch {
        toast.error(`Could not read ${file.name}.`);
        continue;
      }

      const payload: SharedFile = {
        id: createFileId(),
        fromId: currentDeviceId,
        fromName: deviceName,
        toId: selectedDevice.id,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl,
        createdAt: Date.now(),
        kind: "file"
      };

      emitFileWithAck(
        {
          id: payload.id,
          toId: payload.toId,
          fileName: payload.fileName,
          mimeType: payload.mimeType,
          size: payload.size,
          dataUrl: payload.dataUrl,
          createdAt: payload.createdAt
        },
        (ack) => {
          if (!ack.ok) {
            toast.error(ack.error ?? `Unable to send ${file.name}.`);
            return;
          }

          setTransfersByDevice((current) => ({
            ...current,
            [selectedDevice.id]: mergeTransfers(current[selectedDevice.id] ?? [], payload)
          }));

          toast.success(`${file.name} sent`);
        }
      );
    }
  }

  function handleDeviceNameChange(nextName: string) {
    const trimmedName = nextName.trim();

    if (!trimmedName) {
      toast.error("Device name cannot be empty.");
      return;
    }

    try {
      window.sessionStorage.setItem("localdrop-device-name", trimmedName);
    } catch {
      // Ignore storage failures in strict privacy modes.
    }

    setDeviceName(trimmedName);

    const socket = getSocket();
    if (socket.connected) {
      socket.emit("device:register", { name: trimmedName });
    }

    toast.success("Device name updated.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:p-6">
      <DeviceSidebar
        devices={devices}
        selfId={currentDeviceId}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
        connectionStatus={connectionStatus}
        deviceName={deviceName}
        onDeviceNameChange={handleDeviceNameChange}
      />

      <div className="flex-1">
        <TransferPanel
          device={selectedDevice}
          currentDeviceId={currentDeviceId}
          messages={activeTransfers}
          draftMessage={draftMessage}
          onDraftMessageChange={setDraftMessage}
          onSendMessage={handleSendMessage}
          onFilesSelected={handleFilesSelected}
          canSend={Boolean(selectedDevice && currentDeviceId && connectionStatus === "connected")}
        />
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1d1a15",
            color: "#f7f7f5",
            borderRadius: "16px"
          }
        }}
      />
    </main>
  );
}