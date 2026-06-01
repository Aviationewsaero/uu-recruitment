// Role options for the public direct-apply form. Kept here (not in
// actions.ts) because Next 16 'use server' files can only export async
// functions - non-function exports break the client-component import.

export const DIRECT_APPLY_ROLES = [
  "Ground Staff",
  "Lounge & Hospitality",
  "Customer Service",
  "Supervisor / Team Lead",
  "Internship",
  "Other",
] as const;
