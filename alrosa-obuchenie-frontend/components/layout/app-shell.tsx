"use client";

import { motion } from "framer-motion";

import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <div className="min-h-screen pb-28 lg:pb-10">
      <Header />
      <main className="container-page pt-4 sm:pt-6">
        <section className="mb-6 rounded-[28px] border border-slate-200 bg-[#0f172a] px-4 py-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)] sm:px-7 sm:py-6">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">ALROSA LearnFlow</div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">{title}</h1>
=======
    <div className="min-h-screen pb-24 lg:pb-10">
      <Header />
      <main className="container-page pt-6">
        <section className="mb-6 rounded-[28px] border border-slate-200 bg-[#0f172a] px-6 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)] sm:px-7">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">ALROSA LearnFlow</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
            {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">{subtitle}</p> : null}
          </div>
        </section>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          {children}
        </motion.div>
      </main>
      <MobileNav />
    </div>
  );
}
