import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

function getSupabase() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://");
  }
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const payload = {
    id: body.id ?? undefined,
    title: body.title,
    status: body.status,
    tags: Array.isArray(body.tags) ? body.tags : [],
    notes: body.notes ?? null,
    createdAt: body.createdAt ?? undefined
  };
  const { data, error } = await supabase.from("projects").insert([payload]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { id, ...rest } = body;
  const { data, error } = await supabase.from("projects").update(rest).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = getSupabase();
  const { id } = await req.json();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
