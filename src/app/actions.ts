"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function encodedRedirect(
  type: "success" | "error",
  message: string,
  redirectTo?: string,
) {
  const searchParams = new URLSearchParams();
  searchParams.set(type, message);
  return redirect(`${redirectTo || ""}?${searchParams.toString()}`);
}

// Create a reusable function for Supabase client initialization
const createSupabaseClient = async () => {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Missing Supabase environment variables");
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        async get(name) {
          try {
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.error("Error getting cookie:", error);
            return undefined;
          }
        },
        async set(name, value, options) {
          try {
            await cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error("Error setting cookie:", error);
          }
        },
        async remove(name, options) {
          try {
            await cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.error("Error removing cookie:", error);
          }
        },
      },
    });
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    throw new Error("Failed to initialize authentication client");
  }
};

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string;

  if (!email || !password) {
    return encodedRedirect("error", "Email and password are required");
  }

  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", error.message);
  }

  return redirect(redirectTo || "/dashboard");
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;

  if (!email || !password || !full_name) {
    return encodedRedirect("error", "All fields are required");
  }

  const supabase = await createSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", error.message);
  }

  if (data?.user) {
    // Update the user's profile with the new name
    const { error } = await supabase
      .from("users")
      .update({ name: full_name })
      .eq("id", data.user.id);

    if (error) {
      // Error handling without console.error
      return encodedRedirect(
        "error",
        "Account created but profile update failed. Please update your profile later.",
      );
    }

    // Check if email confirmation is required
    if (!data.session) {
      return encodedRedirect(
        "success",
        "Please check your email for a confirmation link.",
      );
    }

    return redirect("/dashboard");
  }

  return encodedRedirect("error", "An unexpected error occurred");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return encodedRedirect("error", "Email is required");
  }

  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return encodedRedirect("error", error.message);
  }

  return encodedRedirect(
    "success",
    "Password reset link sent. Please check your email.",
  );
}

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) {
    return encodedRedirect("error", "Password is required");
  }

  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return encodedRedirect("error", error.message);
  }

  return encodedRedirect(
    "success",
    "Password updated successfully. Please sign in with your new password.",
    "/sign-in",
  );
}

export async function checkUserSubscription(userId: string) {
  const supabase = await createSupabaseClient();

  try {
    // Check for active subscription
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"]);

    if (error) {
      console.error("Error checking subscription:", error);
      return false;
    }

    return Array.isArray(subscriptions) && subscriptions.length > 0;
  } catch (error) {
    console.error("Unexpected error in checkUserSubscription:", error);
    return false;
  }
}
