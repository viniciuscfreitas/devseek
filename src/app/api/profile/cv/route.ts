import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo inválido." },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = path.extname(file.name) || ".pdf";
  const storageDir = path.join(env.STORAGE_BASE_PATH, session.user.id);

  await fs.mkdir(storageDir, { recursive: true });

  const storageKey = `cv-${Date.now()}${extension}`;
  const destination = path.join(storageDir, storageKey);
  await fs.writeFile(destination, buffer);

  const profile = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 },
    );
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      cvStorageKey: path.join(session.user.id, storageKey),
    },
  });

  return NextResponse.json({ ok: true });
}


