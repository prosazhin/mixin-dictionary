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

export { createProp, createMixin };
