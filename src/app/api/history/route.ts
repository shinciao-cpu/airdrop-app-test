import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer (.+)$/);
  return m?.[1] ?? null;
}

// ==============================
// GET: 履歴取得
// ==============================
export async function GET(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (!user || authError) {
      return NextResponse.json({ error: "unauthorized", authError }, { status: 401 });
    }

    const { data: member, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "no org", user_id: user.id, memberError }, { status: 403 });
    }

    const url = new URL(req.url);
    const start = url.searchParams.get("start"); // YYYY-MM-DD (JST)
    const end = url.searchParams.get("end");     // YYYY-MM-DD (JST)

    let q = supabase
      .from("nft_history")
      .select("*")
      .eq("org_id", member.org_id);

    // ✅ start: JST 00:00 → UTC に変換して gte
    if (start) {
      const startUtc = new Date(`${start}T00:00:00.000+09:00`);
      if (Number.isNaN(startUtc.getTime())) {
        return NextResponse.json({ error: "invalid start date", start }, { status: 400 });
      }
      q = q.gte("created_at", startUtc.toISOString());
    }

    // ✅ end: JST 23:59:59.999 → UTC に変換して lte
    if (end) {
      const endUtc = new Date(`${end}T23:59:59.999+09:00`);
      if (Number.isNaN(endUtc.getTime())) {
        return NextResponse.json({ error: "invalid end date", end }, { status: 400 });
      }
      q = q.lte("created_at", endUtc.toISOString());
    }

    const { data, error } = await q.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, detail: error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "server exception", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// ==============================
// POST: 履歴保存
// ==============================
export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (!user || authError) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "no org" }, { status: 403 });
  }

  const payload = {
    org_id: member.org_id,
    user_id: user.id,
    type: body.type,
    name: body.name ?? null,
    id_no: body.id_no ?? null,
    email: body.email ?? null,
    recipient_address: body.recipient_address ?? null,
    amount: body.amount,
    token_ids: body.token_ids,
    tx_hash: body.tx_hash,
  };

  const { error } = await supabase.from("nft_history").insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
