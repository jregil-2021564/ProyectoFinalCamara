// babel.config.cjs (ARCHIVO NUEVO — créalo en la raíz del proyecto)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};