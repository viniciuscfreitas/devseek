"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEP_TITLES = ["Filtros básicos", "CV e GitHub", "Template base"];

type WizardProps = {
  initialTechStack: string[];
  initialTemplate?: {
    name: string;
    subject: string;
    body: string;
  } | null;
};

const parseStackInput = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function OnboardingWizard({
  initialTechStack,
  initialTemplate,
}: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [techStackInput, setTechStackInput] = useState(
    initialTechStack.join(", "),
  );
  const [seniority, setSeniority] = useState("senior");
  const [salaryMin, setSalaryMin] = useState<number | "">("");
  const [salaryMax, setSalaryMax] = useState<number | "">("");
  const [locations, setLocations] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [templateSubject, setTemplateSubject] = useState(
    initialTemplate?.subject ?? "Application for {job_title}",
  );
  const [templateBody, setTemplateBody] = useState(
    initialTemplate?.body ??
      "Olá {recruiter_name},\n\nSou {my_name}, dev focado em {my_stack}. Vi a vaga de {job_title} e acredito que posso contribuir com {my_skills}. Obrigado!",
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    setError(null);

    if (step === 0) {
      const techStack = parseStackInput(techStackInput).slice(0, 12);
      const payload = {
        techStack,
        seniority,
        salaryRange:
          salaryMin || salaryMax
            ? {
                min: typeof salaryMin === "number" ? salaryMin : undefined,
                max: typeof salaryMax === "number" ? salaryMax : undefined,
                currency: "USD",
              }
            : undefined,
        locations: parseStackInput(locations).slice(0, 10),
      };

      const response = await fetch("/api/profile/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("Não foi possível salvar os filtros.");
        return;
      }
    }

    if (step === 1) {
      if (!cvFile) {
        setError("Faça upload do seu CV para continuar.");
        return;
      }

      const formData = new FormData();
      formData.append("file", cvFile);

      const response = await fetch("/api/profile/cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setError("Não foi possível armazenar o CV.");
        return;
      }
    }

    if (step === 2) {
      setSending(true);
      const response = await fetch("/api/profile/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Default",
          subject: templateSubject,
          body: templateBody,
        }),
      });

      if (!response.ok) {
        setError("Não foi possível salvar o template.");
        setSending(false);
        return;
      }

      await fetch("/api/profile/complete", { method: "POST" });
      setSending(false);
      router.push("/dashboard");
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Passo {step + 1} de 3
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          {STEP_TITLES[step]}
        </h1>
        <div className="mt-8 space-y-4">
          {step === 0 && (
            <>
              <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                Stack desejada (separe por vírgula)
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={techStackInput}
                  onChange={(event) => setTechStackInput(event.target.value)}
                  placeholder="React, Node.js, TypeScript"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                Senioridade
                <select
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={seniority}
                  onChange={(event) => setSeniority(event.target.value)}
                >
                  <option value="mid">Pleno</option>
                  <option value="senior">Sênior</option>
                  <option value="lead">Tech Lead</option>
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  Salário mínimo (USD)
                  <input
                    type="number"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={salaryMin}
                    onChange={(event) =>
                      setSalaryMin(
                        event.target.value
                          ? Number(event.target.value)
                          : "",
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  Salário máximo (USD)
                  <input
                    type="number"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={salaryMax}
                    onChange={(event) =>
                      setSalaryMax(
                        event.target.value
                          ? Number(event.target.value)
                          : "",
                      )
                    }
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                Locais desejados (separe por vírgula)
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={locations}
                  onChange={(event) => setLocations(event.target.value)}
                  placeholder="Remoto, Brasil, EUA"
                />
              </label>
            </>
          )}
          {step === 1 && (
            <>
              <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                Upload do CV (PDF ou DOCX)
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) =>
                    setCvFile(event.target.files?.[0] ?? null)
                  }
                  className="block rounded-lg border border-dashed border-zinc-400 px-3 py-4 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-300"
                />
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                O arquivo fica guardado localmente na pasta{" "}
                <code>storage/</code> e será usado em versões futuras para
                customização automática.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                Assunto padrão
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={templateSubject}
                  onChange={(event) => setTemplateSubject(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                Corpo do e-mail
                <textarea
                  className="min-h-[220px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={templateBody}
                  onChange={(event) => setTemplateBody(event.target.value)}
                />
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Placeholders disponíveis: {"{job_title}"}, {"{company}"},{" "}
                {"{my_skills}"}, {"{my_name}"}, {"{recruiter_name}"}.
              </p>
            </>
          )}
        </div>
        {error && (
          <p className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </p>
        )}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            Voltar
          </button>
          <button
            onClick={handleNext}
            disabled={sending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {step === 2 ? (sending ? "Finalizando..." : "Concluir") : "Avançar"}
          </button>
        </div>
      </div>
    </main>
  );
}

