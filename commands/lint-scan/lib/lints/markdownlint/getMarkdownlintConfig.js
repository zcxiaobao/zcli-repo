import path from "path";
import { glob } from "glob";
import markdownLint from "markdownlint";
import markdownLintConfig from "@zctools/markdownlint-config" assert { type: "json" };

/**
 * 获取 Markdownlint 配置
 */
export function getMarkdownlintConfig(opts, pkg, config) {
  const { cwd } = opts;
  const lintConfig = {
    fix: Boolean(opts.fix),
    resultVersion: 3,
  };

  if (config.markdownlintOptions) {
    // 若用户传入了 markdownlintOptions，则用用户的
    Object.assign(lintConfig, config.markdownlintOptions);
  } else {
    const lintConfigFiles = glob.sync(".markdownlint(.@(yaml|yml|json))", {
      cwd,
    });
    if (lintConfigFiles.length === 0) {
      lintConfig.config = markdownLintConfig;
    } else {
      lintConfig.config = markdownLint.readConfigSync(
        path.resolve(cwd, lintConfigFiles[0])
      );
    }
  }

  return lintConfig;
}
