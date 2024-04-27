export default function getMixins(tokens) {
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
        category: cur.category,
        tokens: [cur],
      },
    ];
  }, []);
}
