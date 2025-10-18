// src/app/api/project/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DbStatus = "TO_BE_STARTED" | "IN_PROGRESS" | "DONE";
type ProjectPayload = {
  id?: string;
  title: string;
  status: DbStatus;
  tags?: string[];
  notes?: string | null;
  createdAt?: string; // ISO
};

function cleanProject(body: unknown): ProjectPayload {
  const b = body as Partial<ProjectPayload>;
  return {
    id: b.id,
    title: b.title ?? "",
    status:
      b.status === "IN_PROGRESS" || b.status === "DONE"
        ? b.status
        : "TO_BE_STARTED",
    tags: Array.isArray(b.tags) ? b.tags : [],
    notes: b.notes ?? null,
    createdAt: b.createdAt,
  };
}

function getId(req: Request) {
  return new URL(req.url).searchParams.get("id") ?? undefined;
}

/* ================ GET /api/project?id=... ================ */
export async function GET(req: Request) {
  const id = getId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Prisma first
  try {
    const item = await prisma.project.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error("[GET /api/project] Prisma error:", err);
  }

  // Supabase fallback
  try {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

/* ================ POST /api/project ================ */
export async function POST(req: Request) {
  const payload = cleanProject(await req.json());

  // Prisma first
  try {
    const created = await prisma.project.create({
      data: {
        id: payload.id,
        title: payload.title,
        status: payload.status,
        tags: payload.tags ?? [],
        notes: payload.notes ?? null,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/project] Prisma error:", err);
  }

  // Supabase fallback
  try {
    const row = {
      id: payload.id,
      title: payload.title,
      status: payload.status,
      tags: payload.tags ?? [],
      notes: payload.notes ?? null,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };
    const { data, error } = await supabase.from("projects").insert([row]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

/* ================ PUT /api/project?id=... ================ */
export async function PUT(req: Request) {
  const id = getId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const payload = cleanProject(await req.json());

  // Prisma first
  try {
    const updated = await prisma.project.update({
      where: { id },
      data: {
        title: payload.title,
        status: payload.status,
        tags: payload.tags ?? [],
        notes: payload.notes ?? null,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/project] Prisma error:", err);
  }

  // Supabase fallback
  try {
    const { data, error } = await supabase
      .from("projects")
      .update({
        title: payload.title,
        status: payload.status,
        tags: payload.tags ?? [],
        notes: payload.notes ?? null,
        createdAt: payload.createdAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

/* ================ DELETE /api/project?id=... ================ */
export async function DELETE(req: Request) {
  const id = getId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Prisma first
  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/project] Prisma error:", err);
  }

  // Supabase fallback
  try {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
