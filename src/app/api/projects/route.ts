import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET all projects
export async function GET() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("GET /api/projects error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data ?? []);
}

// POST (insert new project)
export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabase.from("projects").insert([body]).select().single();

  if (error) {
    console.error("POST /api/projects error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// PUT (update existing project)
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...rest } = body;

  const { data, error } = await supabase
    .from("projects")
    .update(rest)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("PUT /api/projects error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// DELETE (remove project)
export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("DELETE /api/projects error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
