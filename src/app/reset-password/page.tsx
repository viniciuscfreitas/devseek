"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas precisam coincidir.");
      return;
    }

    const response = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(
        typeof data?.error === "string"
          ? data.error
          : "Não foi possível redefinir a senha.",
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (!token || !email) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-zinc-950">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-red-300">
          Link inválido. Solicite uma nova redefinição de senha.
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Definir nova senha
        </h1>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Nova senha
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Confirmar nova senha
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              Senha redefinida com sucesso! Redirecionando para login...
            </p>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Salvar nova senha
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-zinc-950">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Carregando página de redefinição...
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
