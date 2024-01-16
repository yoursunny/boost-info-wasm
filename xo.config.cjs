/** @typedef {import("xo").Options} XoOptions */

/** @type {import("@yoursunny/xo-config")} */
const { js, ts, merge } = require("@yoursunny/xo-config");

/** @type {XoOptions} */
const overrides = {
  rules: {
    "@typescript-eslint/no-require-imports": "off",
    "unicorn/no-array-for-each": "off",
    "unicorn/no-array-method-this-argument": "off",
  },
};

/** @type {XoOptions} */
module.exports = {
  ...merge(js, overrides),
  overrides: [
    {
      files: [
        "**/*.ts",
      ],
      ...merge(js, ts, overrides),
    },
  ],
};
