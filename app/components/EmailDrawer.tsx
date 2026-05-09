"use client";
import { useEffect } from "react";
import { EmailEntry } from "../types";
import { FolderBadge } from "./badges";

export function EmailDrawer({ email, onClose, onDelete, onRead }: {
  email: EmailEntry | null;
  onClose: () => void;
  onDelete: (id: number) => void;
  onRead: (id: number) => void;
}) {
  // mark as read when drawer opens
  useEffect(() => {
    if (email && !email.is_read) {
      onRead(email.id);
    }
  }, [email?.id]);

  if (!email) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/10" onClick={onClose} />
      <div className="fixed top-0 right-0 z-40 h-screen w-[480px] bg-white border-l border-gray-100 shadow-2xl flex flex-col">

        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                email.status === "forwarded" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
              }`}>
                {email.status}
              </span>
              <FolderBadge folder={email.folder} />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 leading-snug">
              {email.subject || "(no subject)"}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { onDelete(email.id); onClose(); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              Delete
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0 space-y-1.5">
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">From</span>
            <span className="text-gray-800 font-medium truncate">{email.from}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">Received</span>
            <span className="text-gray-700">{email.received_at ? new Date(email.received_at).toLocaleString() : "—"}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">Forwarded</span>
            <span className="text-gray-700">{email.forwarded_at ? new Date(email.forwarded_at).toLocaleString() : "—"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-sans leading-relaxed">
            {email.body || "(no body)"}
          </pre>
        </div>
      </div>
    </>
  );
}