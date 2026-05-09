"use client";
import { useEffect, useRef, useState } from "react";
import { Account, EmailEntry } from "./types";
import { AddAccountModal } from "./components/AddAccountModal";
import { Sidebar } from "./components/Sidebar";
import { EmailPanel } from "./components/EmailPanel";

export interface AppNotification {
  id:           number;
  accountId:    number;
  accountEmail: string;
  from:         string;
  subject:      string;
  emailId:      number | null;
  seen:         boolean;
  time:         Date;
}

export default function Dashboard() {
  const [accounts, setAccounts]               = useState<Account[]>([]);
  const [emails, setEmails]                   = useState<EmailEntry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate]           = useState<string | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [showModal, setShowModal]             = useState(false);
  const [togglingId, setTogglingId]           = useState<number | null>(null);
  const [notifications, setNotifications]     = useState<AppNotification[]>([]);

  const knownEmailIds = useRef<Set<number> | null>(null);

  // ── 1. Request notification permission on first load ──────────────────
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Load notifications from backend ───────────────────────────────────
  async function fetchNotifications() {
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(
          data.map((n: any) => ({
            id:           n.id,
            accountId:    n.account_id,
            accountEmail: n.account_email,
            from:         n.from,
            subject:      n.subject,
            emailId:      n.email_id,
            seen:         n.is_seen,
            time:         new Date(n.created_at),
          }))
        );
      }
    } catch {
      // non-critical — silently ignore
    }
  }

  // ── Main data fetch + notification diffing ────────────────────────────
  async function fetchData() {
    try {
      const emailUrl = selectedAccount !== null
        ? `/api/emails/${selectedAccount}`
        : `/api/emails`;

      const [accRes, mailRes, allMailRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch(emailUrl),
        fetch("/api/emails"),
      ]);

      const accData:     Account[]    = await accRes.json();
      const mailData:    EmailEntry[] = await mailRes.json();
      const allMailData: EmailEntry[] = await allMailRes.json();

      const freshAccounts = Array.isArray(accData) ? accData : [];
      setAccounts(freshAccounts);
      setEmails(Array.isArray(mailData) ? mailData : []);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);

      // ── Notification diffing ──────────────────────────────────────────
      if (knownEmailIds.current === null) {
        // First load — seed known IDs, load persisted notifications
        knownEmailIds.current = new Set(allMailData.map((e) => e.id));
        await fetchNotifications();
      } else {
        const newEmails = allMailData.filter((e) => !knownEmailIds.current!.has(e.id));

        if (newEmails.length > 0) {
          // ── 2. Fire system notifications ─────────────────────────────
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            newEmails.forEach((e) => {
              const acc  = freshAccounts.find((a) => a.id === e.account_id);
              const notif = new Notification(`📬 ${acc?.email ?? "New email"}`, {
                body: `From: ${e.from ?? "Unknown"}\n${e.subject || "(no subject)"}`,
                icon: "/favicon.ico",
                tag:  `email-${e.id}`,  // prevents duplicate popups
              });

              notif.onclick = () => {
                window.focus();
                setSelectedAccount(e.account_id);
              };
            });
          }

          // Save to backend notifications
          await Promise.all(
            newEmails.map((e) => {
              const acc = freshAccounts.find((a) => a.id === e.account_id);
              return fetch("/api/notifications", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  account_id:    e.account_id,
                  account_email: acc?.email ?? `Account #${e.account_id}`,
                  from_address:  e.from ?? "Unknown sender",
                  subject:       e.subject || "(no subject)",
                  email_id:      e.id,
                }),
              });
            })
          );

          newEmails.forEach((e) => knownEmailIds.current!.add(e.id));
          await fetchNotifications();
        }
      }
    } catch {
      setError("Cannot reach backend — is it running?");
    }
  }

  // ── Notification actions ──────────────────────────────────────────────
  async function markNotificationSeen(id: number) {
    await fetch(`/api/notifications/${id}/seen`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, seen: true } : n))
    );
  }

  async function clearAllNotifications() {
    await fetch("/api/notifications", { method: "DELETE" });
    setNotifications([]);
  }

  // ── Email / account actions ───────────────────────────────────────────
  async function deleteEmail(id: number) {
    if (!confirm("Delete this email?")) return;
    await fetch(`/api/emails/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function markEmailRead(id: number) {
    await fetch(`/api/emails/${id}/read`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    });
    fetchData();
  }

  async function deleteAccount(id: number, email: string) {
    if (!confirm(`Remove ${email} from monitoring?`)) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (selectedAccount === id) setSelectedAccount(null);
    fetchData();
  }

  async function toggleAccount(id: number, currentState: boolean) {
    setTogglingId(id);
    try {
      await fetch(`/api/accounts/${id}/toggle`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentState }),
      });
      fetchData();
    } finally {
      setTogglingId(null);
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [selectedAccount]);

  const failedCount = emails.filter((e) => e.status === "forward_failed").length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {showModal && <AddAccountModal onClose={() => setShowModal(false)} onAdded={fetchData} />}

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 shadow">
          {error}
        </div>
      )}

      <Sidebar
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelect={(id) => setSelectedAccount(selectedAccount === id ? null : id)}
        onToggle={toggleAccount}
        onDelete={deleteAccount}
        togglingId={togglingId}
        onAddClick={() => setShowModal(true)}
        lastUpdate={lastUpdate}
        notifications={notifications}
        onNotificationSeen={markNotificationSeen}
        onClearAll={clearAllNotifications}
        onNotificationClick={(accountId) => setSelectedAccount(accountId)}
      />

      <EmailPanel
        emails={emails}
        selectedAccount={selectedAccount}
        accounts={accounts}
        onDeleteEmail={deleteEmail}
        onReadEmail={markEmailRead}
        failedCount={failedCount}
      />
    </div>
  );
}