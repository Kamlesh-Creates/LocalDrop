"use client";

import { useRef, useState } from "react";

type FileDropzoneProps = {
  disabled: boolean;
  onFilesSelected: (files: FileList) => void;
  queuedFiles: File[];
  onSendFiles: () => void;
  onClearFiles: () => void;
};

export function FileDropzone({
  disabled,
  onFilesSelected,
  queuedFiles,
  onSendFiles,
  onClearFiles
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);

        if (!disabled && event.dataTransfer.files.length > 0) {
          onFilesSelected(event.dataTransfer.files);
        }
      }}
      className={`rounded-2xl border border-dashed px-4 py-5 transition ${
        isDragging ? "border-accent-400 bg-accent-50" : "border-ink-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-ink-900">Drop files here</p>
          <p className="text-sm text-ink-500">Choose files first, then click Send files.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pick file
          </button>
          <button
            type="button"
            onClick={onSendFiles}
            disabled={disabled || queuedFiles.length === 0}
            className="rounded-full bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-ink-300"
          >
            Send files
          </button>
        </div>
      </div>

      <div className="mt-3">
        {queuedFiles.length === 0 ? (
          <p className="text-xs text-ink-500">No files queued.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-700">{queuedFiles.length} file(s) queued</p>
              <button
                type="button"
                onClick={onClearFiles}
                className="text-xs font-medium text-ink-600 underline decoration-ink-300 underline-offset-2 hover:text-ink-800"
              >
                Clear
              </button>
            </div>
            <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
              {queuedFiles.map((file, index) => (
                <p key={`${file.name}-${index}`} className="truncate text-xs text-ink-600">
                  {file.name}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            onFilesSelected(event.target.files);
            event.target.value = "";
          }
        }}
        multiple
        disabled={disabled}
      />
    </div>
  );
}