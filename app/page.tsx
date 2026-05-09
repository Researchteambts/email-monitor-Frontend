"use client";
import { useEffect, useState } from "react";

// ── INTERFACES ────────────────────────────────────────────────────────────

interface Account {
  id: number;                  // ✅ added — needed for delete/toggle
  email: string;
  provider: string;
  is_active: boolean;          // ✅ added — needed for pause/resume UI
  total_emails: number;        // ✅ fixed — was total_forwarded
  last_active: string | null;
}

interface EmailEntry {
  id: number;
  account_id: number;          // ✅ fixed — was account (string)
  uid: string;
  from: string;
  subject: string;
  body: string;
  received_at: string;
  forwarded_at: string;
  status: string;
  folder: string;
}

// ── BADGE ─────────────────────────────────────────────────────────────────

function Badge({ provider }: { provider: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        provider === "gmail"
          ? "bg-red-100 text-red-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {provider}
    </span>
  );
}

function StatusDot({ lastActive, isActive }: { lastActive: string | null; isActive: boolean }) {
  if (!isActive) {
    return (
      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" title="Paused" />
    );
  }
  const recent =
    lastActive && Date.now() - new Date(lastActive).getTime() < 10 * 60 * 1000;
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        recent ? "bg-green-500 animate-pulse" : "bg-gray-300"
      }`}
    />
  );
}

// ── ADD ACCOUNT MODAL ─────────────────────────────────────────────────────

function AddAccountModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState("gmail");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("api/accounts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add account");
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Add Client Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
            <div className="flex gap-2">
              {["gmail", "outlook"].map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    provider === p
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Client Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@gmail.com"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* App Password */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              App Password
              <span className="ml-1 text-gray-400 font-normal">
                (use app-specific password, not their real password)
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Helper note */}
          <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <strong>Gmail:</strong> Go to Google Account → Security → App Passwords to generate one.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Adding..." : "Add Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EMAIL FEED ────────────────────────────────────────────────────────────

function EmailFeed({
  emails,
  selectedAccount,
  accounts,
  onDeleteEmail, 
}: {
  emails: EmailEntry[];
  selectedAccount: number | null;        
  accounts: Account[];
  onDeleteEmail: (id: number) => void;
}) {
  // ✅ filter by account_id not account string
  const filtered = selectedAccount !== null
    ? emails.filter((e) => e.account_id === selectedAccount)
    : emails;

  // helper to get email address from account_id
  function accountEmail(account_id: number) {
    return accounts.find((a) => a.id === account_id)?.email ?? String(account_id);
  }

  const selectedEmail = selectedAccount !== null
    ? accounts.find((a) => a.id === selectedAccount)?.email
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-600">
          {selectedEmail ? `Emails — ${selectedEmail}` : "All Received Emails"}
        </h2>
        <span className="text-xs text-gray-400">{filtered.length} total</span>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          No emails received yet
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {filtered.map((e) => (
            <li key={e.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {e.subject || "(no subject)"}
                    </p>
                    {/* ✅ status badge */}
                    <span
                      className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                        e.status === "forwarded"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {e.status}
                    </span>
                    <span className="shrink-0 text-xs px-1.5 py-0.5 rounded font-medium bg-purple-50 text-purple-600">
                      {e.folder}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    From: <span className="text-gray-700">{e.from}</span>
                  </p>

                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 whitespace-pre-line">
                    {e.body || "(no body)"}
                  </p>

                  {/* ✅ show account label using account_id → email lookup */}
                  {selectedAccount === null && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5">
                      <span className="text-xs text-blue-400">received by</span>
                      <span className="text-xs font-medium text-blue-700">
                        {accountEmail(e.account_id)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <button
                    onClick={() => onDeleteEmail(e.id)}
                    className="text-gray-200 hover:text-red-400 text-xs transition-colors mb-1"
                    title="Delete email"
                  >
                    ✕
                  </button>
                  <span className="text-xs text-gray-400">
                    {e.received_at ? new Date(e.received_at).toLocaleTimeString() : "—"}
                  </span>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {e.received_at ? new Date(e.received_at).toLocaleDateString() : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [accounts, setAccounts]               = useState<Account[]>([]);
  const [emails, setEmails]                   = useState<EmailEntry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null); // ✅ number not string
  const [lastUpdate, setLastUpdate]           = useState<string | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [showModal, setShowModal]             = useState(false);
  const [togglingId, setTogglingId]           = useState<number | null>(null);

  async function fetchData() {
    try {
      // ✅ emails filtered by account_id via path param
      const emailUrl = selectedAccount !== null
        ? `/api/emails/${selectedAccount}`
        : `/api/emails`;

      const [accRes, mailRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch(emailUrl),
      ]);

      const accData  = await accRes.json();
      const mailData = await mailRes.json();

      setAccounts(Array.isArray(accData)  ? accData  : []);
      setEmails(Array.isArray(mailData)   ? mailData : []);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch {
      setError("Cannot reach backend — is it running on port 8001?");
    }
  }
  async function deleteEmail(id: number) {
    if (!confirm("Delete this email?")) return;
    await fetch(`/api/emails/${id}`, { method: "DELETE" });
    fetchData(); 
  }
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [selectedAccount]);

  // ✅ delete uses account.id not email string
  async function deleteAccount(id: number, email: string) {
    if (!confirm(`Remove ${email} from monitoring?`)) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (selectedAccount === id) setSelectedAccount(null);
    fetchData();
  }

  // ✅ toggle pause/resume
  async function toggleAccount(id: number, currentState: boolean) {
    setTogglingId(id);
    try {
      await fetch(`/api/accounts/${id}/toggle`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ is_active: !currentState }),
      });
      fetchData();
    } finally {
      setTogglingId(null);
    }
  }

  const totalEmails   = emails.length;
  const activeCount   = accounts.filter((a) => a.is_active).length;
  const failedCount   = emails.filter((e) => e.status === "forward_failed").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {showModal && (
        <AddAccountModal
          onClose={() => setShowModal(false)}
          onAdded={fetchData}
        />
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Email Monitor</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Live dashboard · updates every 30s
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              Last updated: {lastUpdate ?? "—"}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
            >
              + Add Account
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Accounts",      value: accounts.length },
            { label: "Active",        value: activeCount },
            { label: "Failed Fwds",   value: failedCount },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{s.label}</span>
              <span className={`text-lg font-semibold ${s.label === "Failed Fwds" && s.value > 0 ? "text-red-500" : "text-gray-800"}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Account cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-3">
              No accounts yet — click <strong>+ Add Account</strong> to start.
            </p>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() =>
                  setSelectedAccount(selectedAccount === acc.id ? null : acc.id)
                }
                className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${
                  selectedAccount === acc.id
                    ? "border-gray-900 ring-1 ring-gray-900"
                    : "border-gray-100 hover:border-gray-300"
                } ${!acc.is_active ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge provider={acc.provider} />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <StatusDot lastActive={acc.last_active} isActive={acc.is_active} />
                      {!acc.is_active ? "paused" : acc.last_active ? "active" : "waiting"}
                    </div>

                    {/* ✅ Toggle pause/resume button */}
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        toggleAccount(acc.id, acc.is_active);
                      }}
                      disabled={togglingId === acc.id}
                      className="text-gray-300 hover:text-yellow-500 text-xs transition-colors disabled:opacity-40"
                      title={acc.is_active ? "Pause monitoring" : "Resume monitoring"}
                    >
                      {acc.is_active ? "⏸" : "▶"}
                    </button>

                    {/* ✅ Delete uses acc.id */}
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        deleteAccount(acc.id, acc.email);
                      }}
                      className="text-gray-300 hover:text-red-500 text-xs transition-colors"
                      title="Remove account"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-gray-800 truncate">
                  {acc.email}
                </p>

                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {acc.total_emails} email{acc.total_emails !== 1 ? "s" : ""} received
                  </span>
                    {acc.last_active && (
                      <span className="text-xs text-gray-300" title="Last forwarded at">
                        {new Date(acc.last_active).toLocaleTimeString()}
                      </span>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Email feed */}
        <EmailFeed
          emails={emails}
          selectedAccount={selectedAccount}
          accounts={accounts}
          onDeleteEmail={deleteEmail} 
        />
      </div>
    </div>
  );
}