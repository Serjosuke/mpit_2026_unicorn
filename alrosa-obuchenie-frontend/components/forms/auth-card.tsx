"use client";

import { motion } from "framer-motion";

export function AuthCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card w-full max-w-xl overflow-hidden"
    >
      <div className="bg-mesh border-b border-slate-200 p-8">
        <div className="inline-flex rounded-full bg-slate-950 px-4 py-1 text-xs font-semibold text-white">
          Алроса Обучение
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </motion.div>
  );
}
