export default (config) => {
  const needDep = [];
  if (config.enableESLint) {
    needDep.push("eslint-config-zctools");
  }
  if (config.enableStylelint) {
    needDep.push("@zctools/stylelint-config");
  }
  if (config.enableMarkdownlint) {
    needDep.push("@zctools/markdownlint-config");
  }
  if (config.enablePrettier) {
    needDep.push("eslint-config-prettier", "eslint-plugin-prettier");
  }
  needDep.push("@zctools/commitlint-config", "@commitlint/cli", "husky");
  return needDep;
};
