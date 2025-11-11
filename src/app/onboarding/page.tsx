import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { emailTemplates: true },
  });

  if (profile?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<div className="p-12 text-center">Carregando...</div>}>
      <OnboardingWizard
        initialTechStack={
          (profile?.filters as { techStack?: string[] } | null)?.techStack ??
          []
        }
        initialTemplate={profile?.emailTemplates[0]}
      />
    </Suspense>
  );
}

