import { DEFAULT_DIMENSION_ALIASES, DEFAULT_NUMBER_UNIT } from './tokens/number-unit.js';

const DEFAULT_OPTIONS = [
  {
    name: 'Platforms',
    value: 'platforms',
  },
  {
    name: 'Source',
    value: 'source',
  },
  {
    name: 'Output',
    value: 'output',
  },
  {
    name: 'Media queries aliases',
    value: 'mediaAliases',
    optional: true,
  },
  {
    name: 'Keyframes aliases',
    value: 'keyframesAliases',
    optional: true,
  },
  {
    name: 'Number unit',
    value: 'numberUnit',
    optional: true,
  },
  {
    name: 'Dimension aliases',
    value: 'dimensionAliases',
    optional: true,
  },
  {
    name: 'Themes',
    value: 'themes',
    optional: true,
  },
];

const DEFAULT_VALUE = {
  platforms: ['css', 'less', 'scss'],
  source: ['tokens/**/*.json'],
  output: './styles',
  mediaAliases: ['screen', 'breakpoint'],
  keyframesAliases: ['keyframes'],
  numberUnit: DEFAULT_NUMBER_UNIT,
  dimensionAliases: DEFAULT_DIMENSION_ALIASES,
  themes: null,
};

const PLATFORMS_FOR_MEDIA_QUERIES = ['less', 'scss'];
const PLATFORMS_FOR_KEYFRAMES = ['less', 'scss'];

const KEYFRAME_MIXIN = {
  less: `\n.keyframes(@name, @content) {
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
`,
  scss: `\n@mixin keyframes($name) {
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
`,
};

export { DEFAULT_OPTIONS, DEFAULT_VALUE, PLATFORMS_FOR_MEDIA_QUERIES, PLATFORMS_FOR_KEYFRAMES, KEYFRAME_MIXIN };
