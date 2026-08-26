# Путешествовать — легко

Лендинг. Статика, Vite, ванильный JS, GSAP.

## Открыть сайт

**[Рабочая версия на GitHub Pages](https://nikaspro.github.io/WEB-KKR/)**

Сайт автоматически собирается и публикуется из исходников через GitHub Actions. Открывать `index.html` прямо в интерфейсе GitHub или через `raw.githubusercontent.com` не нужно: это исходный файл Vite, а не готовая production-сборка.

## Команды

```bash
npm ci
npm run dev      # дев-сервер
npm run build    # сборка в dist/
npm run preview  # проверка сборки
npm run budget   # гейт бюджета (код 1 при превышении)
npm run phases:check # карта окон фаз, код 1 при пересечении
```

## Структура

```
src/
  scene/      # scene.js, phases.js
  styles/     # scene.css, tokens.css
public/
  assets/     # локальные шрифты, медиа и экран приложения
scripts/
  budget.mjs       # гейт бюджета
  phases-check.mjs # карта окон фаз
  legacy-check.mjs # проверка HTML и локальных ассетов
legacy/
  rd-hero-v4.html  # переход со старой ссылки на корневую версию
```

## Бюджет

Лимиты в `budget.json`. Гейт: JS ≤ 100 КБ, критический путь ≤ 300 КБ, вся страница ≤ 900 КБ (все цифры transferred brotli).

Правила проекта — в [AGENTS.md](./AGENTS.md). Читать до первой правки.
Правила анимации и подключения библиотеки — в [GSAP.md](./GSAP.md).

Рабочая версия собирается из `index.html`, `src/` и `public/assets/`. Внешних runtime-ресурсов и больших `data:` в выдаче нет.

## Публикация

Workflow [`.github/workflows/pages.yml`](./.github/workflows/pages.yml) при каждом push собирает `dist/` с базовым путём `/WEB-KKR/`, проверяет бюджет и публикует результат в GitHub Pages. Для первой публикации в настройках репозитория нужно один раз выбрать **Settings → Pages → Source: GitHub Actions**.
