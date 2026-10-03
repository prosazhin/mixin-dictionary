# Changelog

## 1.7.0

### Added

- `numberUnit` (`"px"` | `"rem"` | `false`) and `dimensionAliases`: bare DTCG numbers (`$type: "number"`, as Figma exports FLOAT variables)
  in dimension categories get a unit (`--radius-4: 4` → `4px`). Compatible with the native Figma variables export.

### Changed

- DTCG tokens only: a bare number in a dimension category (`spacing`, `radius`, `size`, breakpoints, …) now gets `px` instead of
  being output as is, which was not valid CSS. The legacy `value` format and other numbers (`line-height`, `font-weight`, `opacity`) are unchanged;
  `numberUnit: false` restores the old behavior.

## 1.6.0

### Added

- **DTCG 2025.10 input**: `$value`, `$type` with inheritance from groups, object `dimension` and `color`
  (sRGB → hex / `rgba()`, other color spaces → `oklch()`, `color(display-p3 …)`), `fontFamily` arrays, composite
  `shadow` (multi-layer, `inset`), `duration`, `cubicBezier`, `border`, `transition`.
  The legacy `value` format gives the same output as before.
- Mixins without the `mixin` field: composite `typography` → mixin named after the token, breakpoints by structure
  (`screen.lg.{min,max}` → `lg`), keyframes by structure (`keyframes.<name>.<frame>.<prop>`).
  Explicit name: `$extensions["dev.prosazhin.mixin"]`; the legacy `mixin` field has the highest priority.
- Any number of themes (`light`, `dark`, `high-contrast`, …) and `themes.default`.
  A config with only `light`/`dark` gives the same output as before.
- Programmatic API: `build()` from `mixin-dictionary` and `generate()` from `mixin-dictionary/generate`
  (no `fs`, works in the browser).
- TypeScript types.
- JSON Schema of the config: `"$schema": "./node_modules/mixin-dictionary/schema/config.schema.json"`.
- `--watch` (`-w`): rebuild when token files or the config change (only token folders are watched, not the whole project).
- Clear errors: broken references, `typography` without `fontSize`, mixed `value`/`$value` — with the token path
  and the file name, without a stack trace. Unknown `$type` and theme tokens missing in one of the themes are warnings.

### Fixed

- A file path in `source` (`"tokens/base.json"`) works. An error is shown only when no file matches any glob:
  `No token files matched: …`.
- Tokens are resolved in memory: no `cache/` folder inside `node_modules`, parallel builds don't interfere,
  read-only `node_modules` is fine.
- Missing or broken config: one line with the path, exit code 1.
- `commander` and `chalk` are runtime dependencies now (works with pnpm). `fs-extra` is no longer used.
- Mixins and theme blocks use the real variable names: a path with camelCase or `_` (`screen.tabletUp.min`)
  gave `$screen-tablet-up-min` in variables but `$screen-tabletUp-min` in the mixin, and themes did not switch
  `--color-textPrimary` while the variable was `--color-text-primary`.

## 1.4.2

- Author URL updated.

## 1.4.1

- Link to the documentation in README.

## 1.4.0

- The dark `@media` block targets `:root:not([data-theme='light'])`: the light theme can be forced on dark-scheme devices.
- `[data-theme='light']` block with light values of semantic tokens for light containers inside a dark page.
