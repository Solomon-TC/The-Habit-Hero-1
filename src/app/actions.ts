"use server";

import { createClient } from "../../supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      // Import the createClient function from the server module
      const { createServiceRoleClient } = await import(
        "../lib/supabase-server-actions"
      );

      // Create a service role client that bypasses RLS
      const adminClient = createServiceRoleClient();

      if (!adminClient) {
        // Error handling without console.error
        return encodedRedirect(
          "error",
          "/sign-up",
          "Failed to create user profile",
        );
      }

      // First check if the user already exists in the users table
      const { data: existingUser, error: checkError } = await adminClient
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        return encodedRedirect(
          "error",
          "/sign-up",
          "Failed to check user profile: " + checkError.message,
        );
      }

      // Only insert if the user doesn't already exist
      if (!existingUser) {
        const { error: updateError } = await adminClient.from("users").insert({
          id: user.id,
          user_id: user.id,
          name: fullName,
          email: email,
          token_identifier: user.id,
          created_at: new Date().toISOString(),
          xp: 0,
          level: 1,
          updated_at: new Date().toISOString(),
        });

        if (updateError) {
          // Error handling without console.error
          return encodedRedirect(
            "error",
            "/sign-up",
            "Failed to create user profile: " + updateError.message,
          );
        }
      }

      if (updateError) {
        // Error handling without console.error
        return encodedRedirect(
          "error",
          "/sign-up",
          "Failed to create user profile: " + updateError.message,
        );
      }
    } catch (err) {
      // Error handling without console.error
      return encodedRedirect(
        "error",
        "/sign-up",
        "An error occurred while creating your profile",
      );
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  try {
    const supabase = await createClient();

    // Check for active subscription in the subscriptions table
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"]);

    if (error) {
      console.error("Error checking subscription:", error);
      // Default to true if there's an error to prevent locking users out
      return true;
    }

    // Check if there are any active subscriptions in the array
    return Array.isArray(subscriptions) && subscriptions.length > 0;
  } catch (error) {
    console.error("Unexpected error in checkUserSubscription:", error);
    // Default to true if there's an error to prevent locking users out
    return true;
  }
};
