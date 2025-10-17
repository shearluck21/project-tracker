import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
export const runtime = "nodejs";


export const dynamic = "force-dynamic";

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

// GET
export async function GET() {
  try {
    const items = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[GET /api/projects] error:", err);
    return NextResponse.json([], { status: 200, headers: { "x-error": "true" } });
  }
}

// POST
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProjectPayload;
    const d = cleanProject(body);
    const created = await prisma.project.create({
      data: {
        id: d.id,
        title: d.title,
        status: d.status,
        tags: d.tags ?? [],
        notes: d.notes ?? null,
        createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects] error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PUT
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as ProjectPayload;
    const d = cleanProject(body);
    const updated = await prisma.project.update({
      where: { id: d.id! },
      data: {
        title: d.title,
        status: d.status,
        tags: d.tags ?? [],
        notes: d.notes ?? null,
        createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/projects] error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/projects] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}