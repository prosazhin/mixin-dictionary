# AGENTS.md

## Обзор проекта

**mixin-dictionary** — CLI-инструмент и npm-пакет на базе [Style Dictionary](https://github.com/style-dictionary/style-dictionary), который генерирует CSS/LESS/SCSS переменные и миксины из design tokens с поддержкой тем. Вход — DTCG 2025.10 (`$value`, `$type`) или старый формат (`value` + `mixin`). Переменные создаёт Style Dictionary (в памяти, без файлов кэша), миксины (типографика, media query, keyframes) — пакет, темы (`light`, `dark`, любые другие) — блоки `:root` / `prefers-color-scheme` / `[data-theme]`.

## Архитектура

Одиночный npm-пакет (не монорепо). Везде используются ES Modules (`"type": "module"`).

```
bin/
  mixin-dictionary.js       # CLI (commander): -c, -w; ошибки DictionaryError — одной строкой, exit 1
lib/
  index.js                  # build(config): чтение файлов → generate() → запись <output>/<platform>/index.<platform>
  generate.js               # generate({ tokens, themes, platforms, mediaAliases, keyframesAliases }) без fs
  build-mixins.js           # группы токенов → текст миксинов по платформам
  build-theme.js            # блоки тем: CSS — в конец, LESS/SCSS — var() для семантических + :root и блоки в начало
  const.js                  # константы, дефолты конфига, шаблоны keyframe-миксинов (с -webkit- и -moz-)
  types.js                  # JSDoc-типы публичного API
  tokens/                   # общий с tailwind-dictionary код (без fs): walk, validate, normalize-value,
                            # read-tokens, groups, themes, theme-blocks, resolve, errors
  utils/
    get-config.js           # чтение и проверка config.json (правила = schema/config.schema.json)
    read-token-files.js     # глобы → файлы → дерево + карта «путь токена → файл» (общий с tailwind-dictionary)
    watch.js                # --watch (общий с tailwind-dictionary)
    helpers.js              # createProp / createMixin (включая CSS-«миксины»)
    logger.js               # chalk
schema/config.schema.json   # JSON Schema конфига
test/                       # *.test.js, fixtures/, types/
```

### Поток данных

1. CLI → `build({ config })`; программно — `build(config)` или `generate(...)`
2. `getConfig()` читает и валидирует конфиг; `read-token-files` раскрывает глобы `source` и `themes.*` (ошибка `No token files matched`, если не найдено ни одного файла)
3. `generate()`:
   - `resolveThemes` (`lib/tokens/resolve.js`): проверка дерева (`validate.js`: формат, битые ссылки, typography без fontSize), Style Dictionary в памяти для темы по умолчанию (`source` + её файлы) и для каждой другой темы → плоский список токенов
   - переменные: форматы Style Dictionary `<platform>/variables` через `formatPlatform` в памяти. Старый формат — `transformGroup` платформы, как раньше; DTCG — трансформ `mixin-dictionary/dtcg-value` (`normalize-value.js`), составная типографика разворачивается в `<path>-font-size`, … на том же месте дерева
   - миксины (`groups.js`): поле `mixin` → `$extensions["dev.prosazhin.mixin"]` → составная `typography` → `mediaAliases` (`<cat>.<name>.{min,max}`) → `keyframesAliases` (`<cat>.<name>.<frame>.<prop>`)
   - темы (`build-theme.js`): CSS — в конец `@media (prefers-color-scheme)` для `light`/`dark` и `[data-theme='<name>']` для каждой темы; LESS/SCSS — семантические переменные → `var(--…)`, в начало `:root` (тема по умолчанию) и те же блоки
4. `build()` записывает файлы (папки создаются рекурсивно)

### Ключевые решения по дизайну

- **Только семантические токены → `var()`** в LESS/SCSS. Токены палитры, размеров, брейкпоинтов остаются с реальными значениями — `var()` не работает внутри `@media` запросов, поэтому брейкпоинт-миксины должны использовать конкретные значения.
- **`:root {}` в LESS/SCSS** содержит только семантические токены (те что меняются между темами), не всю палитру.
- **Семантические пути** — объединение путей всех тем, кроме темы по умолчанию (`themes.default`, по умолчанию `light`).
- **Без кэша на диске**: токены берутся из Style Dictionary в памяти, параллельные сборки не мешают друг другу.
- **`source` не должен включать файлы тем**: при использовании `themes` нужно менять глоб с `tokens/**/*.json` на `tokens/*.json`.
- **Не удалять существующие возможности и вывод** (CSS-«миксины», `-webkit-`/`-moz-` keyframes и т. п.) — только улучшать.

## Конфигурация

```json
{
  "$schema": "./node_modules/mixin-dictionary/schema/config.schema.json",
  "platforms": ["css", "less", "scss"],
  "source": ["tokens/*.json"],
  "themes": {
    "light": ["tokens/themes/light.json"],
    "dark": ["tokens/themes/dark.json"]
  },
  "output": "./styles",
  "mediaAliases": ["screen", "breakpoint"],
  "keyframesAliases": ["keyframes"]
}
```

| Параметр         | Тип      | По умолчанию              | Обязателен |
| :--------------- | :------- | :------------------------ | :--------- |
| platforms        | Array    | `["css","less","scss"]`   | нет        |
| source           | Array    | `["tokens/**/*.json"]`    | нет        |
| output           | String   | `"./styles"`              | нет        |
| mediaAliases     | Array    | `["screen","breakpoint"]` | нет        |
| keyframesAliases | Array    | `["keyframes"]`           | нет        |
| themes           | Object   | `null`                    | нет        |
| themes.<name>    | string[] | —                         | нет        |
| themes.default   | string   | `light`                   | нет        |

## Технологический стек

- **Среда выполнения**: Node.js >= 22.0.0
- **Язык**: JavaScript (ES Modules), типы через JSDoc → `tsc` в `types/`
- **Основная зависимость**: `style-dictionary` ^5.x
- **CLI**: `commander`
- **Консольный вывод**: `chalk`
- **JSON5-файлы токенов**: `json5`
- **Тесты**: `node --test` (snapshot по `test/fixtures/*/expected`)

## Конвенции кода

### Стиль и форматирование

- **Prettier** — 2 пробела для отступов, одинарные кавычки, trailing commas, ширина строки 120 символов, точки с запятой
- **ESLint** с `eslint-config-prettier` — правила: `curly`, `no-shadow`, `no-nested-ternary`

### Именование

- **Файлы**: `kebab-case` (например, `build-mixins.js`, `get-config.js`, `build-theme.js`)
- **Функции и переменные**: `camelCase`
- **Константы**: `UPPER_SNAKE_CASE` (например, `DEFAULT_VALUE`, `PLATFORMS_FOR_MEDIA_QUERIES`)

### Паттерны модулей

- Default-экспорты для основных функций (`export default async function build`)
- Именованные экспорты для утилит (`export { createProp, createMixin }`)
- Во всех импортах явно указывается расширение `.js`

### Стиль кода

- Только `const`/`let` — без `var`
- Стрелочные функции в колбэках
- Деструктуризация объектов в параметрах и присваиваниях
- Шаблонные строки для интерполяции
- `forEach` / `reduce` для итераций

## Git-процессы

### Коммиты

- **Conventional Commits** через `commitlint` с `@commitlint/config-conventional`
- Формат: `type(scope): description` (например, `feat: add theme support`, `fix: config validation`)
- Работа ведётся в ветке `main`

### Git-хуки (через simple-git-hooks)

- **pre-commit**: `lint-staged` — Prettier и ESLint на staged-файлах
- **pre-push**: `npm run format` — форматирование всех файлов
- **commit-msg**: `commitlint` — валидация формата сообщения коммита

### Процесс релиза

1. Обновление версии в `package.json` и `CHANGELOG.md`
2. Push в `main` → `release.yml` сверяет версию с npm, гоняет lint и тесты, публикует пакет (`prepublishOnly` собирает `types/`), создаёт тег и GitHub Release

## npm-скрипты

- `npm test` — snapshot-тесты, тесты ошибок и общего модуля
- `npm run test:types` — сборка `.d.ts` и проверка типов на `test/types/usage.ts`
- `npm run lint` — запуск ESLint
- `npm run format` — запуск Prettier на всех `.js` и `.json` файлах
- `npm run prepare` — настройка git-хуков

## Важные ограничения

- Изменение вывода — только осознанно: обновить `test/fixtures/*/expected` и описать отличие
- `lib/tokens/*`, `lib/utils/read-token-files.js`, `lib/utils/watch.js`, `test/tokens.test.js` одинаковые с tailwind-dictionary — менять в обоих
- `lib/generate.js` и `lib/tokens/*` без `fs`, `path`, `process`, `chalk` — работают в браузере
- CSS-платформа генерирует только переменные (без миксинов); media queries и keyframes — только для LESS/SCSS
- В опубликованный пакет входят `bin/`, `lib/`, `schema/`, `types/`, `README.md`, `CHANGELOG.md`
