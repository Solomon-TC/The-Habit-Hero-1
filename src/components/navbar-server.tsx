import { createClient } from "../utils/supabase-server";

export async function getServerUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user };
}

export default async function NavbarServer() {
  const { user } = await getServerUser();

  return (
    <header className="border-b border-border">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Habit Hero" className="h-8 w-8" />
            <span className="text-lg font-bold">Habit Hero</span>
          </a>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <a
              href="/dashboard"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Dashboard
            </a>
          ) : (
            <>
              <a
                href="/sign-in"
                className="text-sm font-medium text-foreground hover:text-purple-600"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
