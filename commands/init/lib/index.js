import path from "node:path";
import inquirer from "inquirer";
import chalk from "chalk";
import { pathExistsSync, emptyDirSync } from "fs-extra/esm";
import validatePackageName from "validate-npm-package-name";
import log from "@zctools/log";
import Command from "@zctools/command";

import { TEMPLATES, ADD_TYPE_LIST, ADD_TYPE } from "./initDetail.js";
import {
  typePrompt,
  projectNamePrompt,
  projectVersionPrompt,
  templatePrompt,
  componentDescirptionPrompt,
} from "./inquirerPrompt.js";
class InitCommand extends Command {
  initialize() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._cmd.force;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  async execute() {
    await this.prepare();
    console.log("execute init project");
  }

  async prepare() {
    await this.generateDirCheck();
    this.projectInfo = await this.getProjectInfo();
  }
  async downloadTemplate() {}
  async installTemplate() {}
  async successAndInstallRepo() {}

  // 检查项目目录
  async generateDirCheck() {
    const cwd = process.cwd();
    this.targetDir = path.resolve(cwd, this.projectName || ".");
    if (pathExistsSync(this.targetDir)) {
      if (this.force) {
        await emptyDirSync(this.targetDir);
      } else {
        const { ok } = await inquirer.prompt([
          {
            name: "ok",
            type: "confirm",
            message: `Generate project in current directory?`,
          },
        ]);
        if (!ok) {
          return;
        } else {
          const { action } = await inquirer.prompt([
            {
              name: "action",
              type: "list",
              message: `Target directory ${chalk.cyan(
                this.targetDir
              )} already exists. Pick an action:`,
              choices: [
                { name: "Overwrite", value: "overwrite" },
                { name: "Merge", value: "merge" },
                { name: "Cancel", value: false },
              ],
            },
          ]);
          if (!action) {
            return;
          } else if (action === "overwrite") {
            console.log(`\nRemoving ${chalk.cyan(this.targetDir)}...`);
            await emptyDirSync(this.targetDir);
          }
        }
      }
      return true;
    }
  }
  // 获取项目模板信息
  async getProjectInfo() {
    let projectInfo = {};
    const projectPrompt = [];
    // 1. 选择创建项目或者组件
    const { type } = await inquirer.prompt(typePrompt);
    this.template = TEMPLATES.filter((template) => template.tag.includes(type));
    // 2. 获取项目名称
    if (this.checkProjectName()) {
      projectInfo.projectName = this.projectName;
    } else {
      projectPrompt.push(projectNamePrompt);
    }
    // 2. 选择版本
    projectPrompt.push(projectVersionPrompt(type));
    // 3. 获取模板信息
    projectPrompt.push(templatePrompt(type, this.template));
    // 4. 交互式获取详情
    if (type === ADD_TYPE.PROJECT) {
      const project = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...project,
      };
    } else if (type === ADD_TYPE.COMPONENT) {
      projectPrompt.push(componentDescirptionPrompt);
      const component = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...component,
      };
    }
    log.verbose(projectInfo);
    return projectInfo;
  }

  // 检查项目名称
  checkProjectName() {
    const isValidName = validatePackageName(this.projectName);
    if (isValidName.validForNewPackages) {
      return true;
    }
    return false;
  }
}

export default function (argv) {
  return new InitCommand(argv);
}
