import { redirect } from "next/navigation";

/**
 * The complete application is intentionally authored as one standalone HTML
 * document in /public. Keeping this tiny route preserves the repository's
 * existing `npm run dev` workflow while allowing closet.html to run directly.
 */
export default function Home() {
  redirect("/closet.html");
}
