"use server";

import { hash, compare } from "bcryptjs";
import { Resend } from "resend";
import { InternSignupFormValues } from "./schema";

const resend = new Resend(process.env.RESEND_API_KEY);

// Request OTP for email verification during signup
export async function requestInternOtpAction(email: string) {
  try {
    // Validate email format
    if (!email || !email.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/intern/auth/request-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || "Failed to send OTP" };
    }

    return { success: true, message: "OTP sent to email" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// Verify OTP submitted by intern
export async function verifyInternOtpAction(email: string, otp: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/intern/auth/verify-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || "Invalid OTP" };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// Complete intern signup with full form data
export async function submitInternSignupAction(data: InternSignupFormValues) {
  try {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/intern/auth/signup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || "Signup failed" };
    }

    return {
      success: true,
      internId: result.internId,
      message: "Signup successful",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
