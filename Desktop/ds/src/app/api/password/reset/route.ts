import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, token, password } = parsed.data;

  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (
    !tokenRecord ||
    tokenRecord.identifier !== `password:${email}` ||
    tokenRecord.expires < new Date()
  ) {
    return NextResponse.json(
      { error: "Token inválido ou expirado." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: {
        passwordHash: await hash(password, 10),
      },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ ok: true });
}


