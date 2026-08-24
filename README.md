# Путешествовать — легко

Лендинг. Статика, Vite, ванильный JS, GSAP.

## Команды

```bash
npm install
npm run dev      # дев-сервер
npm run build    # сборка в dist/
npm run preview  # проверка сборки
npm run budget   # гейт бюджета (код 1 при превышении)
npm run phases:check # карта окон фаз, код 1 при пересечении
```

## Структура

Жирным — то, что уже есть; остальное появится по мере переноса сцены из `legacy/`.

```
src/
  scene/      # **phases.js**, **scene.js**; captions.js, influx.js, swarm.js — впереди
  app-screen/ # экран приложения в телефоне — впереди
  styles/     # **tokens.css**, **scene.css**
public/       # впереди: fonts/ (Geologica woff2, сабсет кириллицы), media/ (WebP, AVIF, mp4)
scripts/
  **budget.mjs**       # гейт бюджета (голый Node, без зависимостей)
  **phases-check.mjs** # карта окон фаз
legacy/
  **rd-hero-v4.html**  # монофайл-эталон до полного переноса на Vite
```

## Бюджет

Лимиты в `budget.json`. Гейт: JS ≤ 100 КБ, критический путь ≤ 300 КБ, вся страница ≤ 900 КБ (все цифры transferred brotli).

Правила проекта — в [AGENTS.md](./AGENTS.md). Читать до первой правки.

`legacy/rd-hero-v4.html` под гейт не попадает: это эталон внешнего вида, а не отдача. Его долги — 312 КБ base64 внутри, Google Fonts и cdnjs снаружи, iframe — закрываются переносом, а не правкой монофайла.
