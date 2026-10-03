# Mixin Dictionary

[![npm version](https://img.shields.io/npm/v/mixin-dictionary.svg)](https://www.npmjs.com/package/mixin-dictionary)
[![npm downloads](https://img.shields.io/npm/dm/mixin-dictionary.svg)](https://www.npmjs.com/package/mixin-dictionary)
[![CI](https://github.com/prosazhin/mixin-dictionary/actions/workflows/ci.yml/badge.svg)](https://github.com/prosazhin/mixin-dictionary/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/mixin-dictionary.svg)](./LICENSE)

[Documentation](https://prosazhin.dev/docs/mixin-dictionary)

Mixin Dictionary builds CSS variables, LESS and SCSS variables and mixins (typography, media queries, keyframes) from design tokens, with themes (light, dark and more) for CSS, LESS and SCSS. It is based on [Style Dictionary](https://github.com/style-dictionary/style-dictionary).

## Why this package

- **JSON config, no code.** One `config.json` — no JS/TS build script to maintain.
- **DTCG and the legacy format.** Reads [W3C Design Tokens (DTCG 2025.10)](https://www.designtokens.org/tr/2025.10/format/) (`$value`, `$type`, composite `typography` and `shadow`) as exported by Figma, Tokens Studio and Terrazzo, and the legacy Style Dictionary format (`value`) with the same output.
- **Themes on any DOM level.** Light, dark and any other themes switch with `data-theme` on `<html>` or on any nested container, light/dark also follow `prefers-color-scheme`. LESS/SCSS variables of theme tokens point to CSS variables, so the theme switches at runtime.

## Installation

```bash
$ npm install mixin-dictionary --save-dev
# or
$ yarn add mixin-dictionary --dev
```

## Usage

```bash
$ mixin-dictionary
```

| Flag              | Short Flag | Description                                                        |
| ----------------- | ---------- | ------------------------------------------------------------------ |
| --config \[path\] | -c         | Set the config file to use. Must be a .json file                   |
| --watch           | -w         | Rebuild when token files (`source`, `themes`) or the config change |
| --version         | -v         | Output the current version                                         |

Config and token errors are printed as one line with the file and the token path, the exit code is `1`.

### Programmatic API

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

TypeScript types are included.

## CSS

CSS variables are generated in `:root`. Mixins are not supported for CSS. Theme support works via CSS custom properties — see [Theme support](#theme-support).

## Example

As an example of usage, you can look at the [pbstyles](https://github.com/prosazhin/pbstyles) style library.

### config.json

```json
{
  "$schema": "./node_modules/mixin-dictionary/schema/config.schema.json",
  "platforms": ["css", "less", "scss"],
  "source": ["tokens/**/*.json"],
  "output": "./styles",
  "mediaAliases": ["screen", "breakpoint"],
  "keyframesAliases": ["keyframes"]
}
```

`$schema` enables autocompletion and validation of the config in VS Code and other editors.

| Property         | Type   | Default                    | Description                                                                                                                       |
| :--------------- | :----- | :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| platforms        | Array  | `["css", "less", "scss"]`  | Sets of platform files to be built.                                                                                               |
| source           | Array  | `["tokens/**/*.json"]`     | Globs or file paths of design token files, e.g. `["tokens/*.json"]` or `["tokens/base.json"]`. JSON, JSON5 and JS are supported. |
| output           | String | `"./styles"`               | Base path to build the files. The folder is created if it does not exist.                                                         |
| mediaAliases     | Array  | `["screen", "breakpoint"]` | Categories of breakpoint tokens.                                                                                                  |
| keyframesAliases | Array  | `["keyframes"]`            | Categories of keyframes tokens.                                                                                                   |
| themes           | Object | `null`                     | Optional. Theme token files (`light`, `dark`, any other name) and the `default` theme. See [Theme support](#theme-support).       |

## DTCG

Token files in the [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/) format (`$value`, `$type`) are detected automatically. One build uses one format: mixing `value` and `$value` in the same set of files is an error.

| DTCG value                                                         | Output                                                                                  |
| :----------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| `dimension` `{ "value": 16, "unit": "px" }`                        | `16px`                                                                                  |
| `color` `{ "colorSpace": "srgb", "components": […], "hex": "#…" }` | `#…`, with `alpha` — `rgba(…)`, other color spaces — `oklch(…)`, `color(display-p3 …)` |
| `fontFamily` `["Inter", "sans-serif"]`                             | `'Inter', sans-serif`                                                                   |
| `shadow` (object or array of layers)                               | `0px 1px 2px 0px #000000, inset …`                                                      |
| `duration`, `cubicBezier`, `border`, `transition`                  | `150ms`, `cubic-bezier(…)`, `1px solid #…`, …                                           |
| string values                                                      | as is                                                                                   |

`$type` is inherited from the parent group. A reference `{group.token}` must point to an existing token, otherwise the build stops with the token path and the file name.

Mixins are built from the token structure, no `mixin` field needed:

- a composite `typography` token → a mixin named after the token (`font.h64` → `h64`), variables `<path>-font-size`, `<path>-line-height`, …;
- tokens in `mediaAliases` categories: `screen.lg.{min,max}` → media query mixin `lg`;
- tokens in `keyframesAliases` categories: `keyframes.<name>.<frame>.<property>` → keyframes `<name>`;
- explicit name: `"$extensions": { "dev.prosazhin.mixin": "<name>" }`. The legacy `mixin` field still works and has the highest priority.

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

#### SCSS

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
  @-webkit-keyframes #{$name} {
    @content;
  }
  @-moz-keyframes #{$name} {
    @content;
  }
}

@mixin h64 { font-size: $font-h64-font-size; line-height: $font-h64-line-height; font-weight: $font-h64-font-weight; }
@mixin lg { @media all and (min-width: $screen-lg-min) and (max-width: $screen-lg-max) { @content; } }
@include keyframes(show) { from { opacity: $keyframes-show-from-opacity; } to { opacity: $keyframes-show-to-opacity; } };
```

#### LESS

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
  @keyframes @name {
    @content();
  }
  @-webkit-keyframes @name {
    @content();
  }
  @-moz-keyframes @name {
    @content();
  }
}

.h64() { font-size: @font-h64-font-size; line-height: @font-h64-line-height; font-weight: @font-h64-font-weight; }
.lg(@rules) { @media all and (min-width: @screen-lg-min) and (max-width: @screen-lg-max) { @rules(); } }
.keyframes(show, { from { opacity: @keyframes-show-from-opacity; } to { opacity: @keyframes-show-to-opacity; } });
```

## Theme support

Add an optional `themes` object to your config to enable theme output. If omitted, behavior is identical to previous versions — full backward compatibility.

### config.json with themes

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

| Property       | Type       | Description                                                                                                                   |
| :------------- | :--------- | :---------------------------------------------------------------------------------------------------------------------------- |
| themes.<name>  | `string[]` | Token files of a theme: `light`, `dark` or any other name (`high-contrast`, `brand`, …).                                      |
| themes.default | `string`   | Theme whose values go to `:root`. Default is `light`. Without `light` files, `light` means the base tokens from `source`. |

> **Note:** when using `themes`, make sure `source` does not include the theme files themselves — use a specific glob like `tokens/*.json` instead of `tokens/**/*.json`. Theme files are passed separately via `themes` to avoid token collisions.

### How it works

Style Dictionary resolves the tokens in memory (no cache files) once for the default theme and once for every other theme:

1. **Default theme** — `source` + `themes.<default>` → all platform files and mixins
2. **Other themes** — `source` + `themes.<name>` → only the override blocks of the semantic tokens

Semantic tokens are the tokens defined in the themes other than `default`. If a semantic token is missing in one of the themes, the build prints a warning with the token paths.

### Theme switching

- **No attribute** — `:root` gets the default theme; `light`/`dark` follow the OS preference via `@media (prefers-color-scheme)`
- **`<html data-theme="dark">`** — forces dark regardless of the OS preference
- **`<html data-theme="light">`** — forces light regardless of the OS preference
- **`<div data-theme="light">`** (or any other theme) — switches the theme for a single container inside a page of another theme

### CSS

All tokens in `:root`, semantic overrides via `@media`, `[data-theme='dark']` and `[data-theme='light']`:

```css
:root {
  --color-black: #000000;
  --color-basic-0: #ffffff;
  /* ... all tokens ... */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-basic-0: #0f172a;
    /* ... semantic overrides only ... */
  }
}

[data-theme='dark'] {
  --color-basic-0: #0f172a;
  /* ... semantic overrides only ... */
}

[data-theme='light'] {
  --color-basic-0: #ffffff;
  /* ... semantic overrides only ... */
}
```

### More than two themes

```json
{
  "themes": {
    "default": "light",
    "light": ["tokens/themes/light.json"],
    "dark": ["tokens/themes/dark.json"],
    "high-contrast": ["tokens/themes/high-contrast.json"]
  }
}
```

Each theme gets its own `[data-theme='<name>']` block. The system dark scheme applies only while no other theme is set on `:root`:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']):not([data-theme='high-contrast']) { ... }
}

[data-theme='dark'] { ... }

[data-theme='high-contrast'] { ... }

[data-theme='light'] { ... }
```

### LESS

```less
:root {
  --color-basic-0: #ffffff;
  /* ... semantic tokens only ... */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-basic-0: #0f172a;
  }
}

[data-theme='dark'] {
  --color-basic-0: #0f172a;
}

[data-theme='light'] {
  --color-basic-0: #ffffff;
}

/* Semantic tokens reference CSS custom properties for runtime switching */
@color-basic-0: var(--color-basic-0);

/* Non-semantic tokens keep actual values */
@color-black: #000000;
```

### SCSS

```scss
:root {
  --color-basic-0: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-basic-0: #0f172a;
  }
}

[data-theme='dark'] {
  --color-basic-0: #0f172a;
}

[data-theme='light'] {
  --color-basic-0: #ffffff;
}

$color-basic-0: var(--color-basic-0);
$color-black: #000000;
```

## Legacy format: the `mixin` field

In the legacy format a mixin is a set of tokens with the same `mixin` field.

### Example of a mixin

```json
{
  "font": {
    "h64": {
      "font-size": {
        "value": "64px",
        "mixin": "h64"
      },
      "line-height": {
        "value": "1.25",
        "mixin": "h64"
      },
      "font-weight": {
        "value": "700",
        "mixin": "h64"
      }
    }
  }
}
```

#### SCSS

```scss
$font-h64-font-size: 64px;
$font-h64-line-height: 1.25;
$font-h64-font-weight: 700;

@mixin h64 { font-size: $font-h64-font-size; line-height: $font-h64-line-height; font-weight: $font-h64-font-weight; }
```

#### LESS

```less
@font-h64-font-size: 64px;
@font-h64-line-height: 1.25;
@font-h64-font-weight: 700;

.h64() { font-size: @font-h64-font-size; line-height: @font-h64-line-height; font-weight: @font-h64-font-weight; }
```

### Example of a keyframes mixin

```json
{
  "keyframes": {
    "fade": {
      "from": {
        "opacity": { "value": 0, "mixin": "fade" }
      },
      "to": {
        "opacity": { "value": 1, "mixin": "fade" }
      }
    }
  }
}
```

#### SCSS

```scss
$keyframes-fade-from-opacity: 0;
$keyframes-fade-to-opacity: 1;

@include keyframes(fade) { from { opacity: $keyframes-fade-from-opacity; } to { opacity: $keyframes-fade-to-opacity; } };
```

#### LESS

```less
@keyframes-fade-from-opacity: 0;
@keyframes-fade-to-opacity: 1;

.keyframes(fade, { from { opacity: @keyframes-fade-from-opacity; } to { opacity: @keyframes-fade-to-opacity; } });
```

The `keyframes` helper mixin (with `@-webkit-keyframes` and `@-moz-keyframes`) is added to the file once.

### Example of a media query mixin

```json
{
  "screen": {
    "lg": {
      "max": {
        "value": "1440px",
        "mixin": "lg"
      },
      "min": {
        "value": "921px",
        "mixin": "lg"
      }
    }
  }
}
```

#### SCSS

```scss
$screen-lg-max: 1440px;
$screen-lg-min: 921px;

@mixin lg { @media all and (max-width: $screen-lg-max) and (min-width: $screen-lg-min) { @content; } }
```

#### LESS

```less
@screen-lg-max: 1440px;
@screen-lg-min: 921px;

.lg(@rules) { @media all and (max-width: @screen-lg-max) and (min-width: @screen-lg-min) { @rules(); } }
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
