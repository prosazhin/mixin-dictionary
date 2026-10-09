# Mixin Dictionary

[![npm version](https://img.shields.io/npm/v/mixin-dictionary.svg)](https://www.npmjs.com/package/mixin-dictionary)
[![npm downloads](https://img.shields.io/npm/dm/mixin-dictionary.svg)](https://www.npmjs.com/package/mixin-dictionary)
[![node](https://img.shields.io/node/v/mixin-dictionary.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/mixin-dictionary.svg)](./LICENSE)

[English](https://github.com/prosazhin/mixin-dictionary/blob/main/README.md) · **Русский**

CSS-переменные, переменные и миксины LESS/SCSS (типографика, медиа-запросы, keyframes) из дизайн-токенов в формате DTCG
или старом формате Style Dictionary — со светлой, тёмной и любыми другими темами. Работает на основе
[Style Dictionary](https://github.com/style-dictionary/style-dictionary).

📖 [Документация](https://prosazhin.dev/docs/mixin-dictionary?lang=ru) ·
🧪 [Плейграунд](https://prosazhin.dev/docs/mixin-dictionary/playground?lang=ru) ·
📝 [Changelog](./CHANGELOG.md)

## Содержание

- [Возможности](#возможности)
- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [CLI](#cli)
- [Программный API](#программный-api)
- [Конфиг](#конфиг)
- [Пример](#пример)
- [Темы](#темы)
- [Из Figma](#из-figma)
- [Старый формат](#старый-формат)
- [Документация](#документация)
- [Связанные проекты](#связанные-проекты)
- [Участие в разработке](#участие-в-разработке)
- [Автор](#автор)
- [Лицензия](#лицензия)

## Возможности

- **JSON-конфиг без кода.** Один `config.json` — не нужно поддерживать JS/TS-скрипт сборки. JSON Schema даёт
  автодополнение и проверку в редакторе.
- **CSS, LESS и SCSS.** CSS-переменные в `:root`, переменные и миксины LESS/SCSS: текстовые стили из токенов
  `typography`, медиа-запросы из брейкпоинтов, `@keyframes` (с префиксами `-webkit-` и `-moz-`).
- **DTCG и старый формат.** Читает [W3C Design Tokens (DTCG 2025.10)](https://www.designtokens.org/tr/2025.10/format/)
  (`$value`, `$type`, составные `typography` и `shadow`) из Figma, Tokens Studio и Terrazzo. Старый формат Style
  Dictionary (`value`) тоже поддерживается и даёт тот же результат.
- **Темы на любом уровне DOM.** Светлая, тёмная и любые другие темы (`high-contrast`, бренды) переключаются атрибутом
  `data-theme` на `<html>` или на вложенном контейнере; светлая и тёмная также следуют `prefers-color-scheme`.
  Переменные LESS/SCSS для токенов тем ссылаются на CSS-переменные, поэтому тема переключается в рантайме.
- **Нативный экспорт из Figma.** Переменные, выгруженные из Figma, работают без конвертации.
- **CLI, watch и API.** `--watch` пересобирает стили при изменениях; `build()` и работающий в браузере `generate()`
  поставляются с типами TypeScript.

## Установка

Нужен Node.js 22 или новее.

```bash
npm install mixin-dictionary --save-dev
```

## Быстрый старт

1. Создайте `config.json`:

   ```json
   {
     "$schema": "./node_modules/mixin-dictionary/schema/config.schema.json",
     "platforms": ["css", "less", "scss"],
     "source": ["tokens/**/*.json"],
     "output": "./styles"
   }
   ```

2. Соберите стили:

   ```bash
   npx mixin-dictionary
   ```

3. Подключите нужные файлы: `styles/css/index.css`, `styles/less/index.less` или `styles/scss/index.scss`.

   ```scss
   @use './styles/scss/index.scss' as *;

   .title {
     @include h64;
   }
   ```

## CLI

```bash
npx mixin-dictionary [options]
```

| Флаг              | Короткий | Описание                                                                 |
| :---------------- | :------- | :----------------------------------------------------------------------- |
| `--config [path]` | `-c`     | Файл конфига (`.json`). По умолчанию `./config.json`                     |
| `--watch`         | `-w`     | Пересобирать при изменении файлов токенов (`source`, `themes`) и конфига |
| `--version`       | `-v`     | Вывести текущую версию                                                   |

Ошибки конфига и токенов выводятся одной строкой с файлом и путём токена; код выхода — `1`.

## Программный API

```js
import { build } from 'mixin-dictionary';

// Те же опции, что в config.json. Или: await build({ config: './config.json' })
await build({ platforms: ['css', 'scss'], source: ['tokens/*.json'], output: './styles' });
```

`generate()` не работает с файловой системой и запускается в браузере: принимает объекты токенов и возвращает
содержимое файлов.

```js
import { generate } from 'mixin-dictionary/generate';

const files = await generate({
  tokens: { color: { $type: 'color', white: { $value: '#ffffff' } } },
  themes: { dark: { color: { white: { $value: '#000000' } } } }, // необязательно
  platforms: ['css', 'less', 'scss'],
});

files['css/index.css']; // а также 'less/index.less', 'scss/index.scss'
```

Подробнее — в [документации по API](https://prosazhin.dev/docs/mixin-dictionary/api?lang=ru).

## Конфиг

| Свойство           | Тип             | По умолчанию                       | Описание                                                                                                                         |
| :----------------- | :-------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `platforms`        | Array           | `["css", "less", "scss"]`          | Платформы для сборки.                                                                                                            |
| `source`           | Array           | `["tokens/**/*.json"]`             | Глобы или пути к файлам токенов, например `["tokens/*.json"]`. Поддерживаются JSON, JSON5 и JS.                                  |
| `output`           | String          | `"./styles"`                       | Папка для результата, создаётся, если её нет.                                                                                    |
| `mediaAliases`     | Array           | `["screen", "breakpoint"]`         | Категории токенов брейкпоинтов — из них собираются миксины медиа-запросов.                                                       |
| `keyframesAliases` | Array           | `["keyframes"]`                    | Категории токенов keyframes.                                                                                                     |
| `themes`           | Object          | —                                  | Файлы токенов тем (`light`, `dark`, любое имя) и тема по умолчанию `default`. См. [Темы](#темы).                                 |
| `numberUnit`       | String \| false | `"px"`                             | Единица для чисел без единиц в размерных категориях: `"px"`, `"rem"` (значение / 16) или `false`. См. [Из Figma](#из-figma).     |
| `dimensionAliases` | Array           | `["spacing", "radius", "size", …]` | Категории, числа в которых считаются размерами. `mediaAliases` входят всегда; `line-height`, `font-weight`, `opacity` — никогда. |

Миксины и медиа-запросы собираются только для LESS и SCSS; в CSS попадают переменные.

Полное описание: [Конфигурация и CLI](https://prosazhin.dev/docs/mixin-dictionary/config?lang=ru).

## Пример

Токены в формате [DTCG](https://prosazhin.dev/docs/mixin-dictionary/dtcg?lang=ru) (`$type` наследуется от группы).
Миксины строятся по структуре токенов, поле `mixin` не нужно:

- составной токен `typography` → миксин с именем токена (`font.h64` → `h64`);
- токены в категориях `mediaAliases`: `screen.lg.{min,max}` → миксин медиа-запроса `lg`;
- токены в категориях `keyframesAliases`: `keyframes.<name>.<frame>.<property>` → keyframes `<name>`;
- явное имя: `"$extensions": { "dev.prosazhin.mixin": "<name>" }`.

```json
{
  "font": {
    "size": { "$type": "dimension", "64": { "$value": { "value": 64, "unit": "px" } } },
    "leading": { "$type": "number", "tight": { "$value": 1.25 } },
    "weight": { "$type": "fontWeight", "bold": { "$value": 700 } },
    "h64": {
      "$type": "typography",
      "$value": {
        "fontSize": "{font.size.64}",
        "lineHeight": "{font.leading.tight}",
        "fontWeight": "{font.weight.bold}"
      }
    }
  },
  "screen": {
    "$type": "dimension",
    "lg": {
      "min": { "$value": { "value": 921, "unit": "px" } },
      "max": { "$value": { "value": 1440, "unit": "px" } }
    }
  },
  "keyframes": {
    "$type": "number",
    "show": {
      "from": { "opacity": { "$value": 0 } },
      "to": { "opacity": { "$value": 1 } }
    }
  }
}
```

<table>
<tr><th>SCSS — <code>scss/index.scss</code></th><th>LESS — <code>less/index.less</code></th></tr>
<tr>
<td>

```scss
$font-size-64: 64px;
$font-leading-tight: 1.25;
$font-weight-bold: 700;
$font-h64-font-size: 64px;
$font-h64-line-height: 1.25;
$font-h64-font-weight: 700;
$screen-lg-min: 921px;
$screen-lg-max: 1440px;
$keyframes-show-from-opacity: 0;
$keyframes-show-to-opacity: 1;

@mixin keyframes($name) {
  @keyframes #{$name} {
    @content;
  }
  /* + @-webkit-keyframes, @-moz-keyframes */
}

@mixin h64 {
  font-size: $font-h64-font-size;
  line-height: $font-h64-line-height;
  font-weight: $font-h64-font-weight;
}

@mixin lg {
  @media all and (min-width: $screen-lg-min) and (max-width: $screen-lg-max) {
    @content;
  }
}

@include keyframes(show) {
  from {
    opacity: $keyframes-show-from-opacity;
  }
  to {
    opacity: $keyframes-show-to-opacity;
  }
}
```

</td>
<td>

```less
@font-size-64: 64px;
@font-leading-tight: 1.25;
@font-weight-bold: 700;
@font-h64-font-size: 64px;
@font-h64-line-height: 1.25;
@font-h64-font-weight: 700;
@screen-lg-min: 921px;
@screen-lg-max: 1440px;
@keyframes-show-from-opacity: 0;
@keyframes-show-to-opacity: 1;

.keyframes(@name, @content) {
  @keyframes @{name} {
    @content();
  }
  /* + @-webkit-keyframes, @-moz-keyframes */
}

.h64() {
  font-size: @font-h64-font-size;
  line-height: @font-h64-line-height;
  font-weight: @font-h64-font-weight;
}

.lg(@rules) {
  @media all and (min-width: @screen-lg-min) and (max-width: @screen-lg-max) {
    @rules();
  }
}

.keyframes(show, {
  from { opacity: @keyframes-show-from-opacity; }
  to { opacity: @keyframes-show-to-opacity; }
});
```

</td>
</tr>
</table>

В `css/index.css` те же токены попадают как CSS-переменные в `:root` (`--font-h64-font-size: 64px;` …).

Значения DTCG переводятся в CSS: объекты `dimension` → `16px`, цвета → `#…`, `rgba(…)`, `oklch(…)`, массивы
`fontFamily` → `'Inter', sans-serif`, `shadow` → `0px 1px 2px 0px #000000, inset …`. Ссылка `{group.token}` должна
указывать на существующий токен, иначе сборка остановится с путём токена и именем файла.

Реальный проект: библиотека стилей [pbstyles](https://github.com/prosazhin/pbstyles).

## Темы

```json
{
  "platforms": ["css", "less", "scss"],
  "source": ["tokens/*.json"],
  "themes": {
    "default": "light",
    "light": ["tokens/themes/light.json"],
    "dark": ["tokens/themes/dark.json"],
    "high-contrast": ["tokens/themes/high-contrast.json"]
  },
  "output": "./styles"
}
```

> [!NOTE]
> `source` не должен включать файлы тем — используйте `tokens/*.json` вместо `tokens/**/*.json`.

Токены, заданные в темах кроме `default`, становятся семантическими. Тема `default` попадает в `:root`, для каждой
другой темы собирается блок, где переопределены только семантические токены:

```css
:root {
  --color-black: #000000;
  --color-background: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']):not([data-theme='high-contrast']) {
    --color-background: #0f172a;
  }
}

[data-theme='dark'] {
  --color-background: #0f172a;
}

/* [data-theme='high-contrast'] { … } [data-theme='light'] { … } */
```

В LESS/SCSS семантические токены ссылаются на CSS-переменные, поэтому тема переключается в рантайме; остальные
токены сохраняют значения (их можно использовать в `@media`):

```scss
$color-black: #000000;
$color-background: var(--color-background);
```

- без атрибута — `:root` получает тему `default`, светлая и тёмная следуют системному `prefers-color-scheme`;
- `data-theme="<name>"` включает тему на элементе и его потомках — на `<html>` или на любом вложенном контейнере.

Если семантического токена нет в одной из тем, сборка выведет предупреждение с путями токенов. Без `themes` результат
такой же, как в предыдущих версиях.

Подробнее: [Темы](https://prosazhin.dev/docs/mixin-dictionary/themes?lang=ru).

## Из Figma

**Variables → правый клик по коллекции → Export modes** даёт по файлу `*.tokens.json` на каждый режим. Примитивы
положите в `source`, режимы — в `themes`:

```json
{
  "platforms": ["css", "less", "scss"],
  "source": ["tokens/Primitives.tokens.json"],
  "themes": {
    "light": ["tokens/Light.tokens.json"],
    "dark": ["tokens/Dark.tokens.json"]
  },
  "output": "./styles"
}
```

Figma выгружает числа без единиц, поэтому числа в размерных категориях (`spacing`, `radius`, `size`, брейкпоинты, …)
по умолчанию получают `px` (`numberUnit`). Подробнее: [Из Figma](https://prosazhin.dev/docs/mixin-dictionary/figma?lang=ru).

## Старый формат

Формат Style Dictionary с полем `value` работает как раньше. Миксин — это набор токенов с одинаковым полем `mixin`:

```json
{
  "font": {
    "h64": {
      "font-size": { "value": "64px", "mixin": "h64" },
      "line-height": { "value": "1.25", "mixin": "h64" },
      "font-weight": { "value": "700", "mixin": "h64" }
    }
  }
}
```

Результат — тот же `@mixin h64` / `.h64()`, что в [примере](#пример). Брейкпоинты и keyframes задаются через поле
`mixin` так же. В одной сборке используется один формат: смешивать `value` и `$value` нельзя.

Подробнее: [Старый формат](https://prosazhin.dev/docs/mixin-dictionary/legacy?lang=ru).

## Документация

| Страница                                                                         | Что внутри                                                           |
| :------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| [Начало работы](https://prosazhin.dev/docs/mixin-dictionary?lang=ru)             | Обзор и быстрый старт                                                |
| [Конфигурация и CLI](https://prosazhin.dev/docs/mixin-dictionary/config?lang=ru) | Все опции конфига, платформы и флаги CLI                             |
| [DTCG](https://prosazhin.dev/docs/mixin-dictionary/dtcg?lang=ru)                 | Значения `$type`, типографика, брейкпоинты, keyframes, `$extensions` |
| [Старый формат](https://prosazhin.dev/docs/mixin-dictionary/legacy?lang=ru)      | Формат Style Dictionary `value` и `mixin`                            |
| [Темы](https://prosazhin.dev/docs/mixin-dictionary/themes?lang=ru)               | Светлая, тёмная и свои темы, итоговые CSS, LESS и SCSS               |
| [Из Figma](https://prosazhin.dev/docs/mixin-dictionary/figma?lang=ru)            | Нативный экспорт Figma Variables, `numberUnit`                       |
| [API](https://prosazhin.dev/docs/mixin-dictionary/api?lang=ru)                   | `build()`, `generate()`, типы TypeScript, режим watch                |
| [Плейграунд](https://prosazhin.dev/docs/mixin-dictionary/playground?lang=ru)     | Попробовать в браузере                                               |

## Связанные проекты

- [tailwind-dictionary](https://github.com/prosazhin/tailwind-dictionary) — те же токены в виде темы Tailwind CSS
  (v3 и v4).
- [pbstyles](https://github.com/prosazhin/pbstyles) — библиотека стилей, собранная обоими пакетами.
- [pbcomponents](https://github.com/prosazhin/pbcomponents) — React-компоненты на основе pbstyles.

## Участие в разработке

Баги и идеи — в [issues](https://github.com/prosazhin/mixin-dictionary/issues). Перед пул-реквестом прочитайте
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Автор

**Евгений Сажин**, фронтенд-разработчик и дизайнер — [prosazhin.dev](https://prosazhin.dev?lang=ru) · [GitHub](https://github.com/prosazhin) ·
[Telegram](https://t.me/prosazhin) · [LinkedIn](https://www.linkedin.com/in/prosazhin)

Если пакет пригодился, поставьте ⭐ на [GitHub](https://github.com/prosazhin/mixin-dictionary).

## Лицензия

[MIT](./LICENSE) © Evgenii Sazhin
