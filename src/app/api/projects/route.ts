import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // ensure Node runtime
export const dynamic = "force-dynamic"; // API routes aren't cached, but explicit is nice

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// GET all projects
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("createdAt", { ascending: false }); // or "created_at" if your column is snake_case
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

// POST (insert new project)
export async function POST(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();

  // Map only known columns; let DB set defaults (id/createdAt) if you have defaults.
  const payload = {
    title: String(body.title ?? "").trim(),
    status: String(body.status ?? "TO_BE_STARTED"),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    notes: body.notes == null ? null : String(body.notes),
    // If your table requires text id with NO default, uncomment this and send an id from client:
    // id: String(body.id),
    // If your table column is snake_case, adjust names here too.
  };

  const { data, error } = await supabase
    .from("projects")
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PUT (update)
export async function PUT(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { id, ...rest } = body;

  const update = {
    ...(rest.title !== undefined ? { title: String(rest.title) } : {}),
    ...(rest.status !== undefined ? { status: String(rest.status) } : {}),
    ...(rest.tags !== undefined ? { tags: Array.isArray(rest.tags) ? rest.tags : [] } : {}),
    ...(rest.notes !== undefined ? { notes: rest.notes == null ? null : String(rest.notes) } : {})
  };

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE
export async function DELETE(req: Request) {
  const supabase = getSupabase();
  const { id } = await req.json();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
