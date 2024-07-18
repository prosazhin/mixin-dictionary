# Mixin Dictionary

Mixin Dictionary is a package based on [Style Dictionary](https://github.com/amzn/style-dictionary) that allows creating mixins from design tokens for LESS and SCSS.

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

At the moment, CSS does not yet have the ability to use mixins.

## Example

As an example of usage, you can look at the [pbstyles](https://github.com/prosazhin/pbstyles) style library.

### config.json

```json
{
  "platforms": ["css", "less", "scss"],
  "source": ["tokens/**/*.json"],
  "output": "./styles",
  "mediaAliases": ["screen", "breakpoint"]
}
```

| Property     | Type   | Description                                                                                                                                                          |
| :----------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| platforms    | Array  | Sets of platform files to be built. By default is "["css", "less", "scss"]".                                                                                         |
| source       | Array  | An array of file path [globs](https://github.com/isaacs/node-glob) to design token files. Exactly like [Style Dictionary](https://github.com/amzn/style-dictionary). |
| output       | String | Base path to build the files, must end with a trailing slash. By default is "./styles".                                                                              |
| mediaAliases | Array  | Aliases for media queries category. By default is "["screen", "breakpoint"]".                                                                                        |

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
