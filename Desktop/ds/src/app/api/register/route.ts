import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      profiles: {
        create: {
          label: "Default",
          isDefault: true,
        },
      },
    },
    include: {
      profiles: true,
    },
  });

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const baseUrl = env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verificationUrl = new URL("/verify-email", baseUrl);
  verificationUrl.searchParams.set("token", token);
  verificationUrl.searchParams.set("email", email);

  await sendMail({
    to: email,
    subject: "Confirm your DevScout account",
    html: `<p>Hi ${name},</p><p>Confirm your email to activate your account: <a href="${verificationUrl.toString()}">Verify email</a></p>`,
    text: `Confirm your email: ${verificationUrl.toString()}`,
  });

  return NextResponse.json(
    {
      id: user.id,
      email: user.email,
    },
    { status: 201 },
  );
}

