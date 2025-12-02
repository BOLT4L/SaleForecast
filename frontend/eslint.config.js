export default {
  ignores: ["dist"],
  files: ["**/*.{ts,tsx}"],
  rules: {
    // disable all rules
    // (some ESLint versions allow this shorthand)
    "no-unused-vars": "off",
    "react-hooks/rules-of-hooks": "off",
    "react-refresh/only-export-components": "off",
  },
};
