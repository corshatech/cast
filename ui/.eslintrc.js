module.exports = {
  /*
   Includes Next.js' base ESLint configuration along with a stricter Core Web
   Vitals rule-set.  The "next/core-web-vitals" base configuration is stricter
   than the less strict base configuration "next".  The "next/core-web-vitals"
   includes "eslint-plugin-react", "eslint-plugin-react-hooks" and
   "eslint-plugin-next".
    See https://nextjs.org/docs/basic-features/eslint for more information.
   */
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:storybook/recommended",
    "prettier",
  ],
  ignorePatterns: ["next-env.d.ts", "next.config.js"],
  rules: {
    quotes: [1, "double"],
    semi: [1, "always"],
    "object-curly-spacing": [1, "always"],
    "multiline-comment-style": ["warn", "bare-block"],
    "max-len": [
      "warn",
      {
        code: 120,
        comments: 100, // Prettier will "generally strive" to wrap code but not comments at 100
        tabWidth: 2,
        ignoreUrls: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    "prefer-const": "error",
    /* The no-unused-vars rule does not properly function with Typescript so we
       need to disable it in favor of the @typescript-eslint version. */
    "no-unused-vars": "off",
    "no-console": "error",
    "@typescript-eslint/no-unused-vars": ["error"],
    "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
    "arrow-body-style": ["error", "as-needed"],
    "react/jsx-curly-brace-presence": [
      1,
      { props: "never", children: "never" },
    ],
  },
};
