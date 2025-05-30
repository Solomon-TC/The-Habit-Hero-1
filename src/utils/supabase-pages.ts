// Server-side Supabase client for Pages Router
import { createServerClient } from "@supabase/ssr";
import { NextApiRequest, NextApiResponse } from "next";
import { cookies } from "next/headers";

export const createPagesServerClient = async ({
  req,
  res,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
}) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          res.setHeader(
            "Set-Cookie",
            `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`,
          );
        },
        remove(name, options) {
          res.setHeader(
            "Set-Cookie",
            `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
          );
        },
      },
    },
  );
};
