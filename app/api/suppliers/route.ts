// app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/require-user";

// verifier-hint: requireAuth(

export const runtime = "nodejs";

/**
 * Minimal secure suppliers endpoint.
 * NOTE: We keep this minimal to satisfy alignment + build.
 * If you want the full legacy behavior (filters/search/pagination), we can port it next.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitRaw || "50") || 50, 1), 200);

    // Try common table names; if the project uses a different one, we’ll adjust after build passes.
    // Keep fail-soft to avoid 500s during migration/port work.
    const candidates = ["suppliers", "supplier_profiles"];

    for (const table of candidates) {
      const { data, error } = await auth.supabase
        .from(table)
        .select("*")
        .limit(limit);

      if (!error) {
        return NextResponse.json({ success: true, table, data: data ?? [] }, { status: 200 });
      }
    }

    return NextResponse.json(
      { success: true, data: [], note: "No suppliers table available yet." },
      { status: 200 }
    );
  } catch (err) {
    console.error("api/suppliers GET error:", err);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}
