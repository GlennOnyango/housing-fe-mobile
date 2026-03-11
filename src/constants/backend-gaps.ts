export interface BackendGap {
  id: string;
  title: string;
  missingEndpoint: string;
  recommendation: string;
}

export const backendGaps: BackendGap[] = [
  {
    id: "auth-me",
    title: "Role bootstrap endpoint missing",
    missingEndpoint: "GET /auth/me",
    recommendation:
      "Add memberships + roles payload and migrate role probing to /auth/me with one-release fallback.",
  },
  {
    id: "service-provider-crud",
    title: "Owner/agent service provider CRUD missing",
    missingEndpoint:
      "POST/GET/PATCH/DELETE /service-providers",
    recommendation:
      "Expose CRUD endpoints to unlock owner-managed provider directory and contacts.",
  },
  {
    id: "tenant-tickets-read",
    title: "Tenant ticket listing and comments missing",
    missingEndpoint:
      "GET /tenant/me/tickets and ticket comments endpoints",
    recommendation:
      "Add tenant ticket read APIs and threaded comments for full lifecycle visibility.",
  },
  {
    id: "lease-preview",
    title: "Lease preview before signing missing",
    missingEndpoint: "GET /onboarding/lease-preview (or equivalent)",
    recommendation:
      "Provide explicit lease preview endpoint for legal-review UX before signature submission.",
  },
  {
    id: "session-management",
    title: "Device/session management endpoints missing",
    missingEndpoint: "GET /auth/sessions and POST /auth/logout-all",
    recommendation:
      "Add active device list and logout-all capability for robust session management UI.",
  },
];
