"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Filter, Plus, Save, Search, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { Department, User, UserProfileSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const defaultForm = {
  email: "",
  password: "Password123!",
  first_name: "",
  last_name: "",
  middle_name: "",
  role: "employee",
  department_id: "",
  manager_id: "",
  position_title: "",
  team_name: "",
};

export default function PeoplePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [selected, setSelected] = useState<UserProfileSummary | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("");

  async function load() {
    try {
      const [usersData, departmentsData, roles] = await Promise.all([
        api.listUsers(),
        api.listDepartments(),
        api.roleSuggestions(),
      ]);
      setUsers(usersData);
      setDepartments(departmentsData);
      setRoleSuggestions(roles.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить сотрудников");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const managers = useMemo(() => users.filter((user) => user.role === "manager"), [users]);
  const departmentMap = useMemo(() => new Map(departments.map((dep) => [dep.id, dep.name])), [departments]);
  const managerMap = useMemo(
    () => new Map(managers.map((manager) => [manager.id, `${manager.last_name} ${manager.first_name}`.trim()])),
    [managers]
  );

  const teamOptions = useMemo(
    () => Array.from(new Set(users.map((user) => user.team_name).filter(Boolean) as string[])).sort(),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((user) => {
      const text = [
        user.first_name,
        user.last_name,
        user.middle_name || "",
        user.email,
        user.position_title || "",
        user.team_name || "",
        departmentMap.get(user.department_id || "") || "",
        managerMap.get(user.manager_id || "") || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesDepartment = departmentFilter === "all" || user.department_id === departmentFilter;
      const matchesTeam = !teamFilter.trim() || (user.team_name || "").toLowerCase().includes(teamFilter.toLowerCase());
      return matchesSearch && matchesRole && matchesDepartment && matchesTeam;
    });
  }, [users, search, roleFilter, departmentFilter, teamFilter, departmentMap, managerMap]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.createUser({
        ...form,
        department_id: form.department_id || null,
        manager_id: form.manager_id || null,
        middle_name: form.middle_name || null,
        position_title: form.position_title || null,
        team_name: form.team_name || null,
      });
      toast.success("Сотрудник создан");
      setForm(defaultForm);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось создать сотрудника");
    }
  }

  async function saveUser(user: User) {
    try {
      await api.updateUser(user.id, {
        department_id: user.department_id,
        manager_id: user.manager_id,
        team_name: user.team_name,
        position_title: user.position_title,
        role: user.role,
      });
      toast.success("Изменения сохранены");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось сохранить сотрудника");
    }
  }

  async function openProfile(userId: string) {
    try {
      setSelected(await api.userProfileSummary(userId));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось открыть профиль");
    }
  }

  return (
    <AppShell title="Сотрудники и роли">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <section className="card card-pad">
          <div className="flex items-center gap-2 text-slate-900">
            <Plus className="h-4 w-4" />
            <span className="font-semibold">Новый сотрудник</span>
          </div>
          <form className="mt-4 space-y-3" onSubmit={createUser}>
            {[
              ["email", "Email"],
              ["first_name", "Имя"],
              ["last_name", "Фамилия"],
              ["middle_name", "Отчество"],
              ["position_title", "Должность / специализация"],
              ["team_name", "Команда"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  list={key === "position_title" ? "role-suggestions" : undefined}
                  className="input"
                  value={(form as any)[key]}
                  onChange={(e) => setForm((state) => ({ ...state, [key]: e.target.value }))}
                  required={["email", "first_name", "last_name"].includes(key)}
                />
              </div>
            ))}
            <datalist id="role-suggestions">
              {roleSuggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>

            <div>
              <label className="label">Системная роль</label>
              <select className="input" value={form.role} onChange={(e) => setForm((state) => ({ ...state, role: e.target.value }))}>
                <option value="employee">employee</option>
                <option value="manager">manager</option>
                <option value="trainer">trainer</option>
                <option value="hr">hr</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div>
              <label className="label">Отдел</label>
              <select className="input" value={form.department_id} onChange={(e) => setForm((state) => ({ ...state, department_id: e.target.value }))}>
                <option value="">Без отдела</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Менеджер</label>
              <select className="input" value={form.manager_id} onChange={(e) => setForm((state) => ({ ...state, manager_id: e.target.value }))}>
                <option value="">Не назначен</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.last_name} {manager.first_name}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary w-full" type="submit">
              Создать сотрудника
            </button>
          </form>
        </section>

        <section className="card card-pad">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Список сотрудников</h3>
              <p className="mt-1 text-sm text-slate-500">Поиск, фильтры и быстрый просмотр краткой карточки сотрудника.</p>
            </div>
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по ФИО, email, роли, команде"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-[24px] border border-slate-200 p-4 md:grid-cols-3 xl:grid-cols-4">
            <div>
              <label className="label flex items-center gap-2"><Filter className="h-4 w-4" />Роль</label>
              <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">Все роли</option>
                <option value="employee">employee</option>
                <option value="manager">manager</option>
                <option value="trainer">trainer</option>
                <option value="hr">hr</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label className="label">Отдел</label>
              <select className="input" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="all">Все отделы</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Команда</label>
              <input list="teams-list" className="input" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} placeholder="Например: Разработка" />
              <datalist id="teams-list">
                {teamOptions.map((team) => (
                  <option key={team} value={team} />
                ))}
              </datalist>
            </div>
            <div className="flex items-end">
              <button
                className="btn-secondary w-full"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setDepartmentFilter("all");
                  setTeamFilter("");
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-[28px] border border-slate-200 p-4">
                <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr_1fr_auto_auto]">
                  <div>
                    <div className="font-semibold text-slate-900">{user.last_name} {user.first_name} {user.middle_name || ""}</div>
                    <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                    <div className="mt-2 text-xs text-slate-500">Менеджер: {managerMap.get(user.manager_id || "") || "Не назначен"}</div>
                  </div>

                  <div>
                    <label className="label">Должность</label>
                    <input
                      list="role-suggestions"
                      className="input"
                      value={user.position_title || ""}
                      onChange={(e) => setUsers((list) => list.map((item) => item.id === user.id ? { ...item, position_title: e.target.value } : item))}
                      placeholder="Роль в команде"
                    />
                  </div>

                  <div>
                    <label className="label">Команда</label>
                    <input
                      className="input"
                      value={user.team_name || ""}
                      onChange={(e) => setUsers((list) => list.map((item) => item.id === user.id ? { ...item, team_name: e.target.value } : item))}
                      placeholder="Команда"
                    />
                  </div>

                  <div>
                    <label className="label">Отдел</label>
                    <select
                      className="input"
                      value={user.department_id || ""}
                      onChange={(e) => setUsers((list) => list.map((item) => item.id === user.id ? { ...item, department_id: e.target.value || null } : item))}
                    >
                      <option value="">Без отдела</option>
                      {departments.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button className="btn-secondary h-fit w-full xl:w-auto self-end" onClick={() => openProfile(user.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Кратко
                  </button>
                  <button className="btn-secondary h-fit w-full xl:w-auto self-end" onClick={() => saveUser(user)}>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить
                  </button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                По выбранным фильтрам сотрудники не найдены.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-sm sm:p-4">
          <div className="mx-auto mt-2 max-h-[92vh] max-w-4xl overflow-y-auto rounded-[32px] bg-white p-4 shadow-2xl sm:mt-8 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  <UserRound className="h-3.5 w-3.5" /> Краткая карточка сотрудника
                </div>
                <h3 className="mt-3 text-2xl font-bold">{selected.user.full_name}</h3>
                <div className="mt-1 text-sm text-slate-500">
                  {selected.user.position_title || selected.user.role} · {selected.user.department_name || "Без отдела"} · {selected.user.team_name || "Без команды"}
                </div>
                <div className="mt-1 text-sm text-slate-500">{selected.user.email}</div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Активные курсы</div>
                <div className="mt-2 text-3xl font-bold">{selected.stats.active_courses}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Завершено</div>
                <div className="mt-2 text-3xl font-bold">{selected.stats.completed_courses}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Сертификаты</div>
                <div className="mt-2 text-3xl font-bold">{selected.stats.certificates}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Последняя активность</div>
                <div className="mt-2 text-base font-semibold">{formatDateTime(selected.stats.last_activity_at)}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-lg font-bold">Приоритетные курсы сейчас</h4>
                <div className="mt-3 space-y-3">
                  {selected.courses.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                      Сейчас у сотрудника нет активных курсов.
                    </div>
                  ) : selected.courses.map((item) => (
                    <div key={item.enrollment_id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="font-semibold">{item.course_title}</div>
                      <div className="mt-1 text-sm text-slate-500">Статус: {item.status}</div>
                      {item.deadline_at ? <div className="mt-1 text-sm text-slate-500">Ближайший дедлайн: {formatDateTime(item.deadline_at)}</div> : null}
                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.max(item.progress_percent, 6)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold">Сертификаты</h4>
                <div className="mt-3 space-y-3">
                  {selected.certificates.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                      Сертификатов пока нет.
                    </div>
                  ) : selected.certificates.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="font-semibold">{item.issuer_name || "Сертификат"}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.source} · {item.issue_date || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
