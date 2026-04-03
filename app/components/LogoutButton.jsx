"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        margin: "12px",
        padding: "8px 12px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Log out
    </button>
  );
}
