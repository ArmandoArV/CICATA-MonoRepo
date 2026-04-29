"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import {
  StatCard,
  EnrollmentChart,
  StudentsByProgramChart,
} from "@/frontend/components/dashboard";
import {
  faChalkboardTeacher,
  faUserGraduate,
  faLayerGroup,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";

interface DashboardData {
  kpis: {
    professors: number;
    students: number;
    groups: number;
    constancias: number;
  };
  enrollmentTrend: { month: string; count: number }[];
  studentsByProgram: { year: number; maestria: number; doctorado: number }[];
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch("/api/stats/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A154A] border-t-transparent" />
      </div>
    );
  }

  const kpis = data?.kpis ?? { professors: 0, students: 0, groups: 0, constancias: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel Académico</h1>
        <p className="mt-1 text-gray-500">
          Visualiza las estadísticas del centro de investigación.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={faChalkboardTeacher}
          iconColor="#7A154A"
          iconBg="#fce4ec"
          value={kpis.professors}
          label="Profesores"
        />
        <StatCard
          icon={faUserGraduate}
          iconColor="#C9A825"
          iconBg="#fff8e1"
          value={kpis.students}
          label="Estudiantes"
        />
        <StatCard
          icon={faLayerGroup}
          iconColor="#1565c0"
          iconBg="#e3f2fd"
          value={kpis.groups}
          label="Grupos"
        />
        <StatCard
          icon={faFileAlt}
          iconColor="#7A154A"
          iconBg="#fce4ec"
          value={kpis.constancias}
          label="Constancias"
        />
      </div>

      {/* Charts */}
      <EnrollmentChart data={data?.enrollmentTrend ?? []} />
      <StudentsByProgramChart data={data?.studentsByProgram ?? []} />
    </div>
  );
}
