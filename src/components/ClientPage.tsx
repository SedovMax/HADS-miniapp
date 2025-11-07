"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HadsForm } from "@/components/HadsForm";
import { ResultsChart, type ResultRow } from "@/components/ResultsChart";
import { getInterpretation } from "@/lib/hads";
import type { HadScore } from "@/lib/hads";

type TelegramUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramWebApp = {
  initDataUnsafe: {
    user?: TelegramUser;
  };
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
  themeParams?: {
    bg_color?: string;
    text_color?: string;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

function useTelegramUser() {
  const [user, setUser] = useState<TelegramUser | undefined>(undefined);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready();
    webApp.expand();
    setUser(webApp.initDataUnsafe?.user);
    webApp.BackButton.hide();
  }, []);

  return user;
}

export function ClientPage() {
  const user = useTelegramUser();
  const [refreshToken, setRefreshToken] = useState(0);
  const [historySnapshot, setHistorySnapshot] = useState<{
    latest: { score: HadScore; submittedAt: string } | null;
    total: number;
  } | null>(null);
  const [historyRows, setHistoryRows] = useState<ResultRow[]>([]);

  const userName = useMemo(() => {
    if (!user) return "гость";
    if (user.username) return `@${user.username}`;
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || "гость";
  }, [user]);

  const handleSaved = useCallback((score: HadScore) => {
    const submittedAt = new Date().toISOString();
    setRefreshToken((token) => token + 1);
    setHistorySnapshot((previous) => ({
      total: (previous?.total ?? 0) + 1,
      latest: {
        score,
        submittedAt
      }
    }));
    setHistoryRows((rows) => [
      ...rows,
      {
        id: `local-${submittedAt}`,
        submitted_at: submittedAt,
        anxiety_score: score.anxiety,
        depression_score: score.depression
      }
    ]);
  }, []);

  const handleHistoryLoaded = useCallback(
    (
      snapshot: {
        latest: { score: HadScore; submittedAt: string } | null;
        total: number;
        rows: ResultRow[];
      }
    ) => {
      setHistorySnapshot({ latest: snapshot.latest, total: snapshot.total });
      setHistoryRows(snapshot.rows);
    },
    []
  );

  const latestScore = historySnapshot?.latest?.score ?? null;
  const latestDateLabel = historySnapshot?.latest?.submittedAt
    ? new Date(historySnapshot.latest.submittedAt).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  const recentHistory = useMemo(() => {
    if (historyRows.length === 0) {
      return [];
    }
    return [...historyRows].slice(-6).reverse();
  }, [historyRows]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 pb-10">
      <header className="rounded-2xl bg-white px-6 py-5 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Мониторинг настроения</h1>
        <p className="mt-1 text-sm text-slate-600">
          Привет, {userName}! Заполните шкалу HADS и отслеживайте динамику тревожности и
          депрессии.
        </p>
        {latestScore && (
          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {latestDateLabel ? `Последний результат от ${latestDateLabel}: ` : "Последний результат: "}
            тревожность {latestScore.anxiety}, депрессия {latestScore.depression}.
          </p>
        )}
      </header>

      <section className="rounded-2xl bg-white px-6 py-5 shadow">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">История результатов</h2>
            <p className="text-sm text-slate-600">
              График ниже всегда доступен: на нём отображается динамика тревожности и депрессии.
            </p>
          </div>
          {historySnapshot && (
            <p className="text-sm text-slate-500">
              Сохранённых результатов: {historySnapshot.total}.
            </p>
          )}
        </div>

        <div className="mt-5">
          <ResultsChart
            userId={user?.id}
            refreshToken={refreshToken}
            onLoaded={handleHistoryLoaded}
          />
        </div>

        {recentHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base font-semibold text-slate-900">Последние записи</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {recentHistory.map((row) => {
                const submittedAt = new Date(row.submitted_at).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-slate-900">{submittedAt}</span>
                    <span className="text-slate-600">
                      Тревожность {row.anxiety_score} ({getInterpretation(row.anxiety_score)}), депрессия {row.depression_score} ({getInterpretation(row.depression_score)}).
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white px-6 py-5 shadow">
        <HadsForm telegramUserId={user?.id} onSubmitted={handleSaved} />
      </section>
    </main>
  );
}
