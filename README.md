# Telegram HADS Mini App

Веб-приложение для прохождения теста HADS внутри Telegram-бота. Приложение сохраняет результаты в Supabase и визуализирует динамику тревожности и депрессии.

## Основные возможности
- Поддержка Telegram Web App — открывается из кнопки существующего бота.
- Прохождение 14 вопросов шкалы HADS.
- Автоматический расчёт баллов тревожности и депрессии, интерпретация результатов.
- Сохранение ответов в таблицу `hads_results` в Supabase.
- График с историей значений для конкретного пользователя.

## Стек
- [Next.js 14 (App Router)](https://nextjs.org/docs/app) + React 18
- [Supabase](https://supabase.com/) для хранения данных
- [Recharts](https://recharts.org/en-US/) для визуализации

## 1. Подготовка репозитория
1. Создайте новый публичный или приватный репозиторий на GitHub.
2. Подключите удалённый репозиторий и отправьте код:
   ```bash
   git remote add origin git@github.com:<ваш-логин>/<ваш-репозиторий>.git
   git add .
   git commit -m "Initial HADS mini app"
   git push -u origin main
   ```

## 2. Настройка Supabase
1. Войдите в Supabase и создайте новый проект (если ещё не сделали). Запомните `Project URL` и `anon public key` — они понадобятся позже.
2. Откройте вкладку **SQL Editor** и выполните скрипт ниже для создания таблицы и политик безопасности:
   ```sql
   create table if not exists public.hads_results (
     id uuid primary key default gen_random_uuid(),
     user_id bigint,
     submitted_at timestamptz not null,
     anxiety_score smallint not null,
     depression_score smallint not null,
     raw_answers jsonb not null,
     inserted_at timestamptz not null default timezone('utc', now())
   );

   alter table public.hads_results enable row level security;

   create policy "Allow anonymous inserts"
     on public.hads_results for insert
     with check (auth.role() = 'anon');

   create policy "Allow anonymous selects"
     on public.hads_results for select
     using (auth.role() = 'anon');
   ```

   > ⚠️ Приведённая политика select разрешает чтение всем анонимным пользователям. Если вам нужно ограничить доступ, добавьте [кастомную аутентификацию](https://supabase.com/docs/guides/auth/server-side/telegram) и скорректируйте политики.

3. Перейдите в **Table Editor → hads_results → Settings** и создайте индексы:
   ```sql
   create index if not exists hads_results_user_id_idx on public.hads_results(user_id);
   create index if not exists hads_results_submitted_at_idx on public.hads_results(submitted_at);
   ```

## 3. Переменные окружения
1. Создайте файл `.env.local` в корне проекта (на основе `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
2. Заполните значения из Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
   ```

## 4. Локальный запуск
1. Убедитесь, что установлен Node.js 18+ и npm.
2. Установите зависимости и запустите dev-сервер:
   ```bash
   npm install
   npm run dev
   ```
3. Откройте [http://localhost:3000](http://localhost:3000). В Telegram окружении приложение автоматически подхватит данные пользователя.

## 5. Деплой на Vercel
1. Импортируйте репозиторий через [Vercel Dashboard](https://vercel.com/new): **Add New Project → Import Git Repository**.
2. На шаге конфигурации задайте переменные окружения (как в `.env.local`).
3. Нажмите **Deploy** и дождитесь сборки.
4. После деплоя получите публичный URL вида `https://hads-miniapp.vercel.app` — он нужен для кнопки в Telegram.

## 6. Подключение к Telegram-боту
1. Откройте @BotFather и выполните команду `/setmenubutton` → выберите вашего бота → `Web App`.
2. Укажите название кнопки (например, `HADS тест`) и URL мини-приложения с Vercel.
3. Если используете кастомные клавиатуры, отправьте JSON c `web_app` полем:
   ```json
   {
     "keyboard": [
       [
         {
           "text": "Пройти тест HADS",
           "web_app": { "url": "https://hads-miniapp.vercel.app" }
         }
       ]
     ],
     "resize_keyboard": true
   }
   ```
4. Убедитесь, что домен Vercel добавлен в списке разрешённых: команда `/setdomain` в @BotFather.

## 7. Проверка
1. В Telegram откройте диалог с ботом и нажмите кнопку. Должно открыться мини-приложение.
2. Заполните тест и нажмите «Сохранить результат» — запись появится в таблице `hads_results` в Supabase.
3. Перезагрузите приложение — в блоке истории появится новая точка на графике.

## 8. Полезные настройки
- В Supabase можно включить email-уведомления или экспорт данных.
- Если нужно ограничить доступ, подключите авторизацию (например, Supabase Auth или Telegram login widget) и адаптируйте политику.
- Для кастомного дизайна можно настроить тему Telegram Web App через `window.Telegram.WebApp.setBackgroundColor()` и другие методы.

## 9. Структура проекта
```
.
├── src
│   ├── app
│   │   ├── layout.tsx     # Подключение Telegram Web App SDK и глобальных стилей
│   │   └── page.tsx       # Точка входа, подключает клиентскую страницу
│   ├── components
│   │   ├── ClientPage.tsx # Основной экран мини-приложения
│   │   ├── HadsForm.tsx   # Форма теста и отправка данных в Supabase
│   │   └── ResultsChart.tsx # График с историей результатов
│   ├── lib
│   │   ├── hads.ts        # Вопросы, расчёт и интерпретация баллов
│   │   └── supabaseClient.ts # Инициализация клиента Supabase
│   └── styles
│       └── globals.css    # Базовые стили
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 10. Частые вопросы
**Как протестировать без Telegram?** Запустите локальный сервер и откройте в браузере. Пользователь будет определён как «гость», а данные сохранятся с `user_id = null`.

**Можно ли фильтровать результаты по пользователю?** Да, компонент `ResultsChart` передаёт `telegramUserId` в запрос. Если Supabase хранит user_id, график покажет только записи конкретного пользователя. При отсутствии user_id отображаются общие данные.

**Нужна ли авторизация Supabase?** Для базового сценария достаточно `anon` ключа и открытых политик. Для production рекомендуется внедрить токенизацию Telegram и проверку подписи `initData` на сервере.

Удачи в запуске! Если что-то не работает, убедитесь, что заполнены переменные окружения и таблица в Supabase создана корректно.
