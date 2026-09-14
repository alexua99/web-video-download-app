import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const headerStore = await headers();
  const accept = headerStore.get("accept-language")?.toLowerCase() ?? "";
  redirect(accept.includes("uk") ? "/uk" : "/en");
}
