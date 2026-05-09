"use client";

export function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${
      provider === "gmail" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
    }`}>
      {provider}
    </span>
  );
}

export function StatusDot({ lastActive, isActive }: { lastActive: string | null; isActive: boolean }) {
  if (!isActive)
    return <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" title="Paused" />;
  return (
    <span className={`w-1.5 h-1.5 rounded-full inline-block ${lastActive ? "bg-emerald-500" : "bg-gray-300"}`} />
  );
}

export function FolderBadge({ folder }: { folder: string }) {
  const isSpam = folder?.toLowerCase().includes("spam") || folder?.toLowerCase().includes("junk");
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
      isSpam ? "bg-orange-50 text-orange-500" : "bg-purple-50 text-purple-500"
    }`}>
      {folder || "inbox"}
    </span>
  );
}