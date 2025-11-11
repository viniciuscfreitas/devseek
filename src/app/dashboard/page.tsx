import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  if (!profile || !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  return <DashboardClient displayName={profile.user?.name ?? "Scout"} />;
}

