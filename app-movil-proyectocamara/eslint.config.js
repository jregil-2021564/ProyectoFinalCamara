// eslint.config.js
import expoConfig from "eslint-config-expo/flat.js";

export default [
  ...expoConfig,
  {
    rules: {
      "no-unused-vars": "warn",
    },
  },
];