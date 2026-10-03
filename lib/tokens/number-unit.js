// Голые числа DTCG (`$type: "number"`, FLOAT-переменные Figma) в размерных категориях → число с единицей.
// Без единицы `--radius-4: 4` в CSS не работает. Старый формат (`value`) не затрагивается.

const ROOT_FONT_SIZE = 16;

// Категории (первый сегмент пути токена, в kebab-case), числа в которых — размеры.
// `lineHeight`, `fontWeight`, `opacity`, `zIndex` и т. п. сюда не входят: там числа остаются как есть.
const DEFAULT_DIMENSION_ALIASES = [
  'spacing',
  'space',
  'size',
  'sizes',
  'radius',
  'radii',
  'border-radius',
  'border-width',
  'width',
  'height',
  'gap',
  'blur',
  'font-size',
  'container',
  'stroke',
];

// Последний сегмент пути: числа тут безразмерные в любой категории (в т. ч. подсвойства типографики).
const UNITLESS_NAMES = new Set(['line-height', 'font-weight', 'opacity', 'z-index']);

const DEFAULT_NUMBER_UNIT = 'px';

function toKebab(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function round(value) {
  return Number(value.toFixed(4));
}

// units — { numberUnit: 'px' | 'rem' | false, dimensionAliases: string[] }.
// Нормализованное значение возвращается без изменений, если это не размерное число.
function applyNumberUnit(value, { type, path }, units) {
  if (!units || !units.numberUnit || typeof value !== 'number' || value === 0) {
    return value;
  }

  if (path?.length && UNITLESS_NAMES.has(toKebab(path[path.length - 1]))) {
    return value;
  }

  const isDimension = type === 'dimension';
  const isBareNumber = type === 'number' || type === undefined;
  const aliases = units.dimensionAliases ?? DEFAULT_DIMENSION_ALIASES;
  const inDimensionCategory = path?.length > 0 && aliases.includes(toKebab(path[0]));

  if (!isDimension && !(isBareNumber && inDimensionCategory)) {
    return value;
  }

  return units.numberUnit === 'rem' ? `${round(value / ROOT_FONT_SIZE)}rem` : `${value}px`;
}

export { applyNumberUnit, DEFAULT_DIMENSION_ALIASES, DEFAULT_NUMBER_UNIT };
