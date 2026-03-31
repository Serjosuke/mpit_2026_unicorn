"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { Certificate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function CertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [number, setNumber] = useState("");

  async function load() {
    setLoading(true);
    try { setItems(await api.myCertificates()); }
    catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить сертификаты"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function upload() {
    if (!file) return toast.error("Выбери PDF или PNG/JPG");
    try {
      await api.uploadCertificate({ source: "manual", issuer_name: issuer, certificate_number: number, issue_date: issueDate, file });
      toast.success("Сертификат загружен");
      setFile(null); setIssuer(""); setIssueDate(""); setNumber("");
      await load();
    } catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить сертификат"); }
  }

  return (
    <AppShell title="Сертификаты" subtitle="Загружай PDF, PNG или JPG, а затем открывай их из профиля и HR-кабинета.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card card-pad">
          <h3 className="text-xl font-bold">Добавить сертификат</h3>
          <div className="mt-4 space-y-4">
            <div><label className="label">Кто выдал сертификат</label><input className="input" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="Например, Алроса LearnFlow" /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">Номер</label><input className="input" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="LF-2026-001" /></div>
              <div><label className="label">Дата выдачи</label><input type="date" className="input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
            </div>
            <div className="rounded-[28px] border border-dashed border-blue-300 bg-blue-50/50 p-5">
              <label className="label">Файл сертификата</label>
              <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <p className="mt-2 text-xs text-slate-500">Поддерживаются PDF, PNG, JPG. Файл можно будет открыть из профиля.</p>
            </div>
            <button onClick={upload} className="btn-primary w-full"><Upload className="mr-2 h-4 w-4" />Загрузить сертификат</button>
          </div>
        </section>
        <section className="card card-pad">
          <h3 className="text-xl font-bold">Мои сертификаты</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {loading ? Array.from({ length: 4 }).map((_,i)=><div key={i} className="rounded-3xl border border-slate-200 p-4"><div className="skeleton h-5 w-32" /><div className="mt-3 skeleton h-4 w-24" /></div>) : null}
            {!loading && items.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Пока сертификатов нет.</div> : null}
            {!loading && items.map((item) => <div key={item.id} className="rounded-[28px] border border-slate-200 p-5"><div className="font-semibold">{item.issuer_name || 'Сертификат обучения'}</div><div className="mt-2 text-sm text-slate-500">Дата выдачи: {formatDate(item.issue_date)}</div><div className="mt-1 text-sm text-slate-500">Номер: {item.certificate_number || '—'}</div>{item.file_url ? <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${item.file_url}`} target="_blank" className="mt-4 inline-flex text-sm font-semibold text-blue-600">Открыть файл</a> : null}</div>)}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
