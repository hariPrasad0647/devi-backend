"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { IoIosArrowDown } from "react-icons/io";
import { Poppins } from "next/font/google";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* ---------------- MOCK DATA (UI ONLY) ---------------- */

const MOCK_LEADS_OVER_TIME = [
  { time: "10 am", leads: 4 },
  { time: "11 am", leads: 7 },
  { time: "12 pm", leads: 5 },
  { time: "1 pm", leads: 9 },
  { time: "2 pm", leads: 6 },
  { time: "3 pm", leads: 8 },
];

const MOCK_SALES = [
  { day: "Mon", revenue: 6000 },
  { day: "Tue", revenue: 9000 },
  { day: "Wed", revenue: 7500 },
  { day: "Thu", revenue: 5000 },
  { day: "Fri", revenue: 11000 },
  { day: "Sat", revenue: 8000 },
  { day: "Sun", revenue: 9500 },
];

const MOCK_WEBINARS = [
  { id: 1, date: "2025-11-01", title: "Intro to Parent Coaching", status: "Completed" },
  { id: 2, date: "2025-11-10", title: "Handling Exam Stress", status: "Completed" },
  { id: 3, date: "2025-11-28", title: "Growth Mindset for Kids", status: "Upcoming" },
];

const MOCK_LEADS_REVENUE = 26000;
const MOCK_STUDENTS_REVENUE = 47000;
const COLORS = ["#F97316", "#6B3FA7"];

/* ----------------- SMALL HELPERS ----------------- */

function parseISO(d) {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
}

/* ----------------- MAIN DASHBOARD UI ----------------- */

