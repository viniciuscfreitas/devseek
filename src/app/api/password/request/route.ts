import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { env } from "@/lib/env";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.upsert({
    where: { token },
    create: {
      identifier: `password:${email}`,
      token,
      expires,
    },
    update: {
      identifier: `password:${email}`,
      expires,
    },
  });

  const baseUrl = env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);
  resetUrl.searchParams.set("email", email);

  await sendMail({
    to: email,
    subject: "Redefina sua senha - DevScout",
    html: `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="${resetUrl.toString()}">Clique aqui para definir uma nova senha</a> (válido por 1 hora).</p>`,
    text: `Redefina sua senha: ${resetUrl.toString()}`,
  });

  return NextResponse.json({ ok: true });
}


