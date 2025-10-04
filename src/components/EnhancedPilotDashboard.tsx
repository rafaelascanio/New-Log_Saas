"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Grid as GridIcon,
  List as ListIcon,
  MapPin,
  Plane,
  Search,
  Sun,
  Moon,
  Clock3,
  Navigation,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import {
  DashboardMetrics,
  FlightRow,
  PilotMetricsFull,
} from "@/types/metrics";

const cardClasses = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const chartColors = ["#0ea5e9", "#22c55e", "#f97316", "#6366f1", "#14b8a6", "#f43f5e"];

const motionItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

type PilotWithCategories = PilotMetricsFull & { categories?: string[] };
type FlightWithCategories = FlightRow & { categories?: string[] };

function formatHours(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "0.00";
  return value.toFixed(2);
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function extractCategories(pilot: PilotWithCategories): string[] {
  if (pilot.categories?.length) return pilot.categories;
  const categories = new Set<string>();
  pilot.flights.forEach((flight) => {
    const enriched = flight as FlightWithCategories;
    enriched.categories?.forEach((category) => categories.add(category));
  });
  return Array.from(categories);
}

function buildChartData(pilot: PilotMetricsFull) {
  const ruleTotals = new Map<string, number>();
  pilot.flights.forEach((flight) => {
    const rule = flight.rules?.trim();
    if (!rule) return;
    const normalized = ["IFR", "VFR"].includes(rule.toUpperCase())
      ? rule.toUpperCase()
      : "Other";
    ruleTotals.set(normalized, (ruleTotals.get(normalized) ?? 0) + flight.hours);
  });

  if (ruleTotals.size > 0) {
    return {
      type: "rules" as const,
      data: Array.from(ruleTotals.entries()).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      })),
    };
  }

  const aircraftTotals = new Map<string, number>();
  pilot.flights.forEach((flight) => {
    if (!flight.aircraft) return;
    aircraftTotals.set(
      flight.aircraft,
      (aircraftTotals.get(flight.aircraft) ?? 0) + flight.hours
    );
  });

  return {
    type: "aircraft" as const,
    data: Array.from(aircraftTotals.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    })),
  };
}

function pilotKpis(pilot: PilotMetricsFull) {
  return [
    { label: "Day Hours", value: pilot.dayHours, icon: Sun },
    { label: "Night Hours", value: pilot.nightHours, icon: Moon },
    { label: "PIC Hours", value: pilot.picHours, icon: Plane },
    { label: "SIC Hours", value: pilot.sicHours, icon: Navigation },
    { label: "IFR Hours", value: pilot.ifrHours, icon: Clock3 },
  ].filter((item) => item.value !== undefined && item.value > 0);
}

function formatUpdatedAt(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString();
  }
  return trimmed;
}

function FlightDetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}:</span>
      <span className="text-slate-600">{value}</span>
    </div>
  );
}

function renderFlightExtra(flight: FlightWithCategories) {
  const extras: { label: string; value?: string }[] = [];
  if (flight.role) extras.push({ label: "Role", value: flight.role });
  if (flight.rules) extras.push({ label: "Rules", value: flight.rules });
  if (flight.approachType) {
    extras.push({ label: "Approach", value: flight.approachType });
  }
  if (flight.approachCount !== undefined) {
    extras.push({ label: "Approach Count", value: String(flight.approachCount) });
  }
  if (flight.simulatorType) {
    extras.push({ label: "Simulator", value: flight.simulatorType });
  }
  if (flight.simulatorTime) {
    extras.push({ label: "Simulator Time", value: `${formatHours(flight.simulatorTime)} h` });
  }
  if (flight.crossCountryTime) {
    extras.push({ label: "Cross Country", value: `${formatHours(flight.crossCountryTime)} h` });
  }
  if (flight.soloTime) {
    extras.push({ label: "Solo", value: `${formatHours(flight.soloTime)} h` });
  }
  if (flight.picTime) {
    extras.push({ label: "PIC", value: `${formatHours(flight.picTime)} h` });
  }
  if (flight.sicTime) {
    extras.push({ label: "SIC", value: `${formatHours(flight.sicTime)} h` });
  }
  if (flight.dualReceived) {
    extras.push({ label: "Dual", value: `${formatHours(flight.dualReceived)} h` });
  }
  if (flight.instructorTime) {
    extras.push({ label: "Instructor", value: `${formatHours(flight.instructorTime)} h` });
  }
  if (flight.remarks) {
    extras.push({ label: "Remarks", value: flight.remarks });
  }

  return extras.filter((item) => Boolean(item.value));
}

