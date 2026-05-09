"use client";
import { useState } from "react";

export function AddAccountModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
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
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="client@gmail.com"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              App Password <span className="ml-1 text-gray-400 font-normal">(not their real password)</span>
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
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
            onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Adding..." : "Add Account"}
          </button>
        </div>
      </div>
    </div>
  );
}