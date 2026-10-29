// Check that the Instagram cookies yt-dlp uses still belong to a signed-in
// session, and log a warning when they need to be exported again.

import { readFile } from "node:fs/promises";

const FILE = process.env.COOKIES_FILE || "/app/cookies.txt";
const WARN_DAYS = Number(process.env.COOKIES_WARN_DAYS || 14);
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0";

function log(message) {
  const time = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  console.log(`${time} cookies-check: ${message}`);
}

function warn(message) {
  log(`WARNING ${message}. Sign in to Instagram in Firefox and export cookies again.`);
}

async function main() {
  let text;
  try {
    text = await readFile(FILE, "utf8");
  } catch {
    log(`no cookies file at ${FILE}; restricted Instagram videos will not download`);
    return;
  }

  const cookies = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^#HttpOnly_/, ""))
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("\t"))
    .filter((cols) => cols.length >= 7 && cols[0].endsWith("instagram.com"));

  const session = cookies.find((cols) => cols[5] === "sessionid");
  if (!session) {
    warn("Instagram cookies have no sessionid (not signed in)");
    return;
  }

  const expires = Number(session[4]);
  if (expires > 0) {
    const days = Math.floor((expires * 1000 - Date.now()) / 86_400_000);
    if (days < 0) {
      warn("Instagram session cookie has expired");
      return;
    }
    if (days < WARN_DAYS) {
      warn(`Instagram session cookie expires in ${days} days`);
    }
  }

  // Signed in: the settings page loads. Signed out or revoked: it redirects
  // to the login page, a challenge, or the home page.
  let response;
  try {
    response = await fetch("https://www.instagram.com/accounts/edit/", {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
      headers: {
        cookie: cookies.map((cols) => `${cols[5]}=${cols[6]}`).join("; "),
        "user-agent": USER_AGENT,
        "accept-language": "en-US,en;q=0.9",
      },
    });
  } catch (error) {
    log(`could not reach Instagram (${error.message}); will retry next run`);
    return;
  }

  const location = response.headers.get("location") || "";
  if (response.status === 200) {
    log("ok, Instagram session is signed in");
  } else if (response.status >= 300 && response.status < 400 && location) {
    const path = new URL(location, "https://www.instagram.com").pathname;
    warn(`Instagram session is signed out or needs confirmation (redirected to ${path})`);
  } else {
    log(`unexpected Instagram response ${response.status} ${location}; will retry next run`);
  }
}

main().catch((error) => log(`failed: ${error.message}`));
