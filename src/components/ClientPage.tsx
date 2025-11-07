"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { HadsForm } from "@/components/HadsForm";
import { ResultsChart } from "@/components/ResultsChart";
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
  const [lastScore, setLastScore] = useState<HadScore | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  const userName = useMemo(() => {
    if (!user) return "гость";
    if (user.username) return `@${user.username}`;
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || "гость";
  }, [user]);

  const handleSaved = useCallback((score: HadScore) => {
    setRefreshToken((token) => token + 1);
    setLastScore(score);
    setIsHistoryExpanded(true);
  }, []);

  const handleHistoryLoaded = useCallback((score: HadScore | null) => {
    setLastScore(score);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 pb-10">
      <header className="rounded-2xl bg-white px-6 py-5 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Мониторинг настроения</h1>
        <p className="mt-1 text-sm text-slate-600">
          Привет, {userName}! Заполните шкалу HADS и отслеживайте динамику тревожности и
          депрессии.
        </p>
        {lastScore && (
          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Последний результат: тревожность {lastScore.anxiety}, депрессия {lastScore.depression}.
          </p>
        )}
      </header>

      <section className="rounded-2xl bg-white px-6 py-5 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">История результатов</h2>
            <p className="text-sm text-slate-600">
              Посмотрите динамику тревожности и депрессии за последние заполнения.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsHistoryExpanded((value) => !value)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-800"
          >
            {isHistoryExpanded ? "Скрыть график" : "Показать график"}
          </button>
        </div>

        <div
          className={clsx(
            "mt-5 overflow-hidden transition-all",
            isHistoryExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {isHistoryExpanded && (
            <div className="pt-1">
              <ResultsChart
                userId={user?.id}
                refreshToken={refreshToken}
                onLoaded={handleHistoryLoaded}
              />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white px-6 py-5 shadow">
        <HadsForm telegramUserId={user?.id} onSubmitted={handleSaved} />
      </section>
    </main>
  );
}
