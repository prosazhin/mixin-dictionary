# AGENTS.md

## Обзор проекта

**mixin-dictionary** — CLI-инструмент и npm-пакет на базе [Style Dictionary](https://amzn.github.io/style-dictionary/), который генерирует миксины из design tokens для LESS и SCSS. Читает JSON-файлы с токенами, создаёт CSS/LESS/SCSS переменные через Style Dictionary, а затем генерирует соответствующие миксины (включая media query и keyframe миксины) для LESS и SCSS.

## Архитектура

Одиночный npm-пакет (не монорепо). Везде используются ES Modules (`"type": "module"`).

```
bin/
  mixin-dictionary.js    # Точка входа CLI (на базе commander)
lib/
  index.js               # Оркестрация сборки — настройка Style Dictionary, запуск билда, делегирование в buildMixins
  build-mixins.js        # Основная логика — чтение кэшированных токенов, группировка по имени миксина, генерация кода под каждую платформу
  const.js               # Константы, дефолтные значения конфигурации, шаблоны keyframe-миксинов
  utils/
    get-config.js        # Парсинг и валидация конфига, подстановка дефолтных значений
    helpers.js           # Чистые функции: обход токенов, группировка миксинов, генерация строк свойств и миксинов
    logger.js            # Цветной вывод в консоль через chalk
```

### Поток данных

1. CLI парсит аргументы → вызывает `build(options)` из `lib/index.js`
2. `getConfig()` читает и валидирует `config.json`
3. Style Dictionary собирает переменные во временную директорию `cache/` и выходные директории платформ
4. `buildMixins()` импортирует кэшированные токены, группирует по имени миксина, генерирует код миксинов для каждой платформы
5. Код миксинов дописывается в выходные файлы платформ (`index.less`, `index.scss`)
6. Временная директория `cache/` удаляется

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
- **EditorConfig** — UTF-8, LF-окончания строк, удаление trailing whitespace, финальный перевод строки

### Именование

- **Файлы**: `kebab-case` (например, `build-mixins.js`, `get-config.js`)
- **Функции и переменные**: `camelCase`
- **Константы**: `UPPER_SNAKE_CASE` (например, `DEFAULT_VALUE`, `PLATFORMS_FOR_MEDIA_QUERIES`)

### Паттерны модулей

- Default-экспорты для основных функций модулей (`export default async function build`, `export default function getConfig`)
- Именованные экспорты для наборов утилит (`export { getTokens, getMixins, createProp, createMixin }`)
- Во всех импортах явно указывается расширение `.js`

### Стиль кода

- Только `const`/`let` — без `var`
- Стрелочные функции в колбэках
- Деструктуризация объектов в параметрах и присваиваниях
- Шаблонные строки для интерполяции
- `forEach` / `reduce` для итераций (циклы `for` в кодовой базе не используются)

## Git-процессы

### Коммиты

- **Conventional Commits** через `commitlint` с `@commitlint/config-conventional`
- Формат: `type(scope): description` (например, `feat: add keyframes support`, `fix: config validation`)

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
- Директория `cache/` временная и автоматически удаляется после сборки; нельзя хранить там данные
- CSS-платформа генерирует только переменные (без миксинов); media queries и keyframes — только для LESS/SCSS
- TypeScript есть в devDependencies, но не используется — нет `.ts` файлов, нет проверки типов
- В опубликованный пакет входят только `bin/`, `lib/` и `README.md`
