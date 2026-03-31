"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Save, X, Search } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { Department, User, UserProfileSummary } from "@/lib/types";

const defaultForm = { email: "", password: "Password123!", first_name: "", last_name: "", middle_name: "", role: "employee", department_id: "", manager_id: "", position_title: "", team_name: "" };

export default function PeoplePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [selected, setSelected] = useState<UserProfileSummary | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const [users, departments, roles] = await Promise.all([api.listUsers(), api.listDepartments(), api.roleSuggestions()]);
      setUsers(users); setDepartments(departments); setRoleSuggestions(roles.items);
    } catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить сотрудников"); }
  }

  useEffect(() => { void load(); }, []);
  const managers = useMemo(() => users.filter((user) => user.role === "manager"), [users]);
  const filteredUsers = useMemo(() => users.filter((user) => [user.first_name, user.last_name, user.email, user.position_title || "", user.team_name || ""].join(" ").toLowerCase().includes(search.toLowerCase())), [users, search]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    try { await api.createUser({ ...form, department_id: form.department_id || null, manager_id: form.manager_id || null, middle_name: form.middle_name || null, position_title: form.position_title || null, team_name: form.team_name || null }); toast.success("Сотрудник создан"); setForm(defaultForm); await load(); }
    catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось создать сотрудника"); }
  }

  async function saveUser(user: User) {
    try { await api.updateUser(user.id, { department_id: user.department_id, manager_id: user.manager_id, team_name: user.team_name, position_title: user.position_title, role: user.role }); toast.success("Изменения сохранены"); await load(); }
    catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось сохранить"); }
  }

  async function openProfile(userId: string) {
    try { setSelected(await api.userProfileSummary(userId)); }
    catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось открыть профиль"); }
  }

  return (
    <AppShell title="Сотрудники и роли" subtitle="HR задает роль сотруднику: Android, React, Java, DevOps, аналитик и другие. Это помогает быстрее искать релевантные внешние курсы.">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.28fr]">
        <section className="card card-pad">
          <div className="flex items-center gap-2 text-slate-900"><Plus className="h-4 w-4" />Новый сотрудник</div>
          <form className="mt-4 space-y-3" onSubmit={createUser}>
            {[ ["email", "Email"], ["first_name", "Имя"], ["last_name", "Фамилия"], ["middle_name", "Отчество"], ["position_title", "Роль/специализация"], ["team_name", "Команда"] ].map(([key, label]) => <div key={key}><label className="label">{label}</label><input list={key === "position_title" ? "role-suggestions" : undefined} className="input" value={(form as any)[key]} onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))} required={["email","first_name","last_name"].includes(key)} /></div>)}
            <datalist id="role-suggestions">{roleSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
            <div><label className="label">Системная роль</label><select className="input" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}><option value="employee">employee</option><option value="manager">manager</option><option value="trainer">trainer</option><option value="hr">hr</option></select></div>
            <div><label className="label">Отдел</label><select className="input" value={form.department_id} onChange={(e) => setForm((s) => ({ ...s, department_id: e.target.value }))}><option value="">Без отдела</option>{departments.map((dep)=><option key={dep.id} value={dep.id}>{dep.name}</option>)}</select></div>
            <div><label className="label">Менеджер</label><select className="input" value={form.manager_id} onChange={(e) => setForm((s) => ({ ...s, manager_id: e.target.value }))}><option value="">Не назначен</option>{managers.map((manager)=><option key={manager.id} value={manager.id}>{manager.last_name} {manager.first_name}</option>)}</select></div>
            <button className="btn-primary w-full" type="submit">Создать сотрудника</button>
          </form>
        </section>
        <section className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">Матрица сотрудников</h3>
            <div className="relative w-full max-w-sm"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Быстрый поиск по имени, роли, команде" /></div>
          </div>
          <div className="mt-4 space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-[28px] border border-slate-200 p-4">
                <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr_auto_auto]">
                  <div><div className="font-semibold text-slate-900">{user.last_name} {user.first_name}</div><div className="text-xs text-slate-500">{user.email}</div></div>
                  <input list="role-suggestions" className="input" value={user.position_title || ""} onChange={(e) => setUsers((list) => list.map((item) => item.id === user.id ? { ...item, position_title: e.target.value } : item))} placeholder="Роль в команде" />
                  <input className="input" value={user.team_name || ""} onChange={(e) => setUsers((list) => list.map((item) => item.id === user.id ? { ...item, team_name: e.target.value } : item))} placeholder="Команда" />
                  <select className="input" value={user.department_id || ""} onChange={(e) => setUsers((list) => list.map((item) => item.id === user.id ? { ...item, department_id: e.target.value || null } : item))}><option value="">Без отдела</option>{departments.map((dep)=><option key={dep.id} value={dep.id}>{dep.name}</option>)}</select>
                  <button className="btn-secondary" onClick={() => openProfile(user.id)}><Eye className="mr-2 h-4 w-4" />Профиль</button>
                  <button className="btn-secondary" onClick={() => saveUser(user)}><Save className="mr-2 h-4 w-4" />Сохранить</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selected ? <div className="fixed inset-0 z-50 bg-slate-950/35 p-4 backdrop-blur-sm"><div className="mx-auto mt-8 max-w-4xl rounded-[32px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl font-bold">{selected.user.full_name}</h3><div className="mt-1 text-sm text-slate-500">{selected.user.position_title} · {selected.user.department_name} · {selected.user.team_name}</div></div><button onClick={() => setSelected(null)} className="btn-secondary"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Активные курсы</div><div className="mt-2 text-3xl font-bold">{selected.stats.active_courses}</div></div><div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Завершено</div><div className="mt-2 text-3xl font-bold">{selected.stats.completed_courses}</div></div><div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Сертификаты</div><div className="mt-2 text-3xl font-bold">{selected.stats.certificates}</div></div></div><div className="mt-6 grid gap-6 md:grid-cols-2"><div><h4 className="text-lg font-bold">Курсы</h4><div className="mt-3 space-y-3">{selected.courses.map((item)=><div key={item.enrollment_id} className="rounded-3xl border border-slate-200 p-4"><div className="font-semibold">{item.course_title}</div><div className="mt-1 text-sm text-slate-500">Статус: {item.status}</div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.max(item.progress_percent, 6)}%` }} /></div></div>)}</div></div><div><h4 className="text-lg font-bold">Сертификаты</h4><div className="mt-3 space-y-3">{selected.certificates.map((item)=><div key={item.id} className="rounded-3xl border border-slate-200 p-4"><div className="font-semibold">{item.issuer_name || 'Сертификат'}</div><div className="mt-1 text-sm text-slate-500">{item.source} · {item.issue_date || '—'}</div></div>)}</div></div></div></div></div> : null}
    </AppShell>
  );
}
