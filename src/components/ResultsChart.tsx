"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import type { HadScore } from "@/lib/hads";

export type ResultRow = {
  id: string;
  submitted_at: string;
  anxiety_score: number;
  depression_score: number;
};

type LatestSnapshot = {
  score: HadScore;
  submittedAt: string;
};

export type HistorySummary = {
  latest: LatestSnapshot | null;
  total: number;
  rows: ResultRow[];
};

type Props = {
  userId?: number;
  onLoaded?: (snapshot: HistorySummary) => void;
  refreshToken?: number;
};

export function ResultsChart({ userId, onLoaded, refreshToken }: Props) {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setError("Supabase не настроен. Проверьте переменные окружения.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      const query = supabase
        .from("hads_results")
        .select("id, submitted_at, anxiety_score, depression_score")
        .order("submitted_at", { ascending: true })
        .limit(50);

      const { data, error: selectError } = userId
        ? await query.eq("user_id", userId)
        : await query.is("user_id", null);

      if (selectError) {
        setError("Не удалось получить данные из Supabase.");
        console.error(selectError);
        setIsLoading(false);
        return;
      }

      const safeRows = data ?? [];

      setRows(safeRows);
      setIsLoading(false);

      if (onLoaded) {
        const latestRow = safeRows[safeRows.length - 1];
        onLoaded({
          total: safeRows.length,
          rows: safeRows,
          latest: latestRow
            ? {
                score: {
                  anxiety: latestRow.anxiety_score,
                  depression: latestRow.depression_score
                },
                submittedAt: latestRow.submitted_at
              }
            : null
        });
      }
    }

    load();
  }, [userId, onLoaded, refreshToken]);

  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        date: new Date(row.submitted_at).toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit"
        }),
        anxiety: row.anxiety_score,
        depression: row.depression_score
      })),
    [rows]
  );

  if (isLoading) {
    return <p className="text-sm text-slate-500">Загружаем историю...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (chartData.length === 0) {
    return <p className="text-sm text-slate-500">Пока нет сохранённых результатов.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="anxietyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="depressionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
          <XAxis dataKey="date" stroke="#334155" />
          <YAxis stroke="#334155" domain={[0, 21]} ticks={[0, 7, 14, 21]} />
          <Tooltip formatter={(value: number) => value.toFixed(0)} />
          <Legend />
          <Area
            type="monotone"
            dataKey="anxiety"
            stroke="#0284c7"
            fillOpacity={1}
            fill="url(#anxietyGradient)"
            name="Тревожность"
          />
          <Area
            type="monotone"
            dataKey="depression"
            stroke="#7c3aed"
            fillOpacity={1}
            fill="url(#depressionGradient)"
            name="Депрессия"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
