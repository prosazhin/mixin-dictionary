# Mixin Dictionary

[![npm version](https://img.shields.io/npm/v/mixin-dictionary.svg)](https://www.npmjs.com/package/mixin-dictionary)
[![npm downloads](https://img.shields.io/npm/dm/mixin-dictionary.svg)](https://www.npmjs.com/package/mixin-dictionary)
[![node](https://img.shields.io/node/v/mixin-dictionary.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/mixin-dictionary.svg)](./LICENSE)

**English** · [Русский](https://github.com/prosazhin/mixin-dictionary/blob/main/README.ru.md)

Build CSS variables and LESS/SCSS variables and mixins (typography, media queries, keyframes) from design tokens — DTCG
or the legacy Style Dictionary format — with light, dark and any other themes. Based on
[Style Dictionary](https://github.com/style-dictionary/style-dictionary).

📖 [Documentation](https://prosazhin.dev/docs/mixin-dictionary?lang=en) ·
🧪 [Playground](https://prosazhin.dev/docs/mixin-dictionary/playground?lang=en) ·
📝 [Changelog](./CHANGELOG.md)

## Contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [CLI](#cli)
- [Programmatic API](#programmatic-api)
- [Config](#config)
- [Example](#example)
- [Themes](#themes)
- [From Figma](#from-figma)
- [Legacy format](#legacy-format)
- [Documentation](#documentation)
- [Related projects](#related-projects)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## Features

- **JSON config, no code.** One `config.json` — no JS/TS build script to maintain. JSON Schema gives autocompletion
  and validation in the editor.
- **CSS, LESS and SCSS.** CSS variables in `:root`, LESS/SCSS variables and mixins: text styles from `typography`
  tokens, media queries from breakpoints, `@keyframes` (with `-webkit-` and `-moz-` prefixes).
- **DTCG and the legacy format.** Reads [W3C Design Tokens (DTCG 2025.10)](https://www.designtokens.org/tr/2025.10/format/)
  (`$value`, `$type`, composite `typography` and `shadow`) as exported by Figma, Tokens Studio and Terrazzo, and the
  legacy Style Dictionary format (`value`) with the same output.
- **Themes on any DOM level.** Light, dark and any other themes (`high-contrast`, brands, …) switch with `data-theme` on
  `<html>` or on any nested container; light/dark also follow `prefers-color-scheme`. LESS/SCSS variables of theme
  tokens point to CSS variables, so the theme switches at runtime.
- **Native Figma export.** Variables exported from Figma work without conversion.
- **CLI, watch mode and API.** `--watch` rebuilds on changes; `build()` and the browser-friendly `generate()` come with
  TypeScript types.

## Installation

Requires Node.js 22 or newer.

```bash
npm install mixin-dictionary --save-dev
```

## Quick start

1. Create `config.json`:

   ```json
   {
     "$schema": "./node_modules/mixin-dictionary/schema/config.schema.json",
     "platforms": ["css", "less", "scss"],
     "source": ["tokens/**/*.json"],
     "output": "./styles"
   }
   ```

2. Build the styles:

   ```bash
   npx mixin-dictionary
   ```

3. Import the files you need: `styles/css/index.css`, `styles/less/index.less` or `styles/scss/index.scss`.

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

| Flag              | Short | Description                                                        |
| :---------------- | :---- | :----------------------------------------------------------------- |
| `--config [path]` | `-c`  | Config file to use (`.json`). Default is `./config.json`           |
| `--watch`         | `-w`  | Rebuild when token files (`source`, `themes`) or the config change |
| `--version`       | `-v`  | Output the current version                                         |

Config and token errors are printed as one line with the file and the token path; the exit code is `1`.

## Programmatic API

```js
import { build } from 'mixin-dictionary';

// Same options as config.json. Or: await build({ config: './config.json' })
await build({ platforms: ['css', 'scss'], source: ['tokens/*.json'], output: './styles' });
```

`generate()` does not touch the file system and works in the browser: it takes token objects and returns file contents.

```js
import { generate } from 'mixin-dictionary/generate';

const files = await generate({
  tokens: { color: { $type: 'color', white: { $value: '#ffffff' } } },
  themes: { dark: { color: { white: { $value: '#000000' } } } }, // optional
  platforms: ['css', 'less', 'scss'],
});

files['css/index.css']; // also 'less/index.less', 'scss/index.scss'
```

More in the [API docs](https://prosazhin.dev/docs/mixin-dictionary/api?lang=en).

## Config

| Property           | Type            | Default                            | Description                                                                                                                      |
| :----------------- | :-------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `platforms`        | Array           | `["css", "less", "scss"]`          | Platforms to build.                                                                                                              |
| `source`           | Array           | `["tokens/**/*.json"]`             | Globs or paths of token files, e.g. `["tokens/*.json"]`. JSON, JSON5 and JS are supported.                                       |
| `output`           | String          | `"./styles"`                       | Output folder, created if missing.                                                                                               |
| `mediaAliases`     | Array           | `["screen", "breakpoint"]`         | Categories of breakpoint tokens — they become media query mixins.                                                                |
| `keyframesAliases` | Array           | `["keyframes"]`                    | Categories of keyframes tokens.                                                                                                  |
| `themes`           | Object          | —                                  | Theme token files (`light`, `dark`, any name) and the `default` theme. See [Themes](#themes).                                    |
| `numberUnit`       | String \| false | `"px"`                             | Unit for bare numbers in dimension categories: `"px"`, `"rem"` (value / 16) or `false`. See [From Figma](#from-figma).           |
| `dimensionAliases` | Array           | `["spacing", "radius", "size", …]` | Categories whose bare numbers are dimensions. `mediaAliases` are always included; `line-height`, `font-weight`, `opacity` never. |

Mixins and media queries are built for LESS and SCSS only; CSS gets variables.

Full reference: [Config](https://prosazhin.dev/docs/mixin-dictionary/config?lang=en).

## Example

Tokens in [DTCG](https://prosazhin.dev/docs/mixin-dictionary/dtcg?lang=en) (`$type` is inherited from the group).
Mixins come from the token structure, no `mixin` field needed:

- a composite `typography` token → a mixin named after the token (`font.h64` → `h64`);
- tokens in `mediaAliases` categories: `screen.lg.{min,max}` → media query mixin `lg`;
- tokens in `keyframesAliases` categories: `keyframes.<name>.<frame>.<property>` → keyframes `<name>`;
- an explicit name: `"$extensions": { "dev.prosazhin.mixin": "<name>" }`.

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

`css/index.css` gets the same tokens as CSS variables in `:root` (`--font-h64-font-size: 64px;` …).

DTCG values are converted to CSS: `dimension` objects → `16px`, colors → `#…`, `rgba(…)`, `oklch(…)`, `fontFamily`
arrays → `'Inter', sans-serif`, `shadow` → `0px 1px 2px 0px #000000, inset …`. A reference `{group.token}` must point
to an existing token, otherwise the build stops with the token path and the file name.

A real project: the [pbstyles](https://github.com/prosazhin/pbstyles) style library.

## Themes

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
> `source` must not include the theme files — use `tokens/*.json` instead of `tokens/**/*.json`.

Tokens defined in the themes other than `default` become semantic. The `default` theme goes to `:root`, every other
theme gets an override block with the semantic tokens only:

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

In LESS/SCSS semantic tokens reference CSS variables, so the theme switches at runtime; the other tokens keep their
values (they are safe to use in `@media`):

```scss
$color-black: #000000;
$color-background: var(--color-background);
```

- no attribute — `:root` gets the `default` theme, light/dark follow the system `prefers-color-scheme`;
- `data-theme="<name>"` forces the theme on the element and its subtree — on `<html>` or on any nested container.

If a semantic token is missing in one of the themes, the build prints a warning with the token paths. Without `themes`
the output is the same as in previous versions.

Details: [Themes](https://prosazhin.dev/docs/mixin-dictionary/themes?lang=en).

## From Figma

**Variables → right click on a collection → Export modes** gives one `*.tokens.json` file per mode. Put the primitives
into `source` and the modes into `themes`:

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

Figma exports numbers without units, so bare numbers in dimension categories (`spacing`, `radius`, `size`, breakpoints,
…) get `px` by default (`numberUnit`). Details: [From Figma](https://prosazhin.dev/docs/mixin-dictionary/figma?lang=en).

## Legacy format

The Style Dictionary format with `value` works as before. A mixin is a set of tokens with the same `mixin` field:

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

The output is the same `@mixin h64` / `.h64()` as in the [example](#example). Breakpoints and keyframes use the
`mixin` field the same way. One build uses one format: mixing `value` and `$value` is an error.

Details: [Legacy format](https://prosazhin.dev/docs/mixin-dictionary/legacy?lang=en).

## Documentation

| Page                                                                         | What's inside                                                     |
| :--------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| [Getting started](https://prosazhin.dev/docs/mixin-dictionary?lang=en)       | Overview and quick start                                          |
| [Config and CLI](https://prosazhin.dev/docs/mixin-dictionary/config?lang=en) | All config options, platforms and CLI flags                       |
| [DTCG](https://prosazhin.dev/docs/mixin-dictionary/dtcg?lang=en)             | `$type` values, typography, breakpoints, keyframes, `$extensions` |
| [Legacy format](https://prosazhin.dev/docs/mixin-dictionary/legacy?lang=en)  | Style Dictionary `value` format and `mixin`                       |
| [Themes](https://prosazhin.dev/docs/mixin-dictionary/themes?lang=en)         | Light, dark and custom themes, generated CSS, LESS and SCSS       |
| [From Figma](https://prosazhin.dev/docs/mixin-dictionary/figma?lang=en)      | Native Figma Variables export, `numberUnit`                       |
| [API](https://prosazhin.dev/docs/mixin-dictionary/api?lang=en)               | `build()`, `generate()`, TypeScript types, watch mode             |
| [Playground](https://prosazhin.dev/docs/mixin-dictionary/playground?lang=en) | Try it in the browser                                             |

## Related projects

- [tailwind-dictionary](https://github.com/prosazhin/tailwind-dictionary) — the same tokens as a Tailwind CSS theme
  (v3 and v4).
- [pbstyles](https://github.com/prosazhin/pbstyles) — a style library built with both packages.
- [pbcomponents](https://github.com/prosazhin/pbcomponents) — React components on top of pbstyles.

## Contributing

Bug reports and ideas are welcome in [issues](https://github.com/prosazhin/mixin-dictionary/issues). Before opening a
pull request, read [CONTRIBUTING.md](./CONTRIBUTING.md).

## Author

**Evgenii Sazhin**, frontend developer & designer — [prosazhin.dev](https://prosazhin.dev?lang=en) · [GitHub](https://github.com/prosazhin) ·
[Telegram](https://t.me/prosazhin) · [LinkedIn](https://www.linkedin.com/in/prosazhin)

If the package is useful to you, give it a ⭐ on [GitHub](https://github.com/prosazhin/mixin-dictionary).

## License

[MIT](./LICENSE) © Evgenii Sazhin
