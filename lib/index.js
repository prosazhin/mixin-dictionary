import { dirname } from 'path';
import { fileURLToPath } from 'url';
import buildTokens from './build-tokens.js';
import buildMixins from './build-mixins.js';
import getConfig from './utils/get-config.js';
import { redLog } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function build(options) {
  const { check, platforms, source, output, mediaAliases } = getConfig(options);

  if (!check) {
    redLog('Build completed with an error, check config');
    return;
  }

  const newOptions = { platforms, source, output, mediaAliases, __dirname };

  await buildTokens(newOptions);
  await buildMixins(newOptions);
}
