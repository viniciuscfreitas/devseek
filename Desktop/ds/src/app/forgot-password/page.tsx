"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setMessage(null);

    const response = await fetch("/api/password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      setStatus("error");
      setMessage("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }

    setStatus("sent");
    setMessage("Enviamos um link de redefinição caso o e-mail exista.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Informe seu e-mail para receber um link de redefinição.
        </p>
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
          {message && (
            <p
              className={`rounded-md px-3 py-2 text-sm ${
                status === "sent"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
              }`}
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Enviar link
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-300">
          <Link className="font-medium text-zinc-900 dark:text-zinc-100" href="/login">
            Voltar para login
          </Link>
        </p>
      </div>
    </main>
  );
}


