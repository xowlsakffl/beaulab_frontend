type MutationEffects = { scopes?: readonly string[]; navigationBadges: boolean };

const contentScopes = [
  "talks",
  "talk-comments",
  "hospital-reviews",
  "hospital-review-comments",
  "hospital-evaluations",
  "videos",
];
const walletScopes = ["hospital-wallets", "hospital-wallet-operations", "hospitals"];

const scopesByResource: Record<string, readonly string[]> = {
  hospitals: [
    "hospitals",
    "hospital-wallets",
    "doctors",
    "hospital-events",
    "hospital-event-ads",
    "hospital-evaluations",
    "hospital-reviews",
    "videos",
  ],
  doctors: ["doctors", "hospital-events", "videos"],
  "hospital-entries": ["hospital-entries"],
  "hospital-events": [
    "hospital-events",
    "hospital-event-ads",
    "hospital-event-dbs",
    "hospital-event-real-model-dbs",
    "hospital-wallets",
    "hospital-wallet-operations",
  ],
  "hospital-event-ads": ["hospital-event-ads", "hospital-events", ...walletScopes],
  "hospital-event-dbs": ["hospital-event-dbs", ...walletScopes],
  "hospital-event-real-model-dbs": ["hospital-event-real-model-dbs", ...walletScopes],
  "hospital-wallets": walletScopes,
  "hospital-wallet-operations": walletScopes,
  users: ["account-users", "reported-content", ...contentScopes],
  "reported-contents": ["reported-content", "account-users", ...contentScopes],
  talks: ["talks", "talk-comments", "reported-content"],
  "talk-comments": ["talks", "talk-comments", "reported-content"],
  "hospital-reviews": ["hospital-reviews", "hospital-review-comments", "reported-content"],
  "hospital-review-comments": ["hospital-reviews", "hospital-review-comments", "reported-content"],
  "hospital-evaluations": ["hospital-evaluations", "reported-content", "hospitals"],
  videos: ["videos", "hashtags", "reported-content"],
  hashtags: ["hashtags", "videos"],
  categories: ["categories"],
  notices: ["notices"],
  "hospital-promotions": ["hospital-promotions"],
};

export function getMutationEffects(path: string): MutationEffects {
  const pathname = path.split("?")[0].replace(/\/$/, "");
  const resource = pathname.split("/").filter(Boolean)[0];
  if (
    ["auth", "notes", "hospital-account-invitations"].includes(resource) ||
    /^\/hospitals\/(?:check-name|check-business-number)$/.test(pathname) ||
    /^\/hospitals\/[^/]+\/password-reset-link$/.test(pathname) ||
    pathname === "/hospital-wallets/balance-notices" ||
    /^\/(?:notices|hospital-promotions)\/editor-images(?:\/|$)/.test(pathname)
  )
    return { scopes: [], navigationBadges: false };

  // Keep unknown endpoints conservative until their cross-domain effects are classified.
  return { scopes: scopesByResource[resource], navigationBadges: true };
}
