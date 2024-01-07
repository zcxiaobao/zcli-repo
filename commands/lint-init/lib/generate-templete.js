import path from "node:path";
import fsExtra from "fs-extra";
import { glob } from "glob";
import ejs from "ejs";
import { dirname } from "dirname-filename-esm";
import {
  ESLINT_IGNORE_PATTERN,
  STYLELINT_FILE_EXT,
  STYLELINT_IGNORE_PATTERN,
  MARKDOWN_LINT_IGNORE_PATTERN,
} from "./lintInitDetail.js";

export default (cwd, data, vscode) => {
  const templatePath = path.resolve(dirname(import.meta), "../config");
  const templates = glob.sync(`${vscode ? "_vscode" : "**"}/*.ejs`, {
    cwd: templatePath,
  });
  console.log(data);
  for (const name of templates) {
    const filepath = path.resolve(
      cwd,
      name.replace(/\.ejs$/, "").replace(/^_/, ".")
    );
    let content = ejs.render(
      fsExtra.readFileSync(path.resolve(templatePath, name), "utf8"),
      {
        eslintIgnores: ESLINT_IGNORE_PATTERN,
        stylelintExt: STYLELINT_FILE_EXT,
        stylelintIgnores: STYLELINT_IGNORE_PATTERN,
        markdownLintIgnores: MARKDOWN_LINT_IGNORE_PATTERN,
        ...data,
      }
    );

    // 合并 vscode config
    // if (/^_vscode/.test(name)) {
    //   content = mergeVSCodeConfig(filepath, content);
    // }

    // 跳过空文件
    if (!content.trim()) continue;

    fsExtra.outputFileSync(filepath, content, "utf8");
  }
};
