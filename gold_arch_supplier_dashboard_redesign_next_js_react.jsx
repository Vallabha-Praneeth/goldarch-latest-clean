import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  CheckCircle2,
  CircleHelp,
  LayoutGrid,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Gold.Arch — Supplier Dashboard (UI-focused redesign)
 *
 * Drop this into a Next.js page or route (e.g. /app/dashboard/page.tsx) and wire real data.
 *
 * Goals:
 * - Reduce visual density
 * - Improve contrast & hierarchy
 * - Strong zero-states + clear primary action
 * - Make navigation/intent obvious
 */

type Category = {
  id: string;
  name: string;
  suppliersCount: number;
};

type SupplierStats = {
  totalSuppliers: number;
  categoriesCount: number;
  verifiedSuppliers: number;
  ratedSuppliers: number;
  avgRating: number | null;
  updatedAtLabel?: string; // e.g., "Updated live" or timestamp
};

// ---- Replace this with your API / server data ----
const demo: { stats: SupplierStats; categories: Category[] } = {
  stats: {
    totalSuppliers: 70,
    categoriesCount: 6,
    verifiedSuppliers: 0,
    ratedSuppliers: 0,
    avgRating: null,
    updatedAtLabel: "Updated live",
  },
  categories: [
    { id: "kitchen", name: "Kitchen/Wardrobe Cabinets", suppliersCount: 16 },
    { id: "canton", name: "Canton Fair", suppliersCount: 14 },
    { id: "prefs", name: "Personal Preferences", suppliersCount: 12 },
    { id: "panels", name: "Door and Wall Panels", suppliersCount: 12 },
    { id: "doors", name: "Main Doors", suppliersCount: 9 },
    { id: "led", name: "LED Lighting", suppliersCount: 7 },
  ],
};

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function formatRating(v: number | null) {
  if (v === null || Number.isNaN(v)) return "—";
  return v.toFixed(1);
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">
          {title}
        </h2>
        {hint ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:bg-white/5 hover:text-slate-100"
                  aria-label="Help"
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{hint}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn";
}) {
  const ring =
    tone === "good"
      ? "ring-emerald-500/25"
      : tone === "warn"
      ? "ring-amber-500/25"
      : "ring-white/10";

  return (
    <Card className={`bg-white/5 border-white/10 ring-1 ${ring}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              {label}
            </p>
            <p className="text-2xl font-semibold text-slate-100">{value}</p>
            {sub ? <p className="text-sm text-slate-300">{sub}</p> : null}
          </div>
          <div className="rounded-xl bg-white/5 p-2 text-slate-100">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  title,
  desc,
  primary,
  secondary,
}: {
  title: string;
  desc: string;
  primary?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
      <div className="mb-4 rounded-2xl bg-white/5 p-3 text-slate-100">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-300">{desc}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {primary ? (
          <Button onClick={primary.onClick} className="rounded-xl">
            {primary.label}
          </Button>
        ) : null}
        {secondary ? (
          <Button
            onClick={secondary.onClick}
            variant="secondary"
            className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/15"
          >
            {secondary.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function SupplierDashboardRedesign() {
  const [q, setQ] = useState("");

  const stats = demo.stats;
  const categories = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return demo.categories;
    return demo.categories.filter((c) => c.name.toLowerCase().includes(needle));
  }, [q]);

  const verifiedPct = pct(stats.verifiedSuppliers, stats.totalSuppliers);
  const ratedPct = pct(stats.ratedSuppliers, stats.totalSuppliers);

  const chartData = useMemo(
    () =>
      demo.categories
        .slice()
        .sort((a, b) => b.suppliersCount - a.suppliersCount)
        .map((c) => ({ name: c.name, suppliers: c.suppliersCount })),
    []
  );

  // Hook these up to your router / actions
  const goAllSuppliers = () => console.log("Navigate: /suppliers");
  const goAddSupplier = () => console.log("Navigate: /suppliers/new");
  const goVerifyFlow = () => console.log("Navigate: /verification");
  const goRatingsFlow = () => console.log("Navigate: /ratings");

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Supplier Atlas
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Trusted Supply Network</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
                Operational Overview
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Track suppliers, verification coverage, and rating adoption. Focus on
                what needs action today.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/10">
                {stats.updatedAtLabel ?? ""}
              </Badge>
              <Button
                variant="secondary"
                className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/15"
                onClick={goAllSuppliers}
              >
                <Users className="mr-2 h-4 w-4" />
                View suppliers
              </Button>
              <Button className="rounded-xl" onClick={goAddSupplier}>
                <Plus className="mr-2 h-4 w-4" />
                Add supplier
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiCard
              icon={<Users className="h-5 w-5" />}
              label="Total suppliers"
              value={String(stats.totalSuppliers)}
              sub={`Across ${stats.categoriesCount} categories`}
            />
            <KpiCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Verified"
              value={`${verifiedPct}%`}
              sub={`${stats.verifiedSuppliers} verified`}
              tone={verifiedPct > 50 ? "good" : "warn"}
            />
            <KpiCard
              icon={<Star className="h-5 w-5" />}
              label="Rated"
              value={`${ratedPct}%`}
              sub={`${stats.ratedSuppliers} rated`}
              tone={ratedPct > 50 ? "good" : "warn"}
            />
            <KpiCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Avg rating"
              value={formatRating(stats.avgRating)}
              sub={stats.ratedSuppliers ? "Across rated suppliers" : "No ratings yet"}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Categories */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle
                    title="Categories"
                    hint="Use categories to browse suppliers quickly. Keep them clean and mutually exclusive where possible."
                  />
                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search categories…"
                      className="h-10 rounded-xl border-white/10 bg-slate-950/40 pl-9 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      className="flex w-full items-center justify-between gap-3 bg-white/0 px-4 py-4 text-left hover:bg-white/5"
                      onClick={() => console.log("Open category", c.id)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {c.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {c.suppliersCount} suppliers
                        </p>
                      </div>
                      <Badge className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/10">
                        {c.suppliersCount}
                      </Badge>
                    </button>
                  ))}
                  {!categories.length ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">
                      No categories match “{q}”.
                    </div>
                  ) : null}
                </div>

                {/* Quick actions inside the card */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/15"
                    onClick={goAllSuppliers}
                  >
                    View all suppliers
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/15"
                    onClick={goAddSupplier}
                  >
                    Add supplier
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Zero-state nudges */}
            {(stats.verifiedSuppliers === 0 || stats.ratedSuppliers === 0) && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {stats.verifiedSuppliers === 0 ? (
                  <EmptyState
                    title="No suppliers verified yet"
                    desc="Start with a lightweight verification flow (documents + contact confirmation). Verified coverage unlocks trust signals across the product."
                    primary={{ label: "Verify first supplier", onClick: goVerifyFlow }}
                    secondary={{ label: "Import verification list", onClick: () => console.log("Import") }}
                  />
                ) : null}
                {stats.ratedSuppliers === 0 ? (
                  <EmptyState
                    title="No ratings yet"
                    desc="Ratings drive supplier prioritization. Add a quick 10-second rating prompt after each procurement interaction."
                    primary={{ label: "Collect first rating", onClick: goRatingsFlow }}
                    secondary={{ label: "Set rating reminders", onClick: () => console.log("Reminders") }}
                  />
                ) : null}
              </div>
            )}
          </div>

          {/* Right: Visuals */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <SectionTitle
                  title="Top categories"
                  hint="This view is most useful when the chart drives an action: rebalance sourcing, add alternates, or audit risk."
                />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fill: "#cbd5e1", fontSize: 12 }}
                      />
                      <RTooltip
                        cursor={{ fill: "rgba(255,255,255,0.06)" }}
                        contentStyle={{
                          background: "rgba(2,6,23,0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#e2e8f0",
                        }}
                      />
                      <Bar dataKey="suppliers" radius={[10, 10, 10, 10]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Verified ratio
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">
                      {verifiedPct}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {stats.verifiedSuppliers} / {stats.totalSuppliers}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Rating coverage
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">
                      {ratedPct}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {stats.ratedSuppliers} / {stats.totalSuppliers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <SectionTitle
                  title="Today’s focus"
                  hint="A dashboard should tell the user exactly what to do next. Keep this section opinionated."
                />
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-medium text-slate-100">
                    1) Verify your first 5 suppliers
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Start with the categories that drive the most projects.
                  </p>
                  <div className="mt-3">
                    <Button className="rounded-xl" onClick={goVerifyFlow}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Start verification
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-medium text-slate-100">
                    2) Collect ratings after each interaction
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Add a simple 1–5 score + short note. Takes 10 seconds.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/15"
                      onClick={goRatingsFlow}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Collect ratings
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-xl bg-white/10 text-slate-100 hover:bg-white/15"
                      onClick={() => console.log("Open settings")}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Add governance rules
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} Gold.Arch Construction. All rights reserved.
        </div>
      </div>
    </div>
  );
}
