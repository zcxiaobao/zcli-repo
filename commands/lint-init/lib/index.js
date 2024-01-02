import path from "node:path";
import fsExtra from "fs-extra";
import inquirer from "inquirer";
import Command from "@zctools/command";

import {
  eslintTypePrompt,
  markdownlintPrompt,
  stylelintPrompt,
  prettierPrompt,
} from "./inquirerPrompt.js";

import conflictResolve from "./conflict-resolve.js";

class LintInitCommand extends Command {
  initialize() {
    console.log("lint init initialize");
    this.isVscode = this._argv["vscode"];
    this.cwd = process.cwd();
    this.config = {};
    this.pkgPath = path.resolve(this.cwd, "package.json");
    this.pkg = fsExtra.readJSONSync(this.pkgPath);
    this.pkgName = pkg.name;
  }
  async execute() {
    console.log("lint init execute");
    await this.prepare();
    await this.checkConfilct();
    await this.intallLintDep();
    // await this.downloadTemplate();
    // await this.installTemplate();
    // await this.installRepoAndRun();
  }

  async prepare() {
    this.config.enableESLint = true;
    this.config.enlintType = await chooseEslintType();

    this.config.enableMarkdownlint = await chooseEnableMarkdownLint();
    this.config.enablePrettier = await chooseEnablePrettier();
    this.config.enableStylelint = await chooseEnableStylelint(
      !/node/.test(this.config.eslintType)
    );
    this.npmManager = "npm";
  }

  async checkConfilct() {
    console.log(`Step 5. 检查并处理项目中可能存在的依赖和配置冲突`);
    this.pkg = conflictResolve(this.cwd);
    log.success("已完成项目依赖和配置冲突检查处理");
  }

  async intallLintDep() {
    console.log(`Step 6. 安装依赖`);
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
