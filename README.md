# Mixin Dictionary

Mixin Dictionary is a package based on [Style Dictionary](https://github.com/amzn/style-dictionary) that allows creating mixins from design tokens for LESS and SCSS, with theme support (light/dark) for CSS, LESS, and SCSS.

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

| Flag              | Short Flag | Description                                      |
| ----------------- | ---------- | ------------------------------------------------ |
| --config \[path\] | -c         | Set the config file to use. Must be a .json file |

## CSS

CSS variables are generated in `:root`. Mixins are not supported for CSS. Theme support works via CSS custom properties — see [Theme support](#theme-support).

## Example

As an example of usage, you can look at the [pbstyles](https://github.com/prosazhin/pbstyles) style library.

### config.json

```json
{
  "platforms": ["css", "less", "scss"],
  "source": ["tokens/**/*.json"],
  "output": "./styles",
  "mediaAliases": ["screen", "breakpoint"],
  "keyframesAliases": ["keyframes"]
}
```

| Property         | Type   | Default                    | Description                                                                                                                                                          |
| :--------------- | :----- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| platforms        | Array  | `["css", "less", "scss"]`  | Sets of platform files to be built.                                                                                                                                  |
| source           | Array  | `["tokens/**/*.json"]`     | An array of file path [globs](https://github.com/isaacs/node-glob) to design token files. Exactly like [Style Dictionary](https://github.com/amzn/style-dictionary). |
| output           | String | `"./styles"`               | Base path to build the files.                                                                                                                                        |
| mediaAliases     | Array  | `["screen", "breakpoint"]` | Aliases for media queries category.                                                                                                                                  |
| keyframesAliases | Array  | `["keyframes"]`            | Aliases for keyframes animations category.                                                                                                                           |
| themes           | Object | `null`                     | Optional. Light and dark theme token files.                                                                                                                          |

## Theme support

Add an optional `themes` object to your config to enable light/dark theme output. If omitted, behavior is identical to previous versions — full backward compatibility.

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

| Property     | Type       | Description                            |
| :----------- | :--------- | :------------------------------------- |
| themes.light | `string[]` | File paths to light theme token files. |
| themes.dark  | `string[]` | File paths to dark theme token files.  |

> **Note:** when using `themes`, make sure `source` does not include the theme files themselves — use a specific glob like `tokens/*.json` instead of `tokens/**/*.json`. Theme files are passed separately via `themes.light` and `themes.dark` to avoid token collisions.

### How it works

The tool runs Style Dictionary twice — once for the light theme, once for the dark theme — and combines the results:

1. **Light build** — `source` + `themes.light` → generates all platform files and mixins
2. **Dark build** — `source` + `themes.dark` → generates only the dark override blocks

### CSS

All tokens in `:root`, dark overrides via both `@media` and `[data-theme='dark']`:

```css
:root {
  --color-black: #000000;
  --color-basic-0: #ffffff;
  /* ... all tokens ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-basic-0: #0f172a;
    /* ... semantic overrides only ... */
  }
}

[data-theme='dark'] {
  --color-basic-0: #0f172a;
  /* ... semantic overrides only ... */
}
```

### LESS

```less
:root {
  --color-basic-0: #ffffff;
  /* ... semantic tokens only ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-basic-0: #0f172a;
  }
}

[data-theme='dark'] {
  --color-basic-0: #0f172a;
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
  :root {
    --color-basic-0: #0f172a;
  }
}

[data-theme='dark'] {
  --color-basic-0: #0f172a;
}

$color-basic-0: var(--color-basic-0);
$color-black: #000000;
```

## Example of a mixin

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

@mixin h64 {
  font-size: $font-h64-font-size;
  line-height: $font-h64-line-height;
  font-weight: $font-h64-font-weight;
}
```

#### LESS

```less
@font-h64-font-size: 64px;
@font-h64-line-height: 1.25;
@font-h64-font-weight: 700;

.h64() {
  font-size: @font-h64-font-size;
  line-height: @font-h64-line-height;
  font-weight: @font-h64-font-weight;
}
```

## Example of a keyframes mixin

```json
{
  "keyframes": {
    "fade": {
      "from": {
        "value": "opacity: 0;",
        "mixin": "fade"
      },
      "to": {
        "value": "opacity: 1;",
        "mixin": "fade"
      }
    }
  }
}
```

#### SCSS

```scss
$keyframes-fade-from: opacity: 0;
$keyframes-fade-to: opacity: 1;

@mixin fade {
  @include keyframes(fade) {
    from { #{$keyframes-fade-from} }
    to { #{$keyframes-fade-to} }
  }
}
```

#### LESS

```less
@keyframes-fade-from: opacity: 0;
@keyframes-fade-to: opacity: 1;

.fade() {
  .keyframes(fade, {
    from { @keyframes-fade-from; }
    to { @keyframes-fade-to; }
  });
}
```

## Example of a media query mixin

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

@mixin lg {
  @media all and (max-width: $screen-lg-max) and (min-width: $screen-lg-min) {
    @content;
  }
}
```

#### LESS

```less
@screen-lg-max: 1440px;
@screen-lg-min: 921px;

.lg(@content) {
  @media all and (max-width: @screen-lg-max) and (min-width: @screen-lg-min) {
    @content;
  }
}
```
