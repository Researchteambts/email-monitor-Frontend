"use client";
import { useEffect, useRef, useState } from "react";
import { Account } from "../types";
import { ProviderBadge, StatusDot } from "./badges";
import { AppNotification } from "../page";

function getRelativeTime(date: Date): string {
  const diffMs    = Date.now() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffMins < 1)   return "just now";
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return "yesterday";
}

function getLastActiveRelative(lastActive: string): string {
  const diffMs    = Date.now() - new Date(lastActive).getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffMins < 1)   return "just now";
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return "yesterday";
}

function AccountRow({
  acc, selectedAccount, togglingId, onSelect, onToggle, onDelete,
}: {
  acc: Account;
  selectedAccount: number | null;
  togglingId: number | null;
  onSelect: (id: number) => void;
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number, email: string) => void;
}) {
  const isSelected = selectedAccount === acc.id;
  return (
    <li
      onClick={() => onSelect(acc.id)}
      className={`group px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
        isSelected ? "bg-gray-900" : "hover:bg-gray-50"
      } ${!acc.is_active ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <ProviderBadge provider={acc.provider} />
        <div className="flex items-center gap-1.5">
          <StatusDot lastActive={acc.last_active} isActive={acc.is_active} />
          <span className="text-[10px] text-gray-400">
            {!acc.is_active ? "paused" : acc.last_active ? "active" : "waiting"}
          </span>
          <button
            onClick={(ev) => { ev.stopPropagation(); onToggle(acc.id, acc.is_active); }}
            disabled={togglingId === acc.id}
            className={`opacity-0 group-hover:opacity-100 text-[11px] transition-all disabled:opacity-30 ${
              isSelected ? "text-gray-400 hover:text-yellow-300" : "text-gray-300 hover:text-yellow-500"
            }`}
          >
            {acc.is_active ? "⏸" : "▶"}
          </button>
          <button
            onClick={(ev) => { ev.stopPropagation(); onDelete(acc.id, acc.email); }}
            className={`opacity-0 group-hover:opacity-100 text-[11px] transition-all ${
              isSelected ? "text-gray-400 hover:text-red-400" : "text-gray-300 hover:text-red-500"
            }`}
          >✕</button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium truncate ${isSelected ? "text-white" : "text-gray-800"}`}>
          {acc.email}
        </p>
        {acc.unread_count > 0 && (
          <span className="ml-2 shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-semibold">
            {acc.unread_count > 99 ? "99+" : acc.unread_count}
          </span>
        )}
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">
          {acc.total_emails} email{acc.total_emails !== 1 ? "s" : ""}
        </span>
        {acc.last_active && (
          <span className={`text-[10px] ${isSelected ? "text-gray-400" : "text-gray-300"}`}>
            {getLastActiveRelative(acc.last_active)}
          </span>
        )}
      </div>
    </li>
  );
}

