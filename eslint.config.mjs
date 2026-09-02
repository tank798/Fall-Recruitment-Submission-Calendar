import nextTypeScriptConfig from "eslint-config-next/typescript";

/**
 * 使用 Next 16 的 flat config，同时把生成目录和本地数据快照排除在检查之外。
 * 规则保持轻量，避免 lint 变成阻碍日常记录的小型编译器。
 */
export default [
  ...nextTypeScriptConfig,
  {
    ignores: [".next/**", "data/backups/**", "data/quarantine/**", "秋招时间表-*.xlsx"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
