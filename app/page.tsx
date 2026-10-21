import { redirect } from "next/navigation";

// Middleware redirects "/" to the signed-in user's home page; this is only a fallback.
export default function Home() {
  redirect("/login");
}
