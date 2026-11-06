import { NextRequest, NextResponse } from "next/server";
import { BIBLE_API_URL, BIBLE_ID } from "@/lib/bible-config";

// Browsers call API.Bible through this route so the key stays on the server.
// Only the reads the app needs are allowed, and only for the KJV.
const ALLOWED_PATHS = [
  /^books$/,
  /^books\/[A-Z0-9]{3}\/chapters$/,
  /^chapters\/[A-Z0-9]{3}\.\d{1,3}$/,
  /^verses\/[A-Z0-9]{3}\.\d{1,3}\.\d{1,3}$/,
  /^search$/,
];

const ALLOWED_PARAMS = new Set([
  "query",
  "limit",
  "offset",
  "sort",
  "fuzziness",
  "content-type",
  "include-notes",
  "include-titles",
  "include-chapter-numbers",
  "include-verse-numbers",
  "include-verse-spans",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const path = (await params).path.join("/");

  if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.BIBLE_API_KEY;
  if (!apiKey) {
    console.error("Missing env.BIBLE_API_KEY");
    return NextResponse.json(
      { error: "Bible service unavailable" },
      { status: 500 }
    );
  }

  const upstream = new URL(`${BIBLE_API_URL}/bibles/${BIBLE_ID}/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (ALLOWED_PARAMS.has(key)) upstream.searchParams.set(key, value);
  });

  const response = await fetch(upstream, {
    headers: { "api-key": apiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("API.Bible error:", response.status, path);
    return NextResponse.json(
      { error: "Bible service error" },
      { status: response.status === 404 ? 404 : 502 }
    );
  }

  // Scripture text doesn't change, so let the CDN absorb repeat requests.
  return NextResponse.json(await response.json(), {
    headers: { "Cache-Control": "public, s-maxage=86400" },
  });
}
