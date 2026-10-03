import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { build } from '../lib/index.js';
import { generate } from '../lib/generate.js';
import { getFixtures, inDir, listFiles, makeTempDir, readFixture } from './helpers/fixtures.js';

function silence(t) {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
}

for (const name of getFixtures()) {
  test(`build: ${name}`, async (t) => {
    silence(t);
    const { dir, config, expectedDir } = readFixture(name);
    const output = makeTempDir('mixin-dictionary-');

    try {
      await inDir(dir, () => build({ ...config, output }));

      assert.deepEqual(listFiles(output), listFiles(expectedDir));

      for (const file of listFiles(expectedDir)) {
        assert.equal(
          fs.readFileSync(path.join(output, file), 'utf8'),
          fs.readFileSync(path.join(expectedDir, file), 'utf8'),
          `${name}: ${file}`,
        );
      }
    } finally {
      fs.rmSync(output, { recursive: true, force: true });
    }
  });
}

test('generate() returns the same files as build()', async (t) => {
  silence(t);
  const { dir, config, expectedDir } = readFixture('readme');
  const tokens = JSON.parse(fs.readFileSync(path.join(dir, 'tokens', 'base.json'), 'utf8'));
  const files = await generate({ tokens, platforms: config.platforms });

  assert.deepEqual(Object.keys(files).sort(), listFiles(expectedDir));

  for (const file of listFiles(expectedDir)) {
    assert.equal(files[file], fs.readFileSync(path.join(expectedDir, file), 'utf8'), file);
  }
});

const NUMBER_TOKENS = {
  radius: { 4: { $type: 'number', $value: 4 }, none: { $type: 'number', $value: 0 } },
  font: { weight: { bold: { $type: 'number', $value: 700 } } },
  button: { gap: { $type: 'number', $value: 8 } },
};

test('numberUnit: px by default, rem divides by 16, false keeps numbers', async (t) => {
  silence(t);
  const css = async (options) =>
    (await generate({ tokens: NUMBER_TOKENS, platforms: ['css'], ...options }))['css/index.css'];

  const px = await css({});
  assert.match(px, /--radius-4: 4px;/);
  assert.match(px, /--radius-none: 0;/);
  assert.match(px, /--font-weight-bold: 700;/);
  assert.match(px, /--button-gap: 8;/);

  assert.match(await css({ numberUnit: 'rem' }), /--radius-4: 0\.25rem;/);
  assert.match(await css({ numberUnit: false }), /--radius-4: 4;/);
  assert.match(await css({ dimensionAliases: ['button'] }), /--button-gap: 8px;/);
});

test('numberUnit: typography line-height stays unitless even in a dimension category', async (t) => {
  silence(t);
  const tokens = {
    text: { h1: { $type: 'typography', $value: { fontSize: { value: 32, unit: 'px' }, lineHeight: 1.5 } } },
  };
  const { 'scss/index.scss': scss } = await generate({ tokens, platforms: ['scss'], dimensionAliases: ['text'] });

  assert.match(scss, /\$text-h1-line-height: 1\.5;/);
  assert.match(scss, /\$text-h1-font-size: 32px;/);
});
