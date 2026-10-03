// Проверка типов публичного API: `npm run test:types` (tsc --noEmit).
import build from 'mixin-dictionary';
import { generate } from 'mixin-dictionary/generate';

async function main(): Promise<void> {
  const written: Record<string, string> = await build({
    platforms: ['css', 'scss'],
    source: ['tokens/*.json'],
    output: './styles',
    themes: { light: ['tokens/themes/light.json'], dark: ['tokens/themes/dark.json'] },
  });

  await build({ config: './config.json' });

  const files = await generate({
    tokens: { font: { h1: { $type: 'typography', $value: { fontSize: '32px', lineHeight: 1.2 } } } },
    platforms: ['less'],
    logger: { warn: (message: string) => console.warn(message) },
  });

  console.log(written, files['less/index.less']);

  // @ts-expect-error unknown platform
  await generate({ tokens: {}, platforms: ['stylus'] });
}

main();
