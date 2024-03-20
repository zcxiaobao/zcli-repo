import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import { STYLELINT_IGNORE_PATTERN } from "../scanInitDetail.js";

/**
 * 获取 Stylelint 配置
 */
export function getStylelintConfig(opts, pkg, config) {
  const { cwd, fix } = opts;
  if (config.enableStylelint === false) return {};

  const lintConfig = {
    fix: Boolean(fix),
    allowEmptyInput: true,
  };

  if (config.stylelintOptions) {
    // 若用户传入了 stylelintOptions，则用用户的
    Object.assign(lintConfig, config.stylelintOptions);
  } else {
    // 根据扫描目录下有无lintrc文件，若无则使用默认的 lint 配置
    const lintConfigFiles = glob.sync(".stylelintrc?(.@(js|yaml|yml|json))", {
      cwd,
    });
    if (lintConfigFiles.length === 0 && !pkg.stylelint) {
      lintConfig.config = {
        extends: "encode-fe-stylelint-config",
      };
    }

    // 根据扫描目录下有无lintignore文件，若无则使用默认的 ignore 配置
    const ignoreFilePath = path.resolve(cwd, ".stylelintignore");
    if (!fs.existsSync(ignoreFilePath)) {
      lintConfig.ignorePattern = STYLELINT_IGNORE_PATTERN;
    }
  }

  return lintConfig;
}
