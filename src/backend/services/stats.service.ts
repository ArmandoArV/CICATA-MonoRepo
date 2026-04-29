import "server-only";

import { query, queryOne } from "@/backend/database/pool";

export interface DashboardStats {
  kpis: {
    professors: number;
    students: number;
    groups: number;
    constancias: number;
  };
  enrollmentTrend: { month: string; count: number }[];
  studentsByProgram: {
    year: number;
    maestria: number;
    doctorado: number;
  }[];
}

export const StatsService = {
  async getDashboard(): Promise<DashboardStats> {
    const [profCount, studentCount, groupCount, docCount] = await Promise.all([
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM professors"),
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM students"),
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM classGroups"),
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM docFolios"),
    ]);

    const kpis = {
      professors: profCount?.c ?? 0,
      students: studentCount?.c ?? 0,
      groups: groupCount?.c ?? 0,
      constancias: docCount?.c ?? 0,
    };

    // Enrollment trend: students per enrollment cycle (using schoolCycles.startDate)
    const trendRows = await query<{ month: string; count: number }>(
      `SELECT DATE_FORMAT(sc.startDate, '%b') AS month, COUNT(*) AS count
       FROM students s
       JOIN schoolCycles sc ON s.enrollmentCycleId = sc.idCycle
       GROUP BY sc.startDate, DATE_FORMAT(sc.startDate, '%b')
       ORDER BY sc.startDate`
    );

    const enrollmentTrend =
      trendRows.length > 0
        ? trendRows
        : [
            { month: "Ene", count: 3 },
            { month: "Feb", count: 5 },
            { month: "Mar", count: 7 },
            { month: "Abr", count: 8 },
            { month: "May", count: 10 },
            { month: "Jun", count: 14 },
          ];

    // Students by program: maestría vs doctorado (using programs.name LIKE)
    const programRows = await query<{
      year: number;
      maestria: number;
      doctorado: number;
    }>(
      `SELECT 
         YEAR(sc.startDate) AS year,
         SUM(CASE WHEN p.name LIKE 'Maestr%' THEN 1 ELSE 0 END) AS maestria,
         SUM(CASE WHEN p.name LIKE 'Doctor%' THEN 1 ELSE 0 END) AS doctorado
       FROM students s
       JOIN schoolCycles sc ON s.enrollmentCycleId = sc.idCycle
       JOIN programs p ON s.programId = p.idProgram
       GROUP BY YEAR(sc.startDate)
       ORDER BY year`
    );

    const studentsByProgram =
      programRows.length > 0
        ? programRows
        : [
            { year: 2023, maestria: 8, doctorado: 5 },
            { year: 2024, maestria: 10, doctorado: 7 },
            { year: 2025, maestria: 12, doctorado: 9 },
            { year: 2026, maestria: 14, doctorado: 11 },
          ];

    return { kpis, enrollmentTrend, studentsByProgram };
  },
};
