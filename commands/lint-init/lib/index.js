import path from "node:path";
import fsExtra from "fs-extra";
import inquirer from "inquirer";
import Command from "@zctools/command";
import { getNpmManager } from "@zctools/command-exists";
import execuCommand from "@zctools/command-exec";
import log from "@zctools/log";
import {
  eslintTypePrompt,
  markdownlintPrompt,
  stylelintPrompt,
  prettierPrompt,
} from "./inquirerPrompt.js";
import generateTemplate from "./generate-templete.js";
import generateNeedDep from "./generate-dep.js";
import conflictResolve from "./conflict-resolve.js";

// 后续等待抽离
const PKG_NAME = "zctools";
const LINT_NAME = "lint";

class LintInitCommand extends Command {
  initialize() {
    console.log("lint init initialize");
    this.isVscode = this._argv["vscode"];
    this.cwd = process.cwd();
    this.config = {};
    this.pkgPath = path.resolve(this.cwd, "package.json");
    this.pkg = fsExtra.readJSONSync(this.pkgPath);
    this.pkgName = this.pkg.name;
  }
  async execute() {
    await this.prepare();
    await this.checkConfilct();
    await this.intallLintDep();
    this.updatePackageJson();
    this.addCommitHusky();
    this.writeLintConfig();
  }

  async prepare() {
    this.config.enableESLint = true;
    this.config.eslintType = await chooseEslintType();
    this.config.enableMarkdownlint = await chooseEnableMarkdownLint();
    this.config.enablePrettier = await chooseEnablePrettier();
    this.config.enableStylelint = await chooseEnableStylelint(
      !/node/.test(this.config.eslintType)
    );
    this.npmManager = getNpmManager();
  }

  async checkConfilct() {
    console.log(`Step 5. 检查并处理项目中可能存在的依赖和配置冲突`);
    this.pkg = await conflictResolve(this.cwd);
    log.success("已完成项目依赖和配置冲突检查处理");
  }

  async intallLintDep() {
    console.log(`Step 6. 安装依赖`);
    const dep = generateNeedDep(this.config);
    await execuCommand(this.npmManager, ["add", "-D", ...dep], {
      cwd: this.cwd,
    });
    log.success("依赖安装成功 :D");
  }
  updatePackageJson() {
    this.pkg = fsExtra.readJSONSync(this.pkgPath);
    if (!this.pkg.scripts) this.pkg.scripts = {};
    if (!this.pkg.scripts[`${PKG_NAME}-${LINT_NAME}-scan`]) {
      this.pkg.scripts[
        `${PKG_NAME}-${LINT_NAME}-scan`
      ] = `${PKG_NAME} ${LINT_NAME} scan`;
    }
    if (!this.pkg.scripts[`${PKG_NAME}-${LINT_NAME}-fix`]) {
      this.pkg.scripts[
        `${PKG_NAME}-${LINT_NAME}-fix`
      ] = `${PKG_NAME} ${LINT_NAME} fix`;
    }
  }

  addCommitHusky() {
    log.info(`Step 7. 配置 git commit 卡点`);
    if (!this.pkg.husky) this.pkg.husky = {};
    if (!this.pkg.husky.hooks) this.pkg.husky.hooks = {};
    this.pkg.husky.hooks[
      "pre-commit"
    ] = `${PKG_NAME} ${LINT_NAME} commit-file-scan`;
    this.pkg.husky.hooks[
      "commit-msg"
    ] = `${PKG_NAME} ${LINT_NAME} commit-msg-scan`;
    fsExtra.writeFileSync(this.pkgPath, JSON.stringify(this.pkg, null, 2));
    log.success(`Step 7. 配置 git commit 卡点成功 :D`);
  }
  writeLintConfig() {
    log.info(`Step 8. 写入配置文件`);
    generateTemplate(this.cwd, this.config);
    log.success(`Step 8. 写入配置文件成功 :D`);

    // 完成信息
    const logs = [`${PKG_NAME}-${LINT_NAME} 初始化完成 :D`].join("\r\n");
    log.success(logs);
  }
}

export default function (argv) {
  return new LintInitCommand(argv);
}

/**
 * 选择项目语言和框架
 */
const chooseEslintType = async () => {
  const { type } = await inquirer.prompt(eslintTypePrompt);
  return type;
};

/**
 * 选择是否启用 stylelint
 * @param defaultValue
 */
const chooseEnableStylelint = async (defaultValue) => {
  const { enable } = await inquirer.prompt(stylelintPrompt(defaultValue));
  return enable;
};

/**
 * 选择是否启用 markdownlint
 */
const chooseEnableMarkdownLint = async () => {
  const { enable } = await inquirer.prompt(markdownlintPrompt);
  return enable;
};

/**
 * 选择是否启用 prettier
 */
const chooseEnablePrettier = async () => {
  const { enable } = await inquirer.prompt(prettierPrompt);
  return enable;
};
