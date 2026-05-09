"use client";
import { useEffect, useState } from "react";

// ── INTERFACES ─────────────────────────────────────────────────────────────

interface Account {
  id: number;
  email: string;
  provider: string;
  is_active: boolean;
  total_emails: number;
  last_active: string | null;
}

interface EmailEntry {
  id: number;
  account_id: number;
  uid: string;
  from: string;
  subject: string;
  body: string;
  received_at: string;
  forwarded_at: string;
  status: string;
  folder: string;
}

// ── HELPERS ────────────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${
      provider === "gmail" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
    }`}>
      {provider}
    </span>
  );
}

function StatusDot({ lastActive, isActive }: { lastActive: string | null; isActive: boolean }) {
  if (!isActive)
    return <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" title="Paused" />;
  return (
    <span className={`w-1.5 h-1.5 rounded-full inline-block ${lastActive ? "bg-emerald-500" : "bg-gray-300"}`} />
  );
}

function FolderBadge({ folder }: { folder: string }) {
  const isSpam = folder?.toLowerCase().includes("spam") || folder?.toLowerCase().includes("junk");
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
      isSpam ? "bg-orange-50 text-orange-500" : "bg-purple-50 text-purple-500"
    }`}>
      {folder || "inbox"}
    </span>
  );
}

// ── ADD ACCOUNT MODAL ──────────────────────────────────────────────────────

function AddAccountModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState("gmail");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, provider }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">Add Client Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
            <div className="flex gap-2">
              {["gmail", "outlook"].map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    provider === p ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Client Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@gmail.com"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              App Password
              <span className="ml-1 text-gray-400 font-normal">(not their real password)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <strong>Gmail:</strong> Google Account → Security → App Passwords
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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

// ── SIDEBAR ────────────────────────────────────────────────────────────────

function Sidebar({
  accounts, selectedAccount, onSelect, onToggle, onDelete, togglingId, onAddClick, lastUpdate,
}: {
  accounts: Account[];
  selectedAccount: number | null;
  onSelect: (id: number) => void;
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number, email: string) => void;
  togglingId: number | null;
  onAddClick: () => void;
  lastUpdate: string | null;
}) {
  const [search, setSearch] = useState("");
  const filtered    = accounts.filter((a) => a.email.toLowerCase().includes(search.toLowerCase()));
  const activeCount = accounts.filter((a) => a.is_active).length;

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-base font-semibold text-gray-900">Email Monitor</h1>
          <button
            onClick={onAddClick}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 text-white text-lg leading-none hover:bg-gray-700 transition-colors"
            title="Add account"
          >
            +
          </button>
        </div>
        <p className="text-[11px] text-gray-400">{activeCount} active · updated {lastUpdate ?? "—"}</p>
      </div>

      {/* Stats */}
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

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full pl-7 pr-3 py-1.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* Account list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            {accounts.length === 0 ? "No accounts yet" : "No results"}
          </div>
        ) : (
          <ul>
            {filtered.map((acc) => (
              <li
                key={acc.id}
                onClick={() => onSelect(acc.id)}
                className={`group px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                  selectedAccount === acc.id ? "bg-gray-900" : "hover:bg-gray-50"
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
                        selectedAccount === acc.id ? "text-gray-400 hover:text-yellow-300" : "text-gray-300 hover:text-yellow-500"
                      }`}
                      title={acc.is_active ? "Pause" : "Resume"}
                    >
                      {acc.is_active ? "⏸" : "▶"}
                    </button>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); onDelete(acc.id, acc.email); }}
                      className={`opacity-0 group-hover:opacity-100 text-[11px] transition-all ${
                        selectedAccount === acc.id ? "text-gray-400 hover:text-red-400" : "text-gray-300 hover:text-red-500"
                      }`}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className={`text-xs font-medium truncate ${selectedAccount === acc.id ? "text-white" : "text-gray-800"}`}>
                  {acc.email}
                </p>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">
                    {acc.total_emails} email{acc.total_emails !== 1 ? "s" : ""}
                  </span>
                  {acc.last_active && (
                    <span className={`text-[10px] ${selectedAccount === acc.id ? "text-gray-500" : "text-gray-300"}`}>
                      {new Date(acc.last_active).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

// ── EMAIL DRAWER ───────────────────────────────────────────────────────────

function EmailDrawer({ email, onClose, onDelete }: {
  email: EmailEntry | null;
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  if (!email) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30 bg-black/10" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-40 h-screen w-[480px] bg-white border-l border-gray-100 shadow-2xl flex flex-col">

        {/* Drawer header */}
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
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0 space-y-1.5">
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">From</span>
            <span className="text-gray-800 font-medium truncate">{email.from}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">Received</span>
            <span className="text-gray-700">
              {email.received_at ? new Date(email.received_at).toLocaleString() : "—"}
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">Forwarded</span>
            <span className="text-gray-700">
              {email.forwarded_at ? new Date(email.forwarded_at).toLocaleString() : "—"}
            </span>
          </div>
        </div>

        {/* Full body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-sans leading-relaxed">
            {email.body || "(no body)"}
          </pre>
        </div>
      </div>
    </>
  );
}

// ── EMAIL PANEL ────────────────────────────────────────────────────────────

function EmailPanel({
  emails, selectedAccount, accounts, onDeleteEmail, failedCount,
}: {
  emails: EmailEntry[];
  selectedAccount: number | null;
  accounts: Account[];
  onDeleteEmail: (id: number) => void;
  failedCount: number;
}) {
  const [search, setSearch]       = useState("");
  const [openEmail, setOpenEmail] = useState<EmailEntry | null>(null);

  const account = selectedAccount !== null
    ? accounts.find((a) => a.id === selectedAccount)
    : null;

  const filtered = emails.filter((e) => {
    if (!search) return true;
    return (
      e.subject?.toLowerCase().includes(search.toLowerCase()) ||
      e.from?.toLowerCase().includes(search.toLowerCase()) ||
      e.body?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Close drawer when account switches
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

      {/* Panel header */}
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
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            className="pl-7 pr-3 py-1.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 w-52"
          />
        </div>
      </div>

      {/* Email list */}
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
                    : "bg-white hover:bg-gray-50 border-l-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">
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
                      title="Delete"
                    >
                      ✕
                    </button>
                    <span className="text-xs text-gray-400">
                      {e.received_at ? new Date(e.received_at).toLocaleTimeString() : "—"}
                    </span>
                    <p className="text-[10px] text-gray-300">
                      {e.received_at ? new Date(e.received_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Slide-in drawer */}
      <EmailDrawer
        email={openEmail}
        onClose={() => setOpenEmail(null)}
        onDelete={(id) => { onDeleteEmail(id); setOpenEmail(null); }}
      />
    </main>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────

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
      {showModal && (
        <AddAccountModal onClose={() => setShowModal(false)} onAdded={fetchData} />
      )}

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
        failedCount={failedCount}
      />
    </div>
  );
}