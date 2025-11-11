"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(
        result.error === "EMAIL_NOT_VERIFIED"
          ? "Confirme seu e-mail antes de entrar."
          : "Credenciais inválidas.",
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Entrar
        </h1>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Email
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Senha
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="mt-6 space-y-2 text-center text-sm text-zinc-600 dark:text-zinc-300">
          <Link className="font-medium text-zinc-900 dark:text-zinc-100" href="/forgot-password">
            Esqueci minha senha
          </Link>
          <p>
            Ainda não tem conta?{" "}
            <Link className="font-medium text-zinc-900 dark:text-zinc-100" href="/register">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

