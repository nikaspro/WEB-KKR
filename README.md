# Путешествовать — легко

Предрелизный лендинг на Vite, ванильном JavaScript, CSS и GSAP.

## Открыть сайт

**[Рабочая версия на GitHub Pages](https://nikaspro.github.io/WEB-KKR/)**

GitHub Actions собирает production-версию и публикует её автоматически. Исходный `index.html` не нужно открывать через интерфейс GitHub или `raw.githubusercontent.com`.

## Требования

- Node.js 22.x (версия зафиксирована в `.nvmrc` и `package.json`);
- npm из поставки Node.js;
- установка зависимостей только через `npm ci`.

```bash
nvm use
npm ci
```

## Команды

```bash
npm run dev              # локальный Vite-сервер
npm run build            # production-сборка в dist/
npm run preview          # локальная проверка dist/
npm run budget           # бюджет и правила production-выдачи
npm run phases:check     # окна и разрешённые пересечения фаз
npm run legacy:check     # legacy-вход и embedded-ассеты
npm run check            # build + все обязательные проверки
npm run package:portable # portable/ и автономный standalone/index.html
```

## Структура

```text
.github/workflows/pages.yml  # проверки и публикация GitHub Pages
index.html                   # разметка единственной рабочей страницы
src/
  scene/
    scene.js                 # логика, интерактив и GSAP-сцены
    phases.js                # окна и тайминги фаз
  styles/
    scene.css                # стили страницы
    tokens.css               # общие токены
public/assets/
  embedded/                  # экран приложения внутри телефона
  fonts/                     # локальные WOFF2
  generated/                 # графические ассеты сцен
  media/                     # hero-медиа
  plan-build/                # ассеты сборки плана
  split-letters/             # буквы интерактивного следа
  trip-hub/                  # карточки поездки
  ui/                        # логотип и интерфейсные SVG
  weather/                   # погодные фоны
scripts/
  budget.mjs                 # бюджет production-сборки
  phases-check.mjs           # проверка окон анимации
  legacy-check.mjs           # проверка локальных ссылок и ассетов
  portable-package.mjs       # переносимая сборка
legacy/rd-hero-v4.html       # совместимый переход на корневую страницу
```

Правила проекта находятся в [AGENTS.md](./AGENTS.md), правила GSAP — в [GSAP.md](./GSAP.md).

## Предрелизная проверка

1. Выполнить `nvm use` и `npm ci`.
2. Запустить `npm run check`.
3. Запустить `npm run preview` и проверить desktop, mobile и нестандартное соотношение сторон.
4. Проверить `prefers-reduced-motion`, консоль и базовую страницу без JavaScript.
5. Проверить внутренние ссылки и отсутствие внешних runtime-запросов.
6. Убедиться, что `git status` содержит только ожидаемые изменения.

## Публикация

Workflow [`.github/workflows/pages.yml`](./.github/workflows/pages.yml) выполняет `npm ci`, сборку и все обязательные проверки. При push в рабочую ветку или `main` готовая папка `dist/` публикуется по адресу [nikaspro.github.io/WEB-KKR](https://nikaspro.github.io/WEB-KKR/).
