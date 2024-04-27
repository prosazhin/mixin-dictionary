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
  },
];

const DEFAULT_VALUE = {
  platforms: ['css', 'less', 'scss'],
  source: ['tokens/**/*.json'],
  output: './styles',
  mediaAliases: ['screen', 'breakpoint'],
};

const PLATFORMS_FOR_MEDIA_QUERIES = ['less', 'scss'];

export { DEFAULT_OPTIONS, DEFAULT_VALUE, PLATFORMS_FOR_MEDIA_QUERIES };
