import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from '../lib/index.js';
import { generate } from '../lib/generate.js';
import { inDir, makeTempDir, root } from './helpers/fixtures.js';

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'mixin-dictionary.js');

function silence(t) {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
}

function runCli(args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8', stdio: 'pipe' });
    return { code: 0, output: stdout };
  } catch (error) {
    return { code: error.status, output: `${error.stdout}${error.stderr}` };
  }
}

const css = { platforms: ['css'] };

test('B1: missing output folder is created recursively', async (t) => {
  silence(t);
  const tmp = makeTempDir('mixin-dictionary-');
  const output = path.join(tmp, 'deep', 'out');

  try {
    await inDir(path.join(root, 'direct-source'), () => build({ source: ['tokens/base.json'], output, ...css }));
    assert.ok(fs.existsSync(path.join(output, 'css', 'index.css')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('B4: no matched token files is an error with the globs', async (t) => {
  silence(t);
  await assert.rejects(
    () => build({ source: ['nope/*.json', 'missing.json'], output: makeTempDir('td-'), ...css }),
    /No token files matched: nope\/\*\.json, missing\.json/,
  );
});

test('B6: parallel builds do not share a cache', async (t) => {
  silence(t);
  const outputs = [makeTempDir('td-a-'), makeTempDir('td-b-')];

  try {
    await inDir(root, () =>
      Promise.all([
        build({ source: ['direct-source/tokens/base.json'], output: outputs[0], ...css }),
        build({ source: ['direct-source/tokens/ignored.json'], output: outputs[1], ...css }),
      ]),
    );

    assert.match(fs.readFileSync(path.join(outputs[0], 'css/index.css'), 'utf8'), /--color-white: #ffffff;/);
    assert.match(fs.readFileSync(path.join(outputs[1], 'css/index.css'), 'utf8'), /--color-black: #000000;/);
  } finally {
    outputs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
  }
});

test('B8: missing config — one line, exit code 1', () => {
  const { code, output } = runCli(['-c', 'nope.json'], makeTempDir('td-'));
  assert.equal(code, 1);
  assert.match(output, /Config file not found: nope\.json/);
  assert.doesNotMatch(output, /\n\s+at /);
});

test('B8: broken config JSON — one line, exit code 1', () => {
  const cwd = makeTempDir('td-');
  fs.writeFileSync(path.join(cwd, 'config.json'), '{ "version": 4, }');
  const { code, output } = runCli([], cwd);
  assert.equal(code, 1);
  assert.match(output, /Invalid JSON in config file \.\/config\.json/);
  assert.doesNotMatch(output, /\n\s+at /);
});

test('CLI: successful build exits with 0 and matches the snapshot', () => {
  const cwd = makeTempDir('td-');

  try {
    fs.cpSync(path.join(root, 'readme'), cwd, { recursive: true });
    fs.rmSync(path.join(cwd, 'expected'), { recursive: true, force: true });

    const { code } = runCli(['-c', 'config.json'], cwd);

    assert.equal(code, 0);
    assert.equal(
      fs.readFileSync(path.join(cwd, 'expected', 'scss', 'index.scss'), 'utf8'),
      fs.readFileSync(path.join(root, 'readme', 'expected', 'scss', 'index.scss'), 'utf8'),
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('broken reference: token path and file in the message', async (t) => {
  silence(t);
  const dir = makeTempDir('td-');
  fs.mkdirSync(path.join(dir, 'tokens'));
  fs.writeFileSync(
    path.join(dir, 'tokens', 'colors.json'),
    JSON.stringify({ color: { bg: { $value: '{color.nope}', $type: 'color' } } }),
  );

  await assert.rejects(
    () => inDir(dir, () => build({ source: ['tokens/*.json'], output: 'out', ...css })),
    /Token "color\.bg" \(tokens\/colors\.json\) references \{color\.nope\}, which is not defined/,
  );
});

test('typography without fontSize is an error', async () => {
  await assert.rejects(
    () =>
      generate({
        tokens: { font: { h1: { $type: 'typography', $value: { lineHeight: 1.2 } } } },
        logger: { warn() {} },
      }),
    /Token "font\.h1" has \$type "typography" without "fontSize"/,
  );
});

test('mixed "value" and "$value" is an error', async () => {
  await assert.rejects(
    () => generate({ tokens: { a: { value: '1px' }, b: { $value: '2px' } }, logger: { warn() {} } }),
    /Mixed token formats/,
  );
});

test('unknown $type is a warning with the token path', async () => {
  const warnings = [];
  await generate({
    tokens: { color: { a: { $type: 'colour', $value: '#fff' } } },
    ...css,
    logger: { warn: (message) => !message.startsWith('Mixins not found') && warnings.push(message) },
  });
  assert.deepEqual(warnings, ['Token "color.a" has unknown $type "colour", its value is used as is']);
});

test('theme path missing in one of the themes is a warning', async () => {
  const warnings = [];
  await generate({
    tokens: { color: { white: { value: '#fff' } } },
    themes: {
      light: { color: { bg: { value: '#fff' }, fg: { value: '#000' } } },
      dark: { color: { bg: { value: '#000' } } },
    },
    ...css,
    logger: { warn: (message) => !message.startsWith('Mixins not found') && warnings.push(message) },
  });
  assert.equal(warnings.length, 0);

  await generate({
    tokens: { color: { white: { value: '#fff' } } },
    themes: {
      light: { color: { bg: { value: '#fff' } } },
      dark: { color: { bg: { value: '#000' } } },
      contrast: { color: { fg: { value: '#ff0' } } },
    },
    ...css,
    logger: { warn: (message) => !message.startsWith('Mixins not found') && warnings.push(message) },
  });
  assert.match(warnings[0], /not defined in every theme.*color\.bg, color\.fg/);
});
