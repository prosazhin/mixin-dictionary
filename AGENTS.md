# AGENTS.md

## Обзор проекта

**mixin-dictionary** — CLI-инструмент и npm-пакет на базе [Style Dictionary](https://amzn.github.io/style-dictionary/), который генерирует CSS/LESS/SCSS переменные и миксины из design tokens с поддержкой светлой/тёмной темы. Читает JSON-файлы с токенами, создаёт переменные через Style Dictionary, генерирует миксины (включая media query и keyframe) для LESS и SCSS, а при наличии `themes` в конфиге — дополнительно обрабатывает тёмную тему.

## Архитектура

Одиночный npm-пакет (не монорепо). Везде используются ES Modules (`"type": "module"`).

```
bin/
  mixin-dictionary.js       # Точка входа CLI (на базе commander)
lib/
  index.js                  # Оркестрация сборки: два прогона SD (light + dark), buildMixins, buildTheme
  build-mixins.js           # Генерация миксинов: чтение кэша, группировка по имени миксина, запись в файлы
  build-theme.js            # Генерация тёмной темы: CSS append + перезапись LESS/SCSS файлов
  const.js                  # Константы, дефолтные значения конфига, шаблоны keyframe-миксинов
  utils/
    get-config.js           # Парсинг и валидация конфига, подстановка дефолтных значений
    get-semantic-paths.js   # Сбор Set путей токенов из JSON-файлов темы (до запуска SD)
    helpers.js              # Чистые функции: обход токенов, группировка миксинов, генерация кода
    logger.js               # Цветной вывод в консоль через chalk
```

### Поток данных

**Без `themes`** (обратная совместимость):

1. CLI → `build(options)` из `lib/index.js`
2. `getConfig()` читает и валидирует конфиг
3. Style Dictionary: один прогон → `cache/` (JS) + платформенные файлы (CSS/LESS/SCSS)
4. `buildMixins()` → импортирует кэш, генерирует миксины, дописывает в файлы, удаляет `cache/`

**С `themes`**:

1. CLI → `build(options)`
2. `getConfig()` читает и валидирует конфиг, включая `themes`
3. **Прогон 1 (light)**: SD с `source + themes.light` → `cache/` + платформенные файлы
4. Читаем `lightTokens` из `cache/` **до** удаления
5. `buildMixins()` → миксины + удаляет `cache/`
6. `getSemanticPaths(themes.dark)` → Set путей тёмных токенов из JSON
7. **Прогон 2 (dark)**: SD с `source + themes.dark` → только `cache-dark/`
8. `buildTheme()`:
   - **CSS**: дописывает `@media (prefers-color-scheme: dark)` и `[data-theme='dark']` в конец `index.css`
   - **LESS/SCSS**: перечитывает файл, заменяет семантические переменные на `var()`, добавляет `:root {}` с семантическими light-значениями + dark-блоки в начало файла; миксины в конце остаются нетронутыми
9. Удаляет `cache-dark/`

### Ключевые решения по дизайну

- **Только семантические токены → `var()`** в LESS/SCSS. Токены палитры, размеров, брейкпоинтов остаются с реальными значениями — `var()` не работает внутри `@media` запросов, поэтому брейкпоинт-миксины должны использовать конкретные значения.
- **`:root {}` в LESS/SCSS** содержит только семантические токены (те что меняются между темами), не всю палитру.
- **Порядок прогонов SD строго последовательный**: SD может конфликтовать при параллельном запуске.
- **`cache-dark/` удаляется в `finally`**: гарантированная очистка даже при ошибке.
- **`source` не должен включать файлы тем**: при использовании `themes` нужно менять глоб с `tokens/**/*.json` на `tokens/*.json`.

## Конфигурация

```json
{
  "platforms": ["css", "less", "scss"],
  "source": ["tokens/*.json"],
  "themes": {
    "light": ["tokens/themes/light.json"],
    "dark":  ["tokens/themes/dark.json"]
  },
  "output": "./styles",
  "mediaAliases": ["screen", "breakpoint"],
  "keyframesAliases": ["keyframes"]
}
```

| Параметр         | Тип      | По умолчанию              | Обязателен |
|:-----------------|:---------|:--------------------------|:-----------|
| platforms        | Array    | `["css","less","scss"]`   | нет        |
| source           | Array    | `["tokens/**/*.json"]`    | нет        |
| output           | String   | `"./styles"`              | нет        |
| mediaAliases     | Array    | `["screen","breakpoint"]` | нет        |
| keyframesAliases | Array    | `["keyframes"]`           | нет        |
| themes           | Object   | `null`                    | нет        |
| themes.light     | string[] | —                         | нет        |
| themes.dark      | string[] | —                         | нет        |

## Технологический стек

- **Среда выполнения**: Node.js >= 20.22.0
- **Язык**: JavaScript (ES Modules)
- **Основная зависимость**: `style-dictionary` ^5.x
- **CLI**: `commander`
- **Файловая система**: `fs-extra`
- **Консольный вывод**: `chalk`

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
- Именованные экспорты для утилит (`export { getTokens, getMixins, createProp, createMixin }`)
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

1. Обновление версии в `package.json`
2. Push в `main` → GitHub Actions создаёт git-тег
3. Push тега → GitHub Actions публикует в npm и создаёт GitHub Release

## npm-скрипты

- `npm run lint` — запуск ESLint
- `npm run format` — запуск Prettier на всех `.js` и `.json` файлах
- `npm run prepare` — настройка git-хуков

## Важные ограничения

- Тесты отсутствуют — при изменении основной логики нужна осторожность
- `cache/` и `cache-dark/` — временные директории, автоматически удаляются после сборки
- CSS-платформа генерирует только переменные (без миксинов); media queries и keyframes — только для LESS/SCSS
- TypeScript есть в devDependencies, но не используется
- В опубликованный пакет входят только `bin/`, `lib/` и `README.md`
