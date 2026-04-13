"use client";

import { UploadCloud, X } from "lucide-react";

import { Button } from "@/components/shared/button";
import type { UploadedFile } from "@/types";

type Props = {
  purpose: "ai_prompt" | "lab_helper";
  files: UploadedFile[];
  loading: boolean;
  onUpload: (file: File, purpose: "ai_prompt" | "lab_helper") => Promise<void>;
  onRemove: (fileId: string) => void;
};

export function UploadPanel({ purpose, files, loading, onUpload, onRemove }: Props) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-slate-950/35">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm dark:bg-slate-900 dark:text-brand-100">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-ink dark:text-white">Upload PDF or image context</p>
          <p className="text-sm text-slate-500 dark:text-slate-300">Use files to ground the explanation or lab report in your actual work.</p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-brand-100 hover:text-brand-600 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-200">
        <input
          type="file"
          className="hidden"
          accept=".pdf,image/*,text/*"
          disabled={loading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            await onUpload(file, purpose);
            event.target.value = "";
          }}
        />
        {loading ? "Uploading..." : "Choose file"}
      </label>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950/50">
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">{file.original_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{file.mime_type}</p>
              </div>
              <Button type="button" variant="ghost" className="px-2 py-2 text-slate-500 dark:text-slate-300" onClick={() => onRemove(file.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