export function Sidebar({
  accounts, selectedAccount, onSelect, onToggle, onDelete, togglingId,
  onAddClick, lastUpdate, notifications, onNotificationSeen, onClearAll, onNotificationClick,
}: {
  accounts: Account[];
  selectedAccount: number | null;
  onSelect: (id: number) => void;
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number, email: string) => void;
  togglingId: number | null;
  onAddClick: () => void;
  lastUpdate: string | null;
  notifications: AppNotification[];
  onNotificationSeen: (id: number) => void;
  onClearAll: () => void;
  onNotificationClick: (accountId: number) => void;
}) {
  const [search, setSearch]                   = useState("");
  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const [allCollapsed, setAllCollapsed]       = useState(false);
  const [showNotifs, setShowNotifs]           = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const filtered    = accounts.filter((a) => a.email.toLowerCase().includes(search.toLowerCase()));
  const activeCount = accounts.filter((a) => a.is_active).length;

  const now             = Date.now();
  const TWENTY_FOUR_HRS = 24 * 60 * 60 * 1000;

  const recentAccounts = filtered.filter(
    (a) => a.last_active && now - new Date(a.last_active).getTime() < TWENTY_FOUR_HRS
  );
  const olderAccounts = filtered.filter(
    (a) => !a.last_active || now - new Date(a.last_active).getTime() >= TWENTY_FOUR_HRS
  );

  const unseenCount = notifications.filter((n) => !n.seen).length;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    if (showNotifs) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showNotifs]);

  const rowProps = { selectedAccount, togglingId, onSelect, onToggle, onDelete };

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-base font-semibold text-gray-900">Email Monitor</h1>

          <div className="flex items-center gap-2">
            {/* Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs((v) => !v)}
                className="relative w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                title="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unseenCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                    {unseenCount > 99 ? "99+" : unseenCount}
                  </span>
                )}
              </button>

              {/* ── Notification dropdown ── */}
              {showNotifs && (
                <div className="absolute top-9 left-1/2 -translate-x-1/2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-800">Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearAll}
                        className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="text-2xl mb-2">🔔</div>
                        <p className="text-xs text-gray-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onNotificationSeen(n.id);
                            onNotificationClick(n.accountId);
                            setShowNotifs(false);
                          }}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                            n.seen ? "bg-white" : "bg-blue-50/40"
                          }`}
                        >
                          <div className="mt-1.5 shrink-0 w-2">
                            {!n.seen && <span className="w-2 h-2 rounded-full bg-blue-500 block" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={`text-[11px] truncate ${n.seen ? "text-gray-400" : "font-semibold text-gray-800"}`}>
                              {n.accountEmail}
                            </p>
                            <p className={`text-[11px] mt-0.5 truncate ${n.seen ? "text-gray-400" : "text-gray-600"}`}>
                              New mail from{" "}
                              <span className={n.seen ? "" : "font-medium"}>
                                {n.from.replace(/<.*?>/, "").trim() || n.from}
                              </span>
                            </p>
                            <p className={`text-[10px] mt-0.5 truncate ${n.seen ? "text-gray-300" : "text-gray-400"}`}>
                              {n.subject}
                            </p>
                          </div>

                          <span className="text-[10px] text-gray-300 shrink-0 mt-0.5 whitespace-nowrap">
                            {getRelativeTime(n.time)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Add account */}
            <button
              onClick={onAddClick}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 text-white text-lg leading-none hover:bg-gray-700 transition-colors"
            >+</button>
          </div>
        </div>
        <p className="text-[11px] text-gray-400">{activeCount} active · updated {lastUpdate ?? "—"}</p>
      </div>

      {/* ── Stats ── */}
      <div className="px-4 py-3 flex gap-2 border-b border-gray-100">
        {[
          { label: "Total",  value: accounts.length },
          { label: "Active", value: activeCount },
          { label: "Paused", value: accounts.length - activeCount },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <div className="text-sm font-semibold text-gray-800">{s.value}</div>
            <div className="text-[10px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full pl-7 pr-3 py-1.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* ── Account list ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            {accounts.length === 0 ? "No accounts yet" : "No results"}
          </div>
        ) : (
          <>
            {recentAccounts.length > 0 && (
              <>
                <button
                  onClick={() => setRecentCollapsed((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-emerald-50 border-b border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                      Recent · last 24h
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-700 rounded-full px-1.5 font-semibold">
                      {recentAccounts.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500">{recentCollapsed ? "▶" : "▼"}</span>
                </button>
                {!recentCollapsed && (
                  <ul>{recentAccounts.map((acc) => <AccountRow key={acc.id} acc={acc} {...rowProps} />)}</ul>
                )}
              </>
            )}

            {olderAccounts.length > 0 && (
              <>
                <button
                  onClick={() => setAllCollapsed((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Older</span>
                    <span className="text-[10px] bg-gray-200 text-gray-500 rounded-full px-1.5 font-semibold">
                      {olderAccounts.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{allCollapsed ? "▶" : "▼"}</span>
                </button>
                {!allCollapsed && (
                  <ul>{olderAccounts.map((acc) => <AccountRow key={acc.id} acc={acc} {...rowProps} />)}</ul>
                )}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}