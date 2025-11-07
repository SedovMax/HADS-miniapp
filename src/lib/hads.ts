export type HadsQuestion = {
  id: string;
  text: string;
  domain: "anxiety" | "depression";
  options: { value: number; label: string }[];
};

export const hadsQuestions: HadsQuestion[] = [
  {
    id: "a1",
    text: "Я испытываю напряжённость или беспокойство.",
    domain: "anxiety",
    options: [
      { value: 3, label: "Почти всё время" },
      { value: 2, label: "Часто" },
      { value: 1, label: "Иногда" },
      { value: 0, label: "Совсем нет" }
    ]
  },
  {
    id: "d1",
    text: "Я всё ещё способен получать удовольствие от того, что меня радовало раньше.",
    domain: "depression",
    options: [
      { value: 0, label: "Определённо так же" },
      { value: 1, label: "Не так сильно, как раньше" },
      { value: 2, label: "Только немного" },
      { value: 3, label: "Совсем нет" }
    ]
  },
  {
    id: "a2",
    text: "У меня бывают ощущения паники или страха.",
    domain: "anxiety",
    options: [
      { value: 3, label: "Очень часто" },
      { value: 2, label: "Довольно часто" },
      { value: 1, label: "Иногда" },
      { value: 0, label: "Почти никогда" }
    ]
  },
  {
    id: "d2",
    text: "Я могу наслаждаться хорошей книгой, радио- или телепередачей.",
    domain: "depression",
    options: [
      { value: 0, label: "Часто" },
      { value: 1, label: "Иногда" },
      { value: 2, label: "Редко" },
      { value: 3, label: "Очень редко" }
    ]
  },
  {
    id: "a3",
    text: "Я чувствую беспокойство, как будто мне вот-вот случится что-то ужасное.",
    domain: "anxiety",
    options: [
      { value: 3, label: "Определённо и очень сильно" },
      { value: 2, label: "Да, но не слишком сильно" },
      { value: 1, label: "Немного, но не беспокоит" },
      { value: 0, label: "Совсем не чувствую" }
    ]
  },
  {
    id: "d3",
    text: "Мне трудно находить удовольствие в том, что я делал раньше.",
    domain: "depression",
    options: [
      { value: 3, label: "Определённо трудно" },
      { value: 2, label: "Да, иногда" },
      { value: 1, label: "Не очень" },
      { value: 0, label: "Совсем нет" }
    ]
  },
  {
    id: "a4",
    text: "У меня возникают неприятные ощущения, например, сердцебиение, дрожь или потливость.",
    domain: "anxiety",
    options: [
      { value: 3, label: "Очень часто" },
      { value: 2, label: "Довольно часто" },
      { value: 1, label: "Иногда" },
      { value: 0, label: "Почти никогда" }
    ]
  },
  {
    id: "d4",
    text: "Я умею посмеяться и увидеть смешную сторону вещей.",
    domain: "depression",
    options: [
      { value: 0, label: "Как и всегда" },
      { value: 1, label: "Не так уж много" },
      { value: 2, label: "Довольно редко" },
      { value: 3, label: "Совсем не умею" }
    ]
  },
  {
    id: "a5",
    text: "Я чувствую беспокойство при мысли о возможных неприятностях.",
    domain: "anxiety",
    options: [
      { value: 3, label: "Очень сильно" },
      { value: 2, label: "Сильно" },
      { value: 1, label: "Немного" },
      { value: 0, label: "Совсем нет" }
    ]
  },
  {
    id: "d5",
    text: "Я могу ждать с чувством радости и восторга.",
    domain: "depression",
    options: [
      { value: 0, label: "Как и всегда" },
      { value: 1, label: "Чуть меньше, чем раньше" },
      { value: 2, label: "Определённо меньше" },
      { value: 3, label: "Почти совсем не могу" }
    ]
  },
  {
    id: "a6",
    text: "Мне становится трудно расслабиться.",
    domain: "anxiety",
    options: [
      { value: 3, label: "Очень трудно" },
      { value: 2, label: "Довольно трудно" },
      { value: 1, label: "Иногда" },
      { value: 0, label: "Совсем нет" }
    ]
  },
  {
    id: "d6",
    text: "Я чувствую себя энергичным.",
    domain: "depression",
    options: [
      { value: 0, label: "Очень часто" },
      { value: 1, label: "Часто" },
      { value: 2, label: "Иногда" },
      { value: 3, label: "Очень редко" }
    ]
  },
  {
    id: "a7",
    text: "У меня появляется внезапное чувство паники.",
    domain: "anxiety",
    options: [
      { value: 3, label: "Очень часто" },
      { value: 2, label: "Часто" },
      { value: 1, label: "Иногда" },
      { value: 0, label: "Совсем редко" }
    ]
  },
  {
    id: "d7",
    text: "Я теряю интерес к уходу за своим внешним видом.",
    domain: "depression",
    options: [
      { value: 3, label: "Определённо" },
      { value: 2, label: "Да, иногда" },
      { value: 1, label: "Не очень" },
      { value: 0, label: "Совсем нет" }
    ]
  }
];

export type HadScore = {
  anxiety: number;
  depression: number;
};

export function calculateScores(values: Record<string, number>): HadScore {
  return hadsQuestions.reduce(
    (acc, question) => {
      const value = values[question.id] ?? 0;
      if (question.domain === "anxiety") {
        acc.anxiety += value;
      } else {
        acc.depression += value;
      }
      return acc;
    },
    { anxiety: 0, depression: 0 }
  );
}

export function getInterpretation(score: number): string {
  if (score <= 7) return "Норма";
  if (score <= 10) return "Пограничное состояние";
  return "Выраженная симптоматика";
}
