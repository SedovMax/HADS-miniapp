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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scores = useMemo(() => calculateScores(answers), [answers]);
  const currentQuestion = hadsQuestions[currentIndex];
  const totalQuestions = hadsQuestions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isComplete = hadsQuestions.every((question) => answers[question.id] !== undefined);

  function handleSelect(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrorMessage(null);
  }

  function handleNext() {
    const questionId = currentQuestion.id;
    if (answers[questionId] === undefined) {
      setErrorMessage("Выберите вариант ответа, чтобы продолжить.");
      return;
    }

    setErrorMessage(null);

    if (isLastQuestion) {
      setIsSummaryVisible(true);
    } else {
      setCurrentIndex((index) => index + 1);
    }
  }

  function handlePrevious() {
    if (currentIndex === 0) return;
    setCurrentIndex((index) => index - 1);
    setErrorMessage(null);
  }

  function handleEditAnswers() {
    setIsSummaryVisible(false);
    setCurrentIndex(0);
    setSubmissionState("idle");
    setErrorMessage(null);
  }

  function handleRestart() {
    setAnswers({});
    setCurrentIndex(0);
    setIsSummaryVisible(false);
    setSubmissionState("idle");
    setErrorMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

      {!isSummaryVisible ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Вопрос {currentIndex + 1} из {totalQuestions}
            </span>
            <span>
              {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
            </span>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <p className="mb-3 font-medium text-slate-900">
              {currentIndex + 1}. {currentQuestion.text}
            </p>
            <div className="grid gap-2">
              {currentQuestion.options.map((option) => {
                const isActive = answers[currentQuestion.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={clsx(optionButton, isActive && "border-sky-500 bg-sky-50")}
                    onClick={() => handleSelect(currentQuestion.id, option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500"
            >
              {isLastQuestion ? "Показать результат" : "Далее"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl bg-white p-4 shadow">
            <h2 className="text-lg font-semibold text-slate-900">Ваш результат</h2>
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

          <section className="rounded-xl bg-white p-4 shadow">
            <h3 className="text-base font-semibold text-slate-900">Ваши ответы</h3>
            <ol className="mt-3 space-y-3 text-sm text-slate-700">
              {hadsQuestions.map((question, index) => (
                <li key={question.id}>
                  <p className="font-medium text-slate-900">
                    {index + 1}. {question.text}
                  </p>
                  <p className="mt-1 text-slate-600">
                    {
                      question.options.find((option) => option.value === answers[question.id])
                        ?.label
                    }
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEditAnswers}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-800"
              >
                Изменить ответы
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-800"
              >
                Пройти заново
              </button>
            </div>

            <button
              type="submit"
              disabled={submissionState === "submitting"}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submissionState === "submitting" ? "Сохраняем..." : "Сохранить результат"}
            </button>
          </div>

          {submissionState === "success" && (
            <p className="text-sm text-emerald-600">Результат сохранён!</p>
          )}
        </div>
      )}

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
