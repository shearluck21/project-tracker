import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function env(name: string) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} missing`);
  return v;
}

function getSupabase() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return createClient(url, key!);
}

// GET /api/projects
export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

// POST /api/projects
export async function POST(req: Request) {
  const supabase = getSupabase();
  const b = await req.json();

  const payload = {
    title: b.title,
    status: b.status ?? "IN_PROGRESS",      // 'TO_BE_STARTED' | 'IN_PROGRESS' | 'DONE'
    tags: Array.isArray(b.tags) ? b.tags : [],
    notes: b.notes ?? null                   // id + createdAt come from DB defaults
  };

  const { data, error } = await supabase
    .from("projects")
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// (optional) PUT/DELETE can be added later once build is green
