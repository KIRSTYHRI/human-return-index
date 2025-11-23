import { redirect } from "next/navigation";

export default function Home() {
  // Always send people straight to the live HRI dashboard
  redirect("/dashboard");
}
