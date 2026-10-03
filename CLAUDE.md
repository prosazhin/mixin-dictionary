# CLAUDE.md

Этот файл автоматически читается Claude Code при открытии проекта и даёт контекст для работы.

## Проект

**mixin-dictionary** — CLI-инструмент и библиотека на базе [Style Dictionary](https://github.com/style-dictionary/style-dictionary). Генерирует CSS/LESS/SCSS переменные и миксины из design tokens (DTCG 2025.10 и старый формат) с поддержкой тем.

Полная документация по архитектуре и конвенциям — в `AGENTS.md`.

## Структура `lib/`

```
index.js               — build(config): чтение файлов → generate() → запись
generate.js            — generate(): переменные (SD formatPlatform в памяти) + миксины + темы, без fs
build-mixins.js        — генерация миксинов из групп токенов
build-theme.js         — блоки тем (CSS — в конец, LESS/SCSS — var() + :root и блоки в начало)
const.js               — константы и дефолты конфига
types.js               — JSDoc-типы публичного API
tokens/*               — общий с tailwind-dictionary код: DTCG, группы, темы, Style Dictionary в памяти
utils/get-config.js    — чтение и валидация конфига
utils/read-token-files.js — глобы → файлы токенов (общий с tailwind-dictionary)
utils/watch.js         — --watch (общий с tailwind-dictionary)
utils/helpers.js       — createProp / createMixin
utils/logger.js        — chalk-логгер
```

## Основной поток

1. `getConfig()` — читает и валидирует конфиг
2. `read-token-files` — файлы `source` и `themes.*` → деревья токенов
3. `resolveThemes()` — Style Dictionary в памяти для темы по умолчанию и каждой другой темы
4. Переменные — форматы SD `<platform>/variables`; миксины — группы (`mixin`, `$extensions`, typography, брейкпоинты, keyframes)
5. `buildTheme()` — блоки тем; `build()` записывает файлы

## Ключевые решения

- **`var()` только для семантических токенов** (тех что меняются между темами) в LESS/SCSS — иначе сломаются `@media` брейкпоинт-миксины
- **`:root {}` в LESS/SCSS** — только семантические токены, не вся палитра
- **Старый формат** идёт через `transformGroup` платформы как раньше — вывод не меняется (snapshot-тесты)
- **Не удалять существующее** (CSS-«миксины», `-webkit-`/`-moz-` keyframes) — только улучшать

## Конфиг

```json
{
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

`themes` — опциональный: `{ default?: string, <имя темы>: string[] }`, `default` по умолчанию `light`. Без `themes` поведение идентично предыдущим версиям. Схема: `schema/config.schema.json`.

При использовании `themes` — `source` не должен включать файлы тем (использовать `tokens/*.json`, не `tokens/**/*.json`).

## Правила работы

- Ветка: **main**
- Коммиты: Conventional Commits (`feat:`, `fix:`, `chore:` и т.д.)
- Форматирование: Prettier (запускается автоматически через git-хуки)
- Тесты: `npm test` (snapshot по `test/fixtures`), `npm run test:types`; перед завершением задачи — `npm test` и `npm run lint`
- В пакет публикуются `bin/`, `lib/`, `schema/`, `types/`, `README.md`, `CHANGELOG.md`
