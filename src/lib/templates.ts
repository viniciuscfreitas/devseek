import type { EmailTemplate } from "@prisma/client";

type TemplateContext = {
  jobTitle: string;
  company?: string | null;
  myName?: string | null;
  mySkills?: string[];
  whyFit?: string;
  recruiterName?: string;
};

const DEFAULT_BODY =
  "Olá {recruiter_name},\n\nSou {my_name} e trabalho com {my_skills}. Vi a vaga de {job_title} na {company} e acredito que posso contribuir com {why_fit}. Vamos conversar?\n\nObrigado,\n{my_name}";

const DEFAULT_SUBJECT = "Candidatura para {job_title} - {my_name}";

const replacer = (template: string, context: TemplateContext) =>
  template
    .replaceAll("{job_title}", context.jobTitle ?? "")
    .replaceAll("{company}", context.company ?? "")
    .replaceAll("{my_name}", context.myName ?? "")
    .replaceAll("{my_skills}", (context.mySkills ?? []).join(", "))
    .replaceAll("{why_fit}", context.whyFit ?? "")
    .replaceAll("{recruiter_name}", context.recruiterName ?? "time de recrutamento");

export const renderEmail = (
  template: EmailTemplate | null | undefined,
  context: TemplateContext,
) => {
  const subject = template?.subject ?? DEFAULT_SUBJECT;
  const body = template?.body ?? DEFAULT_BODY;

  return {
    subject: replacer(subject, context),
    body: replacer(body, context),
  };
};