export default function EnhancedPilotDashboard({
  metrics,
}: {
  metrics: DashboardMetrics;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPilotId, setSelectedPilotId] = useState<string | null>(
    () => metrics.pilots[0]?.id ?? null
  );

  useEffect(() => {
    if (metrics.pilots.length === 0) {
      setSelectedPilotId(null);
      return;
    }
    if (!selectedPilotId || !metrics.pilots.some((pilot) => pilot.id === selectedPilotId)) {
      setSelectedPilotId(metrics.pilots[0]?.id ?? null);
    }
  }, [metrics.pilots, selectedPilotId]);

  const filteredPilots = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return metrics.pilots;
    return metrics.pilots.filter((pilot) => {
      const fields = [
        pilot.name,
        pilot.id,
        pilot.licenseNumber,
        pilot.nationality,
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());
      const matchesField = fields.some((value) => value.includes(term));
      if (matchesField) return true;
      return pilot.flights.some((flight) =>
        flight.aircraftReg?.toLowerCase().includes(term)
      );
    });
  }, [metrics.pilots, searchTerm]);

  useEffect(() => {
    if (filteredPilots.length === 0) {
      setSelectedPilotId(null);
      return;
    }
    if (!filteredPilots.some((pilot) => pilot.id === selectedPilotId)) {
      setSelectedPilotId(filteredPilots[0].id);
    }
  }, [filteredPilots, selectedPilotId]);

  const selectedPilot = useMemo(() => {
    if (!selectedPilotId) return null;
    return metrics.pilots.find((pilot) => pilot.id === selectedPilotId) ?? null;
  }, [metrics.pilots, selectedPilotId]);

  const updatedAt = formatUpdatedAt(metrics.summary.updatedAt);

  const detailPilot = selectedPilot as PilotWithCategories | null;

  const chartData = detailPilot ? buildChartData(detailPilot) : null;

  const recentFlights = useMemo(() => {
    if (!detailPilot) return [] as FlightWithCategories[];
    return [...detailPilot.flights]
      .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
      .slice(0, 8)
      .map((flight) => flight as FlightWithCategories);
  }, [detailPilot]);

  const kpis = detailPilot ? pilotKpis(detailPilot) : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Pilot Logbook Dashboard
          </h1>
          {updatedAt && (
            <p className="text-sm text-slate-500">Last updated: {updatedAt}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${cardClasses} flex items-center gap-4`}
            data-testid="summary-total-flights">
            <div className="rounded-full bg-sky-100 p-3 text-sky-600">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Flights</p>
              <p className="text-2xl font-semibold text-slate-900">
                {metrics.summary.totalFlights.toLocaleString()}
              </p>
            </div>
          </div>
          <div className={`${cardClasses} flex items-center gap-4`}
            data-testid="summary-total-hours">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <Clock3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Hours</p>
              <p className="text-2xl font-semibold text-slate-900">
                {formatHours(metrics.summary.totalHours)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search pilots by name, id, license, nationality or aircraft reg"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            type="search"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">View:</span>
          <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition ${
                viewMode === "grid"
                  ? "bg-sky-500 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              <GridIcon className="h-4 w-4" /> Grid
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition ${
                viewMode === "list"
                  ? "bg-sky-500 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" /> List
            </button>
          </div>
        </div>
      </div>

      <section>
        <AnimatePresence mode="popLayout">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={motionItem}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {filteredPilots.map((pilot) => {
                const categories = extractCategories(pilot as PilotWithCategories);
                const isSelected = pilot.id === selectedPilotId;
                return (
                  <motion.button
                    type="button"
                    key={pilot.id}
                    layout
                    onClick={() => setSelectedPilotId(pilot.id)}
                    className={`${cardClasses} text-left transition ${
                      isSelected ? "ring-2 ring-sky-400" : "hover:border-sky-300"
                    }`}
                    whileHover={{ translateY: -4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-slate-400">Pilot ID</p>
                        <p className="text-sm font-medium text-slate-600">{pilot.id}</p>
                      </div>
                      <div className="rounded-full bg-slate-100 p-2 text-slate-500">
                        <Plane className="h-5 w-5" />
                      </div>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">
                      {pilot.name}
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>
                        <p className="text-xs uppercase text-slate-400">Nationality</p>
                        <p>{pilot.nationality ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">License</p>
                        <p>{pilot.licenseType ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Flights</p>
                        <p className="font-medium">
                          {pilot.totalFlights.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Hours</p>
                        <p className="font-medium">{formatHours(pilot.totalHours)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {pilot.lastFlightDate && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          Last flight: {formatDate(pilot.lastFlightDate)}
                        </span>
                      )}
                      {categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-sky-50 px-3 py-1 text-sky-600"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={motionItem}
              className="space-y-3"
            >
              {filteredPilots.map((pilot) => {
                const categories = extractCategories(pilot as PilotWithCategories);
                const isSelected = pilot.id === selectedPilotId;
                return (
                  <motion.button
                    type="button"
                    key={pilot.id}
                    layout
                    onClick={() => setSelectedPilotId(pilot.id)}
                    className={`${cardClasses} w-full text-left transition ${
                      isSelected ? "ring-2 ring-sky-400" : "hover:border-sky-300"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {pilot.name}
                        </h2>
                        <p className="text-sm text-slate-500">{pilot.id}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                          {pilot.nationality && (
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              {pilot.nationality}
                            </span>
                          )}
                          {pilot.licenseType && (
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              {pilot.licenseType}
                            </span>
                          )}
                          {pilot.licenseNumber && (
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              #{pilot.licenseNumber}
                            </span>
                          )}
                          {categories.map((category) => (
                            <span
                              key={category}
                              className="rounded-full bg-sky-50 px-2 py-1 text-sky-600"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div>
                          <p className="text-xs uppercase text-slate-400">Flights</p>
                          <p className="font-medium">
                            {pilot.totalFlights.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Hours</p>
                          <p className="font-medium">{formatHours(pilot.totalHours)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Last flight</p>
                          <p>{formatDate(pilot.lastFlightDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Aircraft types</p>
                          <p>{pilot.aircraftTypes?.join(", ") ?? "—"}</p>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
        {filteredPilots.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No pilots found for that search.
          </div>
        )}
      </section>

      <AnimatePresence>
        {detailPilot && (
          <motion.section
            key={detailPilot.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="grid gap-6 lg:grid-cols-[2fr,3fr]"
          >
            <div className="space-y-6">
              <div className={cardClasses}>
                <h3 className="text-lg font-semibold text-slate-900">Pilot Identity</h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <FlightDetailRow label="Name" value={detailPilot.name} />
                  <FlightDetailRow label="Pilot ID" value={detailPilot.id} />
                  <FlightDetailRow
                    label="License Number"
                    value={detailPilot.licenseNumber}
                  />
                  <FlightDetailRow
                    label="Nationality"
                    value={detailPilot.nationality}
                  />
                  <FlightDetailRow
                    label="Date of Birth"
                    value={detailPilot.dateOfBirth}
                  />
                  <FlightDetailRow
                    label="License Type"
                    value={detailPilot.licenseType}
                  />
                  <FlightDetailRow
                    label="License Issued"
                    value={detailPilot.licenseIssueDate}
                  />
                  <FlightDetailRow
                    label="License Expiry"
                    value={detailPilot.licenseExpiryDate}
                  />
                </div>
              </div>

              <div className={cardClasses}>
                <h3 className="text-lg font-semibold text-slate-900">
                  Flight Hours Overview
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Total Flights</span>
                    <span className="font-semibold text-slate-900">
                      {detailPilot.totalFlights.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Hours</span>
                    <span className="font-semibold text-slate-900">
                      {formatHours(detailPilot.totalHours)}
                    </span>
                  </div>
                  {detailPilot.lastFlightDate && (
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Last Flight</span>
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <CalendarClock className="h-4 w-4" />
                        {formatDate(detailPilot.lastFlightDate)}
                      </span>
                    </div>
                  )}
                  {detailPilot.aircraftTypes && detailPilot.aircraftTypes.length > 0 && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Aircraft Types:</span>
                      <span className="ml-2">
                        {detailPilot.aircraftTypes.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {kpis.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {kpis.map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-500" />
                          <span>{label}</span>
                        </div>
                        <span className="font-medium text-slate-900">
                          {formatHours(value)} h
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={cardClasses}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Hours Breakdown
                  </h3>
                  <span className="text-xs uppercase text-slate-400">
                    {chartData?.type === "rules" ? "By Rules" : "By Aircraft"}
                  </span>
                </div>
                <div className="mt-4 h-64">
                  {chartData && chartData.data.length > 0 ? (
                    <ResponsiveContainer>
                      {chartData.type === "rules" ? (
                        <PieChart>
                          <Tooltip
                            formatter={(value: number) => `${formatHours(value)} h`}
                          />
                          <Pie
                            data={chartData.data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={4}
                          >
                            {chartData.data.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={chartColors[index % chartColors.length]}
                              />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      ) : (
                        <BarChart data={chartData.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" hide={chartData.data.length > 6} />
                          {chartData.data.length > 6 && (
                            <XAxis
                              dataKey="name"
                              interval={0}
                              angle={-30}
                              dy={20}
                              height={60}
                            />
                          )}
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => `${formatHours(value)} h`}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {chartData.data.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={chartColors[index % chartColors.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No chart data available.
                    </div>
                  )}
                </div>
              </div>

              <div className={cardClasses}>
                <h3 className="text-lg font-semibold text-slate-900">
                  Recent Flights
                </h3>
                <div className="mt-4 space-y-4">
                  {recentFlights.map((flight) => {
                    const extras = renderFlightExtra(flight);
                    return (
                      <div
                        key={`${flight.date}-${flight.aircraftReg}-${flight.route}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <CalendarClock className="h-4 w-4" />
                              <span>{formatDate(flight.date)}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                              {flight.route && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-slate-400" />
                                  {flight.route}
                                </span>
                              )}
                              {flight.aircraft && (
                                <span className="flex items-center gap-1">
                                  <Plane className="h-4 w-4 text-slate-400" />
                                  {flight.aircraft}
                                </span>
                              )}
                              {flight.aircraftReg && (
                                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                                  {flight.aircraftReg}
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-medium text-slate-900">
                                <Clock3 className="h-4 w-4 text-slate-400" />
                                {formatHours(flight.hours)} h
                              </span>
                              {flight.night && (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">
                                  Night
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {extras.length > 0 && (
                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            {extras.map((item) => (
                              item.value ? (
                                <div key={`${item.label}-${item.value}`}>
                                  <span className="font-medium text-slate-700">{item.label}:</span>{" "}
                                  {item.value}
                                </div>
                              ) : null
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {recentFlights.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      No flights available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
