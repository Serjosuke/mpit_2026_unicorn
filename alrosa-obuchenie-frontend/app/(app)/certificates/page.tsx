"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api";
import type { Certificate, Enrollment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    enrollment_id: "",
    external_request_id: "",
    certificate_number: "",
    issue_date: "",
    issuer_name: "",
    verification_url: ""
  });

  async function load() {
    setLoading(true);
    try {
      const [certificates, enrollments] = await Promise.all([api.myCertificates(), api.myEnrollments()]);
      setCertificates(certificates);
      setEnrollments(enrollments.filter((item) => item.source === "external_approved"));
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить сертификаты";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const externalEnrollmentOptions = useMemo(() => {
    return enrollments.map((item) => ({
      id: item.id,
      label: `Enrollment ${item.id.slice(0, 8)}`
    }));
  }, [enrollments]);

  async function createExternalCertificate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      await api.createCertificate({
        enrollment_id: form.enrollment_id || null,
        external_request_id: form.external_request_id || null,
        certificate_number: form.certificate_number || null,
        issue_date: form.issue_date || null,
        issuer_name: form.issuer_name || null,
        verification_url: form.verification_url || null,
        source: "external"
      });
      toast.success("Сертификат сохранён");
      setForm({
        enrollment_id: "",
        external_request_id: "",
        certificate_number: "",
        issue_date: "",
        issuer_name: "",
        verification_url: ""
      });
      await load();
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось сохранить сертификат";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title="Сертификаты" subtitle="История сертификатов по внутренним и внешним программам обучения">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="card card-pad">
                <div className="skeleton h-5 w-36" />
                <div className="mt-3 skeleton h-4 w-full" />
              </div>
            ))
          ) : certificates.length === 0 ? (
            <EmptyState
              title="Сертификатов пока нет"
              description="После завершения внутреннего курса сертификат создаётся автоматически. Для внешнего обучения его можно добавить вручную."
            />
          ) : (
            certificates.map((certificate) => (
              <div key={certificate.id} className="card card-pad">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-brand-50 p-3 text-brand-700">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Сертификат #{certificate.id.slice(0, 8)}</h3>
                    <p className="text-sm text-slate-500">
                      Источник: {certificate.source} · Дата выдачи: {formatDate(certificate.issue_date || certificate.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="card card-pad">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-3xl bg-slate-950 p-3 text-white">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Добавить внешний сертификат</h3>
              <p className="text-sm text-slate-500">Пока без upload файлов, но с полями для хранения метаданных</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={createExternalCertificate}>
            <div>
              <label className="label">Enrollment внешнего курса</label>
              <select className="input" value={form.enrollment_id} onChange={(e) => setForm((s) => ({ ...s, enrollment_id: e.target.value }))}>
                <option value="">Не выбран</option>
                {externalEnrollmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Номер сертификата</label>
              <input className="input" value={form.certificate_number} onChange={(e) => setForm((s) => ({ ...s, certificate_number: e.target.value }))} />
            </div>
            <div>
              <label className="label">Дата выдачи</label>
              <input className="input" type="date" value={form.issue_date} onChange={(e) => setForm((s) => ({ ...s, issue_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Кем выдан</label>
              <input className="input" value={form.issuer_name} onChange={(e) => setForm((s) => ({ ...s, issuer_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ссылка проверки</label>
              <input className="input" value={form.verification_url} onChange={(e) => setForm((s) => ({ ...s, verification_url: e.target.value }))} />
            </div>
            <button className="btn-primary h-12 w-full" disabled={creating}>
              {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Сохранить сертификат"}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
