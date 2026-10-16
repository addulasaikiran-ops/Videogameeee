export function assetUrl(path) {
  if (typeof path !== 'string' || !path.trim()) throw new TypeError('assetUrl(path) expects a non-empty string.');
  return `${import.meta.env.BASE_URL}${path.trim().replace(/^\\/+/, '')}`;
}
