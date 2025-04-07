function findTokensWithMixins(data, result) {
  if (data.hasOwnProperty('value')) {
    result.push(data);
    return;
  }
  Object.keys(data).forEach((key) => {
    findTokensWithMixins(data[key], result);
  });
}

function getTokens(data) {
  const result = [];
  findTokensWithMixins(data, result);
  return result;
}

function getMixins(tokens) {
  if (!tokens.length) {
    return [];
  }

  return tokens.reduce((acc, cur) => {
    const index = acc.findIndex(({ name }) => name === cur.mixin);

    if (index >= 0) {
      acc[index].tokens.push(cur);
      return acc;
    }

    return [
      ...acc,
      {
        name: cur.mixin,
        category: cur.attributes.category,
        tokens: [cur],
      },
    ];
  }, []);
}

function createProp(name, value, isMedia, isAnimation) {
  let result = {};

  if (isMedia) {
    result = {
      less: `(${name}-width: @${value})`,
      scss: `(${name}-width: $${value})`,
    };
  } else if (isAnimation) {
    result = {
      less: `${name}: @${value};`,
      scss: `${name}: $${value};`,
    };
  } else {
    result = {
      css: `${name}: var(--${value});`,
      less: `${name}: @${value};`,
      scss: `${name}: $${value};`,
    };
  }

  return result;
}

function createMixin(name, props, isMedia, isAnimation) {
  let result = {};
  const separator = isMedia ? ' and ' : ' ';

  if (isMedia) {
    result = {
      less: `.${name}(@rules) { @media all and ${props.less.join(separator)} { @rules(); } }\n`,
      scss: `@mixin ${name} { @media all and ${props.scss.join(separator)} { @content; } }\n`,
    };
  } else if (isAnimation) {
    result = {
      less: `.keyframes(${name}, { ${Object.keys(props.less)
        .map((key) => `${key} { ${props.less[key].join(separator)} }`)
        .join(separator)} });\n`,
      scss: `@include keyframes(${name}) { ${Object.keys(props.scss)
        .map((key) => `${key} { ${props.scss[key].join(separator)} }`)
        .join(separator)} };\n`,
    };
  } else {
    result = {
      css: `  --${name}: { ${props.css.join(separator)} };\n`,
      less: `.${name}() { ${props.less.join(separator)} }\n`,
      scss: `@mixin ${name} { ${props.scss.join(separator)} }\n`,
    };
  }

  return result;
}

export { getTokens, getMixins, createProp, createMixin };
