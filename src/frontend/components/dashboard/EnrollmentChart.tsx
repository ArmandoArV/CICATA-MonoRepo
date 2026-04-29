"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EnrollmentChartProps {
  data: { month: string; count: number }[];
}

export function EnrollmentChart({ data }: EnrollmentChartProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Crecimiento de Matrícula
        </h3>
        <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 focus:border-[#7A154A] focus:outline-none focus:ring-1 focus:ring-[#7A154A]">
          <option>Semestre 2025-2</option>
          <option>Semestre 2025-1</option>
          <option>Semestre 2024-2</option>
        </select>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7A154A" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7A154A" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#7A154A"
              strokeWidth={2}
              fill="url(#enrollGradient)"
              name="Estudiantes"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
