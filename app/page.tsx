"use client";
import { useEffect, useState } from "react";
import { Account, EmailEntry } from "./types";
import { AddAccountModal } from "./components/AddAccountModal";
import { Sidebar } from "./components/Sidebar";
import { EmailPanel } from "./components/EmailPanel";

export default function Dashboard() {
  const [accounts, setAccounts]               = useState<Account[]>([]);
  const [emails, setEmails]                   = useState<EmailEntry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate]           = useState<string | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [showModal, setShowModal]             = useState(false);
  const [togglingId, setTogglingId]           = useState<number | null>(null);

  async function fetchData() {
    try {
      const emailUrl = selectedAccount !== null ? `/api/emails/${selectedAccount}` : `/api/emails`;
      const [accRes, mailRes] = await Promise.all([fetch("/api/accounts"), fetch(emailUrl)]);
      const accData  = await accRes.json();
      const mailData = await mailRes.json();
      setAccounts(Array.isArray(accData)  ? accData  : []);
      setEmails(Array.isArray(mailData)   ? mailData : []);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch {
      setError("Cannot reach backend — is it running?");
    }
  }

  async function deleteEmail(id: number) {
    if (!confirm("Delete this email?")) return;
    await fetch(`/api/emails/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function markEmailRead(id: number) {
    await fetch(`/api/emails/${id}/read`, {
      method: "PATCH",
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
        method: "PATCH",
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