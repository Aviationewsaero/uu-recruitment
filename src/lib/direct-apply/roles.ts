// Role options for the public direct-apply form. Kept here (not in
// actions.ts) because Next 16 'use server' files can only export async
// functions - non-function exports break the client-component import.
//
// This list must stay identical to TALENT_ROLES in InternAVIA
// (internships-ews-aero/frontend/src/lib/talent.ts). That app validates the
// role we post and rejects anything it doesn't recognise, and its admin
// console filters on these exact strings. Separate apps, separate databases -
// so the two copies can only be kept in step by hand.

export const DIRECT_APPLY_ROLES = [
  "Ground Staff",
  "Lounge & Hospitality",
  "Customer Service",
  "Supervisor / Team Lead",
  "Internship",
  "Other",
] as const;
