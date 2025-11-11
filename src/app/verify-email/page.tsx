import Link from "next/link";

import { prisma } from "@/lib/prisma";

type SearchParams = {
  token?: string;
  email?: string;
};

const messages = {
  success: {
    title: "Email verified!",
    body: "You can now sign in and complete your onboarding.",
  },
  expired: {
    title: "Verification expired",
    body: "The link has expired. Please request a new verification email.",
  },
  invalid: {
    title: "Invalid verification link",
    body: "We could not verify your email. Please double-check the link and try again.",
  },
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, messageKey } = await handleVerification(searchParams);
  const copy = messages[messageKey];

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {copy.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          {copy.body}
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            href={status === "success" ? "/login" : "/register"}
          >
            {status === "success" ? "Go to login" : "Back to register"}
          </Link>
        </div>
      </div>
    </main>
  );
}

async function handleVerification(searchParams: SearchParams) {
  const token = searchParams.token;
  const email = searchParams.email;

  if (!token || !email) {
    return { status: "error", messageKey: "invalid" as const };
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.identifier !== email) {
    return { status: "error", messageKey: "invalid" as const };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { status: "error", messageKey: "expired" as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return { status: "success" as const, messageKey: "success" as const };
}


