// Node.js compatible version of the create-checkout function
// This file is used for Vercel builds, while the .ts version is used for Supabase deployments

export default function handler(req, res) {
  res
    .status(200)
    .json({
      message:
        "This is a placeholder for Vercel builds. The actual function runs on Supabase Edge Functions.",
    });
}
