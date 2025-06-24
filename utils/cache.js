const store = new Map();

function set(key, value, ttlSeconds = 60) {
  store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

module.exports = { get, set };
