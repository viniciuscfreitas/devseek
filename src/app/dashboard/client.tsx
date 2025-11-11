"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type JobEntry = {
  id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  matchScore: number;
  aiScore: number | null;
  aiSummary: string | null;
  url: string;
  source: string;
  application: {
    id: string;
    status: string;
    generatedEmail?: string | null;
  } | null;
};

type Props = {
  displayName: string;
};

export function DashboardClient({ displayName }: Props) {
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/jobs", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setJobs(data.jobs);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialise = async () => {
      setLoading(true);
      await loadJobs();
      if (active) {
        setLoading(false);
      }
    };

    void initialise();

    return () => {
      active = false;
    };
  }, [loadJobs]);

  const triggerScrape = async () => {
    setLoading(true);
    const response = await fetch("/api/scrape", { method: "POST" });
    if (response.ok) {
      setFlash("Scrape disparado! Atualizando lista.");
      await loadJobs();
    } else {
      setFlash("Não foi possível rodar o scrape agora.");
    }
    setLoading(false);
  };

  const createDraft = async (jobId: string) => {
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (response.ok) {
      await loadJobs();
      setFlash("Rascunho gerado com sucesso.");
    } else {
      setFlash("Erro ao gerar rascunho.");
    }
  };

  const sendApplication = async (applicationId: string) => {
    const to = window.prompt("E-mail do contato ou recrutador:");
    if (!to) return;
    const response = await fetch(`/api/applications/${applicationId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    if (response.ok) {
      setFlash("Candidatura enviada!");
      await loadJobs();
    } else {
      setFlash("Falha ao enviar candidatura.");
    }
  };

  const updateStatus = async (applicationId: string, status: string) => {
    const response = await fetch(
      `/api/applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    if (response.ok) {
      await loadJobs();
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-zinc-950">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Bem-vindo, {displayName.split(" ")[0]}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Revise as oportunidades e gere candidaturas personalizadas.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={triggerScrape}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            disabled={loading}
          >
            {loading ? "Processando..." : "Rodar scrape manual"}
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await loadJobs();
              setLoading(false);
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
          >
            Atualizar
          </button>
        </div>
      </header>

      {flash && (
        <div className="mt-4 rounded-lg bg-emerald-100 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
          {flash}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm text-zinc-700 dark:divide-zinc-800 dark:text-zinc-200">
            <thead className="bg-zinc-100 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 font-medium">Vaga</th>
                <th className="px-4 py-3 font-medium">Match</th>
                <th className="px-4 py-3 font-medium">AI</th>
                <th className="px-4 py-3 font-medium">Fonte</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {jobs.map((job) => (
                <tr key={job.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {job.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {job.company ? `${job.company} • ` : ""}
                      {job.location ?? "Remoto"}
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {job.description}
                    </p>
                    <Link
                      href={job.url}
                      target="_blank"
                      className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-400"
                    >
                      Ver vaga
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
                      {job.matchScore}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                    {job.aiScore != null ? (
                      <div className="space-y-1">
                        <span className="font-medium text-zinc-800 dark:text-zinc-100">
                          {job.aiScore}%
                        </span>
                        {job.aiSummary && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {job.aiSummary}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                    {job.source}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <button
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
                        onClick={() => createDraft(job.id)}
                      >
                        Gerar rascunho
                      </button>
                      {job.application ? (
                        <>
                          <button
                            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            onClick={() => sendApplication(job.application!.id)}
                          >
                            Enviar por e-mail
                          </button>
                          <select
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                            value={job.application.status}
                            onChange={(event) =>
                              updateStatus(job.application!.id, event.target.value)
                            }
                          >
                            <option value="DRAFT">Rascunho</option>
                            <option value="SENT">Enviado</option>
                            <option value="OPENED">Aberto</option>
                            <option value="REPLIED">Respondeu</option>
                            <option value="ARCHIVED">Arquivado</option>
                          </select>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-500">
                          Nenhuma candidatura gerada.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && !loading && (
            <div className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma vaga coletada ainda. Rode um scrape manual para começar.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

