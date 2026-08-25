{
  "root": true,
  "extends": ["eslint:recommended", "plugin:svelte/recommended", "prettier"],
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 2022
  },
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "rules": {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
