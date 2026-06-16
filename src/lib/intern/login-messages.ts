// Client-safe messages for login page (no server-only imports)

export function loginReasonMessage(reason: string | null | undefined): string | null {
  switch (reason) {
    case "verify_email":
      return "Please verify your email to continue. Check your inbox for the OTP.";
    case "account_disabled":
      return "Your account has been disabled. Please contact your EWS mentor.";
    case "account_terminated":
      return "Your access has been ended. Please contact your EWS mentor if this is unexpected.";
    case "internship_ended":
      return "Your internship period has ended. Materials are no longer accessible.";
    case "not_found":
      return "Account not found. Please sign up again.";
    case "session_expired":
      return "Your session expired. Please log in again.";
    default:
      return null;
  }
}
