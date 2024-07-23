// clearCache.js
function clearBuiltInCache() {
  try {
    const moduleKeys = Object.keys(require.cache);
    moduleKeys.forEach((key) => {
      delete require.cache[key];
    });
    console.log('Built-in module cache cleared successfully');
  } catch (error) {
    console.error('Error clearing built-in module cache:', error);
  }
}

module.exports = {
  clearBuiltInCache
};
