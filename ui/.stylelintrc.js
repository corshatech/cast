module.exports = {
  extends: ["stylelint-config-standard-scss", "stylelint-config-prettier-scss"],
  plugins: ["stylelint-scss"],
  rules: {
    "selector-pseudo-class-no-unknown": [
      true,
      { ignorePseudoClasses: "export" },
    ],
    "property-no-unknown": [true, { ignoreSelectors: [":export"] }],
  },
};
