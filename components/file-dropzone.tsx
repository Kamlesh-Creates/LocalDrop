"use client";

import { useRef, useState } from "react";

type FileDropzoneProps = {
  disabled: boolean;
  onFilesSelected: (files: FileList) => void;
};

export function FileDropzone({ disabled, onFilesSelected }: FileDropzoneProps) {
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
          <p className="text-sm text-ink-500">Or choose a file to send to the selected device.</p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pick file
        </button>
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