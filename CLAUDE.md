# CLAUDE.md

Этот файл автоматически читается Claude Code при открытии проекта и даёт контекст для работы.

## Проект

**mixin-dictionary** — CLI-инструмент на базе [Style Dictionary](https://amzn.github.io/style-dictionary/). Генерирует CSS/LESS/SCSS переменные и миксины из design tokens с поддержкой светлой/тёмной темы.

Полная документация по архитектуре и конвенциям — в `AGENTS.md`.

## Структура `lib/`

```
index.js               — оркестрация сборки
build-mixins.js        — генерация миксинов
build-theme.js         — генерация тёмной темы
const.js               — константы и дефолты конфига
utils/get-config.js    — парсинг и валидация конфига
utils/get-semantic-paths.js — сбор путей токенов из JSON файлов темы
utils/helpers.js       — чистые функции работы с токенами
utils/logger.js        — chalk-логгер
```

## Основной поток

1. `getConfig()` — читает и валидирует конфиг
2. SD прогон 1 (light) → CSS/LESS/SCSS файлы + `cache/`
3. Читаем `lightTokens` из `cache/` до его удаления
4. `buildMixins()` → миксины в файлы + удаляет `cache/`
5. SD прогон 2 (dark) → только `cache-dark/`
6. `buildTheme()` → dark-блоки в CSS, перезапись LESS/SCSS + удаляет `cache-dark/`

## Ключевые решения

- **`var()` только для семантических токенов** (тех что меняются между темами) в LESS/SCSS — иначе сломаются `@media` брейкпоинт-миксины
- **`:root {}` в LESS/SCSS** — только семантические токены, не вся палитра
- **`cache-dark/` удаляется в `finally`** — гарантированная очистка при любом исходе
- **Прогоны SD строго последовательны** — параллельный запуск вызывает конфликты

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

`themes` — опциональный. Без него поведение идентично предыдущим версиям.

При использовании `themes` — `source` не должен включать файлы тем (использовать `tokens/*.json`, не `tokens/**/*.json`).

## Правила работы

- Ветка: **main**
- Коммиты: Conventional Commits (`feat:`, `fix:`, `chore:` и т.д.)
- Форматирование: Prettier (запускается автоматически через git-хуки)
- Тестов нет — проверять изменения вручную через тестовую сборку с реальными токенами
- В пакет публикуются только `bin/`, `lib/`, `README.md`
