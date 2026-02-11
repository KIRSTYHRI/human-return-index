import { redirect } from "next/navigation";

export default function AssessmentRedirectPage() {
  // Send people to the correct internal assessment form
  redirect("/dashboard/hri-assessment");
}
