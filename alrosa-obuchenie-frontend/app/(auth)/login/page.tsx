"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { AuthCard } from "@/components/forms/auth-card";
import { useApp } from "@/components/providers/app-provider";

export default function LoginPage() {
  const { signIn } = useApp();
  const [email, setEmail] = useState("admin@alrosa.com");
  const [password, setPassword] = useState("Admin12345!");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      await signIn(data.access_token);
      toast.success("Вход выполнен");
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось войти";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-screen items-center justify-center py-10">
      <AuthCard
        title="Вход в систему"
        subtitle="Продолжите обучение, откройте курсы, отслеживайте дедлайны и согласования в едином кабинете."
      >
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <button className="btn-primary h-12 w-full" disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Войти"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-500">
          Нет аккаунта?{" "}
          <Link className="font-semibold text-brand-700 hover:text-brand-800" href="/register">
            Зарегистрироваться
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
