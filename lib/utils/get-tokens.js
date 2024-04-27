function findTokensWithMixins(data, result, category) {
  if (data.hasOwnProperty('value')) {
    result.push({ ...data, category });
    return;
  }
  Object.keys(data).forEach((key) => {
    findTokensWithMixins(data[key], result, !category ? key : category);
  });
}

export default function getTokens(data) {
  const result = [];
  findTokensWithMixins(data, result, null);
  return result;
}
