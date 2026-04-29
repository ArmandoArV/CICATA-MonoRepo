"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface StudentsByProgramChartProps {
  data: { year: number; maestria: number; doctorado: number }[];
}

export function StudentsByProgramChart({ data }: StudentsByProgramChartProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Estudiantes por Programa
        </h3>
        <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 focus:border-[#7A154A] focus:outline-none focus:ring-1 focus:ring-[#7A154A]">
          <option>Anual</option>
          <option>Semestral</option>
        </select>
      </div>
      <div className="w-full" style={{ height: 288 }}>
        <ResponsiveContainer width="100%" height={288}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="year"
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
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }}
            />
            <Bar
              dataKey="maestria"
              name="Maestría"
              fill="#7A154A"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
            <Bar
              dataKey="doctorado"
              name="Doctorado"
              fill="#C9A825"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
