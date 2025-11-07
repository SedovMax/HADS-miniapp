"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { calculateScores, getInterpretation, hadsQuestions } from "@/lib/hads";
import { supabase } from "@/lib/supabaseClient";
import type { HadScore } from "@/lib/hads";

type SubmissionState = "idle" | "submitting" | "success" | "error";

type Props = {
  onSubmitted: (score: HadScore) => Promise<void> | void;
  telegramUserId?: number;
};

const optionButton = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400";

export function HadsForm({ onSubmitted, telegramUserId }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scores = useMemo(() => calculateScores(answers), [answers]);

  function handleSelect(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isComplete = hadsQuestions.every((question) => answers[question.id] !== undefined);
    if (!isComplete) {
      setErrorMessage("Ответьте на все вопросы, прежде чем сохранять результат.");
      return;
    }

    if (!supabase) {
      setErrorMessage("Supabase не настроен. Проверьте переменные окружения.");
      return;
    }

    setSubmissionState("submitting");
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      const payload = {
        user_id: telegramUserId ?? null,
        submitted_at: now,
        anxiety_score: scores.anxiety,
        depression_score: scores.depression,
        raw_answers: answers
      };

      const { error } = await supabase.from("hads_results").insert(payload);

      if (error) {
        throw error;
      }

      setSubmissionState("success");
      await onSubmitted(scores);
    } catch (error) {
      console.error(error);
      setSubmissionState("error");
      setErrorMessage(
        "Не удалось сохранить результат. Проверьте настройки Supabase и попробуйте ещё раз."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">Тест HADS</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ответьте на вопросы за последнюю неделю. Варианты расположены по убыванию
          благоприятности.
        </p>
      </section>

      <ol className="space-y-5">
        {hadsQuestions.map((question, index) => (
          <li key={question.id} className="rounded-xl bg-white p-4 shadow">
            <p className="mb-3 font-medium text-slate-900">
              {index + 1}. {question.text}
            </p>
            <div className="grid gap-2">
              {question.options.map((option) => {
                const isActive = answers[question.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={clsx(optionButton, isActive && "border-sky-500 bg-sky-50")}
                    onClick={() => handleSelect(question.id, option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Текущие результаты</h2>
        <dl className="mt-3 grid gap-2 text-sm text-slate-700">
          <div className="flex justify-between">
            <dt>Тревожность:</dt>
            <dd>
              {scores.anxiety} — {getInterpretation(scores.anxiety)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Депрессия:</dt>
            <dd>
              {scores.depression} — {getInterpretation(scores.depression)}
            </dd>
          </div>
        </dl>
      </section>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={submissionState === "submitting"}
        className="w-full rounded-lg bg-sky-600 px-4 py-3 text-base font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submissionState === "submitting" ? "Сохраняем..." : "Сохранить результат"}
      </button>
      {submissionState === "success" && (
        <p className="text-sm text-emerald-600">Результат сохранён!</p>
      )}
    </form>
  );
}
