"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { AuthCard } from "@/components/forms/auth-card";
import { useApp } from "@/components/providers/app-provider";

export default function RegisterPage() {
  const { signIn } = useApp();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.register(form);
      const token = await api.login({ email: form.email, password: form.password });
      await signIn(token.access_token);
      toast.success("Регистрация завершена");
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось зарегистрироваться";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-screen items-center justify-center py-10">
      <AuthCard
        title="Создание аккаунта"
        subtitle="Регистрация сотрудника занимает меньше минуты. После входа откроются курсы, календарь и личный кабинет."
      >
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <div>
            <label className="label">Имя</label>
            <input className="input" value={form.first_name} onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Фамилия</label>
            <input className="input" value={form.last_name} onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Отчество</label>
            <input className="input" value={form.middle_name} onChange={(e) => setForm((s) => ({ ...s, middle_name: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Пароль</label>
            <input className="input" type="password" minLength={8} value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary h-12 w-full" disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Создать аккаунт"}
            </button>
          </div>
        </form>
        <p className="mt-5 text-sm text-slate-500">
          Уже есть аккаунт?{" "}
          <Link className="font-semibold text-brand-700 hover:text-brand-800" href="/login">
            Войти
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
