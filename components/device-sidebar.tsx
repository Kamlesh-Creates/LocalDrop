"use client";

import { useEffect, useState } from "react";

import type { DeviceInfo } from "@/lib/types";

type DeviceSidebarProps = {
  devices: DeviceInfo[];
  selfId: string | null;
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
  connectionStatus: "connecting" | "connected" | "disconnected";
  deviceName: string;
  onDeviceNameChange: (value: string) => void;
};

function statusLabel(status: DeviceSidebarProps["connectionStatus"]) {
  if (status === "connected") {
    return "Connected";
  }

  if (status === "connecting") {
    return "Connecting";
  }

  return "Offline";
}

export function DeviceSidebar({
  devices,
  selfId,
  selectedDeviceId,
  onSelectDevice,
  connectionStatus,
  deviceName,
  onDeviceNameChange
}: DeviceSidebarProps) {
  const peerCount = devices.filter((device) => device.id !== selfId).length;
  const [editableName, setEditableName] = useState(deviceName);

  useEffect(() => {
    setEditableName(deviceName);
  }, [deviceName]);

  return (
    <aside className="glass-panel flex h-full flex-col rounded-3xl p-4 shadow-soft lg:w-[320px]">
      <div className="border-b border-ink-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-500">LocalDrop</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900">Devices</h1>
        <p className="mt-1 text-sm text-ink-600">{statusLabel(connectionStatus)} on the local network</p>
      </div>

      <div className="mt-4 rounded-2xl bg-ink-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">This device</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-900">{deviceName || "Loading device name..."}</span>
          <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-semibold text-accent-700">You</span>
        </div>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onDeviceNameChange(editableName);
          }}
        >
          <input
            value={editableName}
            onChange={(event) => setEditableName(event.target.value)}
            placeholder="Set device name"
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-accent-400"
            maxLength={40}
          />
          <button
            type="submit"
            className="rounded-xl bg-ink-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
          >
            Save
          </button>
        </form>
      </div>

      <div className="mt-4 flex-1 overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-500">Connected devices</h2>
          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600">{peerCount}</span>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {devices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-6 text-sm text-ink-500">
              Waiting for another device to join the network.
            </div>
          ) : (
            devices.map((device) => {
              const isSelf = device.id === selfId;
              const isSelected = selectedDeviceId === device.id;

              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => {
                    if (!isSelf) {
                      onSelectDevice(device.id);
                    }
                  }}
                  disabled={isSelf}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-accent-300 bg-accent-50"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50"
                  } ${isSelf ? "cursor-not-allowed opacity-85" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink-900">{device.name}</p>
                      <p className="text-xs text-ink-500">
                        {isSelf ? "Current browser" : "Nearby device"}
                      </p>
                    </div>
                    {isSelf ? (
                      <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">You</span>
                    ) : (
                      <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-semibold text-accent-700">Online</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}