export default function Dashboard() {
  // header date filter state (UI only)
  const [dateLabel, setDateLabel] = useState("All Dates");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // webinar search / filter state
  const [query, setQuery] = useState("");

  // leads chart preset dropdown
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetLabelState, setPresetLabelState] = useState("Last 12 Hours");

  const totalRevenue = MOCK_LEADS_REVENUE + MOCK_STUDENTS_REVENUE;

  const pieData = useMemo(
    () => [
      { name: "Leads Revenue", value: MOCK_LEADS_REVENUE },
      { name: "Student Revenue", value: MOCK_STUDENTS_REVENUE },
    ],
    []
  );

  // for the stat cards
  const statCards = [
    {
      id: 1,
      value: "122",
      label: "Number of Students",
      bg: "bg-gradient-to-b from-[#D623FE] to-[#A530F2]",
      img: { src: "/images/dashboard/user.png", alt: "students" },
    },
    {
      id: 2,
      value: "48",
      label: "Leads",
      bg: "bg-gradient-to-b from-[#EF5E7A] to-[#D35385]",
      img: { src: "/images/dashboard/users.png", alt: "leads" },
    },
    {
      id: 3,
      value: String(totalRevenue),
      label: "Sales (Total ₹)",
      bg: "bg-gradient-to-b from-[#A0FDD5] to-[#06A561]",
      img: { src: "/images/dashboard/sales.png", alt: "sales" },
    },
    {
      id: 4,
      value: "1",
      label: "Upcoming Webinar",
      bg: "bg-gradient-to-b from-[#6BAAFC] to-[#305FEC]",
      img: { src: "/images/dashboard/laptop.png", alt: "webinar" },
    },
  ];

  /* ----- filter functions (UI only, works on mock webinars) ----- */

  function applyDateFilter() {
    if (filterStart && filterEnd) {
      const s = parseISO(filterStart);
      const e = parseISO(filterEnd);
      if (s && e) {
        setDateLabel(
          `${s.toLocaleString("en-US", { month: "short", day: "2-digit" })} – ${e.toLocaleString(
            "en-US",
            { month: "short", day: "2-digit" }
          )}`
        );
      } else {
        setDateLabel("Custom Range");
      }
    } else {
      setDateLabel("All Dates");
    }
    setFilterOpen(false);
  }

  function clearFilters() {
    setFilterStart("");
    setFilterEnd("");
    setDateLabel("All Dates");
    setFilterOpen(false);
  }

  function selectPreset(label) {
    setPresetOpen(false);
    setPresetLabelState(label);
  }

  const filteredWebinars = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = filterStart ? parseISO(filterStart) : null;
    const end = filterEnd ? parseISO(filterEnd) : null;

    return MOCK_WEBINARS.filter((w) => {
      const d = parseISO(w.date);
      if (start && d && d < start) return false;
      if (end && d && d > end) return false;
      if (!q) return true;
      const t = `${w.title} ${w.status} ${w.date}`.toLowerCase();
      return t.includes(q);
    });
  }, [query, filterStart, filterEnd]);

  const rowClass =
    "rounded-[10px] bg-[#E9EEF9] px-6 py-4 flex items-center justify-between";

  return (
    <div className={`space-y-6 ${poppins.className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold text-[#611F69]">Dashboard</h1>
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-[6px] border px-4 py-2 text-sm shadow-sm"
            style={{
              background: "#FFFFFF",
              borderColor: "#E1E7F5",
              color: "#4B5563",
            }}
          >
            {dateLabel}
            <IoIosArrowDown className="text-gray-500" />
          </button>

          {filterOpen && (
            <div
              className="absolute right-0 z-10 mt-2 w-72 rounded-md border bg-white p-3 shadow-lg"
              style={{ borderColor: "#E1E7F5" }}
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <label className="w-20 text-[#4B5563]">Start</label>
                  <input
                    type="date"
                    className="h-9 flex-1 text-[#374151] rounded border px-2 outline-none"
                    style={{ borderColor: "#E1E7F5" }}
                    value={filterStart}
                    onChange={(e) => setFilterStart(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="w-20 text-[#4B5563]">End</label>
                  <input
                    type="date"
                    className="h-9 flex-1 rounded border text-[#374151] px-2 outline-none"
                    style={{ borderColor: "#E1E7F5" }}
                    value={filterEnd}
                    onChange={(e) => setFilterEnd(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded border px-3 py-1.5 text-xs"
                    style={{ borderColor: "#E1E7F5", color: "#4B5563" }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyDateFilter}
                    className="rounded bg-[#6B3FA7] px-3 py-1.5 text-xs text-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.id}
            className={`h-[84px] rounded-[12px] ${card.bg} shadow-[0_1px_4px_rgba(21,34,50,0.08)] px-6 py-4 flex justify-between items-center`}
          >
            <div className="flex flex-col justify-center">
              <span className="text-[22px] font-bold text-white leading-tight">
                {card.value}
              </span>
              <span className="text-[12px] text-white/90 leading-tight">
                {card.label}
              </span>
            </div>
            <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
              <Image
                src={card.img.src}
                alt={card.img.alt}
                width={26}
                height={26}
                className="object-contain"
                priority
              />
            </div>
          </div>
        ))}
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Leads over time */}
        <div className="lg:col-span-2 rounded-[12px] bg-white p-5 shadow-sm">
          <h3 className="text-[18px] font-semibold text-[#111827]">
            Leads Over Time
          </h3>

          <div className="mt-2 flex items-start justify-between">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-[18px] font-bold text-[#111827] leading-none">
                  {MOCK_LEADS_OVER_TIME.reduce(
                    (a, b) => a + (b.leads || 0),
                    0
                  )}
                </div>
                <div className="text-[12px] text-[#6B7280] mt-1">
                  Leads in selected range
                </div>
              </div>
            </div>

            {/* Preset control (UI only) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPresetOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-[6px] border px-3 py-1.5 text-[12px]"
                style={{
                  background: "#FFFFFF",
                  borderColor: "#E1E7F5",
                  color: "#4B5563",
                }}
              >
                {presetLabelState}{" "}
                <IoIosArrowDown className="text-gray-500 text-[14px]" />
              </button>

              {presetOpen && (
                <div
                  className="absolute right-0 z-20 mt-2 w-48 rounded-md border bg-white p-2 shadow-lg"
                  style={{ borderColor: "#E1E7F5" }}
                >
                  <button
                    onClick={() => selectPreset("Last 12 Hours")}
                    className="w-full text-[#374151] text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Last 12 Hours
                  </button>
                  <button
                    onClick={() => selectPreset("Last 24 Hours")}
                    className="w-full text-[#374151] text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Last 24 Hours
                  </button>
                  <button
                    onClick={() => selectPreset("Last 48 Hours")}
                    className="w-full text-[#374151] text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Last 48 Hours
                  </button>
                  <button
                    onClick={() => selectPreset("Last 7 Days")}
                    className="w-full text-[#374151] text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Last 7 Days
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={MOCK_LEADS_OVER_TIME}
                margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#6B3FA7"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales */}
        <div className="rounded-[12px] bg-white p-5 shadow-sm">
          <h3 className="text-[18px] font-semibold text-[#111827]">Sales</h3>

          <div className="mt-2">
            <div className="mt-1">
              <div className="text-[16px] font-semibold text-[#111827] leading-none">
                ₹{totalRevenue}
              </div>
              <div className="text-[12px] text-[#6B7280] mt-0.5">
                Revenue in selected range (mock data)
              </div>
            </div>
          </div>

          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={MOCK_SALES}
                margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(val) => `₹${val}`} />
                <Bar dataKey="revenue" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-sm text-[#6B7280]">
            <div className="flex items-center justify-between">
              <span>Total Revenue</span>
              <span>₹{totalRevenue}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Leads Revenue</span>
              <span>₹{MOCK_LEADS_REVENUE}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Student Revenue</span>
              <span>₹{MOCK_STUDENTS_REVENUE}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Webinar History + Pie Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Webinar history */}
        <div className="lg:col-span-2 rounded-[12px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#611F69]">
              Webinar History
            </h2>

            <div className="flex items-center gap-3">
              <div
                className="flex h-10 items-center gap-2 rounded-[6px] border px-3"
                style={{
                  background: "#FFFFFF",
                  borderColor: "#E1E7F5",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                    stroke="#9AA3B2"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  placeholder="Search by title or status..."
                  className="w-56 text-sm outline-none placeholder:text-[#9AA3B2]"
                  style={{ color: "#374151", background: "transparent" }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {filteredWebinars.length === 0 && (
              <div className="rounded-[8px] border border-dashed p-6 text-center text-sm text-[#6B7280]">
                No webinars match your filters.
              </div>
            )}

            {filteredWebinars.map((w) => (
              <div key={w.id} className={rowClass}>
                <div className="text-[#252525] text-[18px] font-semibold leading-[20px] w-[140px]">
                  {w.date}
                </div>
                <div className="text-[#252525] text-[18px] font-semibold leading-[20px] flex-1 px-2 truncate">
                  {w.title}
                </div>
                <div className="text-[#252525] text-[18px] font-semibold leading-[20px] w-[80px] text-right">
                  {w.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split Pie */}
        <div className="rounded-[12px] bg-white p-5 shadow-sm">
          <h3 className="text-[18px] font-semibold text-[#111827]">
            Revenue Split
          </h3>

          <div className="mt-3 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={42}
                  label={({ percent }) =>
                    `${Math.round((percent || 0) * 100)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${val}`} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-sm text-[#6B7280]">
            <div className="flex items-center justify-between">
              <span>Leads Revenue</span>
              <span>₹{pieData[0]?.value ?? 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Student Revenue</span>
              <span>₹{pieData[1]?.value ?? 0}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
