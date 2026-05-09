"use client";
import { useEffect, useState } from "react";
import { Account, EmailEntry } from "../types";
import { ProviderBadge, FolderBadge } from "./badges";
import { EmailDrawer } from "./EmailDrawer";

export function EmailPanel({
  emails, selectedAccount, accounts, onDeleteEmail, onReadEmail, failedCount,
}: {
  emails: EmailEntry[];
  selectedAccount: number | null;
  accounts: Account[];
  onDeleteEmail: (id: number) => void;
  onReadEmail: (id: number) => void;
  failedCount: number;
}) {
  const [search, setSearch]       = useState("");
  const [openEmail, setOpenEmail] = useState<EmailEntry | null>(null);

  const account = selectedAccount !== null ? accounts.find((a) => a.id === selectedAccount) : null;

  const filtered = emails.filter((e) => {
    if (!search) return true;
    return (
      e.subject?.toLowerCase().includes(search.toLowerCase()) ||
      e.from?.toLowerCase().includes(search.toLowerCase()) ||
      e.body?.toLowerCase().includes(search.toLowerCase())
    );
  });

  useEffect(() => { setOpenEmail(null); }, [selectedAccount]);

  if (!selectedAccount) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">📬</div>
          <p className="text-sm font-medium text-gray-500">Select an account to view emails</p>
          <p className="text-xs text-gray-400 mt-1">Pick one from the sidebar</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            {account && <ProviderBadge provider={account.provider} />}
            <h2 className="text-sm font-semibold text-gray-800">{account?.email}</h2>
            {account && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                account.is_active ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"
              }`}>
                {account.is_active ? "active" : "paused"}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} email{filtered.length !== 1 ? "s" : ""}
            {failedCount > 0 && <span className="ml-2 text-red-500">{failedCount} failed</span>}
          </p>
        </div>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            className="pl-7 pr-3 py-1.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 w-52"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-gray-400">No emails found</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((e) => (
              <li
                key={e.id}
                onClick={() => setOpenEmail(openEmail?.id === e.id ? null : e)}
                className={`px-6 py-4 transition-colors group cursor-pointer border-l-2 ${
                  openEmail?.id === e.id
                    ? "bg-gray-100 border-l-gray-900"
                    : e.is_read
                    ? "bg-white hover:bg-gray-50 border-l-transparent"
                    : "bg-blue-50/40 hover:bg-blue-50 border-l-blue-400"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* bold subject if unread */}
                      <p className={`text-sm truncate ${e.is_read ? "font-normal text-gray-700" : "font-semibold text-gray-900"}`}>
                        {e.subject || "(no subject)"}
                      </p>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        e.status === "forwarded" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                      }`}>
                        {e.status}
                      </span>
                      <FolderBadge folder={e.folder} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      From: <span className="text-gray-700">{e.from}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 whitespace-pre-line">
                      {e.body || "(no body)"}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <button
                      onClick={(ev) => { ev.stopPropagation(); onDeleteEmail(e.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-all"
                    >✕</button>
                    <span className="text-xs text-gray-400">
                      {e.received_at ? new Date(e.received_at).toLocaleTimeString() : "—"}
                    </span>
                    <p className="text-[10px] text-gray-300">
                      {e.received_at ? new Date(e.received_at).toLocaleDateString() : ""}
                    </p>
                    {/* unread dot */}
                    {!e.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5" />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EmailDrawer
        email={openEmail}
        onClose={() => setOpenEmail(null)}
        onDelete={(id) => { onDeleteEmail(id); setOpenEmail(null); }}
        onRead={onReadEmail}
      />
    </main>
  );
}