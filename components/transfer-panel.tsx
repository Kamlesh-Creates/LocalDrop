"use client";

import type { DeviceInfo, TransferItem } from "@/lib/types";
import { FileDropzone } from "@/components/file-dropzone";
import { formatBytes } from "@/lib/helpers";

type TransferPanelProps = {
  device: DeviceInfo | null;
  currentDeviceId: string | null;
  messages: TransferItem[];
  draftMessage: string;
  onDraftMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onFilesSelected: (files: FileList) => void;
  canSend: boolean;
};

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

export function TransferPanel({
  device,
  currentDeviceId,
  messages,
  draftMessage,
  onDraftMessageChange,
  onSendMessage,
  onFilesSelected,
  canSend
}: TransferPanelProps) {
  const title = device ? device.name : "Select a device";

  return (
    <section className="glass-panel flex h-full min-h-[720px] flex-col rounded-3xl p-4 shadow-soft">
      <div className="border-b border-ink-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-500">Transfer area</p>
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-ink-900">{title}</h2>
          {device ? (
            <span className="inline-flex w-fit rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
              Ready to send
            </span>
          ) : (
            <span className="inline-flex w-fit rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
              No target selected
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-600">
          {device
            ? `Send text or files to ${device.name}.`
            : "Choose a nearby device before sending anything."}
        </p>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-6 py-10 text-center text-sm text-ink-500">
                {device ? "Messages and files will appear here." : "Select a device to begin the conversation."}
              </div>
            ) : (
              messages.map((item) => {
                const isFromMe = item.fromId === currentDeviceId;

                return (
                  <article
                    key={item.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isFromMe ? "ml-auto bg-accent-50" : "bg-ink-50"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs text-ink-500">
                      <span>{isFromMe ? "You" : item.fromName}</span>
                      <span>{formatTime(item.createdAt)}</span>
                    </div>

                    {item.kind === "text" ? (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink-900">{item.text}</p>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-ink-900">{item.fileName}</p>
                          <p className="text-xs text-ink-500">
                            {item.mimeType || "File"} • {formatBytes(item.size)}
                          </p>
                        </div>
                        <a
                          href={item.dataUrl}
                          download={item.fileName}
                          className="inline-flex items-center rounded-full bg-ink-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
                        >
                          Download file
                        </a>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="space-y-4 border-t border-ink-200 bg-ink-50 p-4">
            <FileDropzone disabled={!canSend} onFilesSelected={onFilesSelected} />

            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <label className="block text-sm font-medium text-ink-700" htmlFor="localdrop-message">
                Send a text message
              </label>
              <textarea
                id="localdrop-message"
                value={draftMessage}
                onChange={(event) => onDraftMessageChange(event.target.value)}
                disabled={!canSend}
                rows={4}
                placeholder={device ? `Message ${device.name}` : "Select a device first"}
                className="w-full resize-none rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-accent-400 disabled:cursor-not-allowed disabled:bg-ink-50"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-500">Files and text are delivered over your local network.</p>
                <button
                  type="button"
                  onClick={onSendMessage}
                  disabled={!canSend}
                  className="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-ink-300"
                >
                  Send message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}