import { NextResponse } from "next/server";
type Status = 'todo' | 'in-progress' | 'done';
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

// --- Helpers ---
function cleanProject(body: any) {
  return {
    id: body.id,
    title: body.title,
    status:
      body.status === "IN_PROGRESS" || body.status === "DONE"
        ? body.status
        : "TO_BE_STARTED",
    tags: Array.isArray(body.tags) ? body.tags : [],
    notes: body.notes ?? null,
    createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
  };
}

// --- Routes ---

// GET all projects
export async function GET() {
  try {
    const items = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[GET /api/projects] error:", err);
    // Return an empty array to keep the client stable; include an error flag
    return NextResponse.json([], { status: 200, headers: { "x-error": "true" } });
  }
}

// POST: create new project
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = cleanProject(body);
    const created = await prisma.project.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/projects] error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PUT: update existing project
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const data = cleanProject(body);
    const updated = await prisma.project.update({
      where: { id: data.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PUT /api/projects] error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE: remove project
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/projects] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
