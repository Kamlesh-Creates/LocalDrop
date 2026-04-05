export type DeviceInfo = {
  id: string;
  name: string;
  connectedAt: number;
};

export type SharedMessage = {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  text: string;
  createdAt: number;
  kind: "text";
};

export type SharedFile = {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  createdAt: number;
  kind: "file";
};

export type TransferItem = SharedMessage | SharedFile;

export type DevicesUpdatePayload = {
  devices: DeviceInfo[];
};

export type SendMessagePayload = {
  id: string;
  toId: string;
  text: string;
  createdAt: number;
};

export type SendFilePayload = {
  id: string;
  toId: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  createdAt: number;
};

export type ReceiveMessagePayload = SharedMessage;
export type ReceiveFilePayload = SharedFile;

export type RegisterDevicePayload = {
  name: string;
};

export type SendAck = {
  ok: boolean;
  error?: string;
};

export interface ClientToServerEvents {
  "device:register": (payload: RegisterDevicePayload) => void;
  "message:send": (payload: SendMessagePayload, callback: (ack: SendAck) => void) => void;
  "file:send": (payload: SendFilePayload, callback: (ack: SendAck) => void) => void;
}

export interface ServerToClientEvents {
  "devices:update": (payload: DevicesUpdatePayload) => void;
  "message:receive": (payload: ReceiveMessagePayload) => void;
  "file:receive": (payload: ReceiveFilePayload) => void;
}