import path from "node:path";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { glob } from "glob";
import ejs from "ejs";
import {
  pathExistsSync,
  emptyDirSync,
  ensureDirSync,
  copySync,
  outputFileSync,
} from "fs-extra/esm";
import validatePackageName from "validate-npm-package-name";
import log from "@zctools/log";
import Command from "@zctools/command";
import Package from "@zctools/package";

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
    await this.downloadTemplate();
    await this.installTemplate();
  }

  async prepare() {
    await this.generateDirCheck();
    this.projectInfo = await this.getProjectInfo();
  }

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
    if (projectInfo.projectName) {
      projectInfo.className = projectInfo.projectName;
      projectInfo.name = projectInfo.projectName;
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion;
    }
    if (projectInfo.componentDescription) {
      projectInfo.description = projectInfo.componentDescription;
    }
    return projectInfo;
  }

  // 下载模板
  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = TEMPLATES.find(
      (item) => item.npmName === projectTemplate
    );
    const targetPath = path.resolve(process.env.CLI_HOME_PATH, "termplate");
    const storeDir = path.resolve(targetPath, "node_modules");
    const { npmName, version } = templateInfo;
    this.templateInfo = templateInfo;
    const templatePkg = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });

    if (!(await templatePkg.exists())) {
      const spinner = ora(`正在下载模板${npmName}@${version}...`).start();
      try {
        await templatePkg.install();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop();
        if (await templatePkg.exists()) {
          this.templatePkg = templatePkg;
          log.success("模板下载成功");
        }
      }
    } else {
      const spinner = ora(`正在更新模板${npmName}@${version}...`).start();
      try {
        await templatePkg.update();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop();
        if (await templatePkg.exists()) {
          this.templatePkg = templatePkg;
          log.success("模板更新成功");
        }
      }
    }
  }

  // 安装模板
  async installTemplate() {
    const rootDir = process.cwd();
    const installDirPath = path.resolve(rootDir, this.projectInfo.projectName);
    const templatePath = path.resolve(
      this.templatePkg.cacheFilePath,
      "template"
    );
    const spinner = ora(`正在安装模板...`).start();
    try {
      ensureDirSync(templatePath);
      ensureDirSync(installDirPath);
      copySync(templatePath, installDirPath);
    } catch (e) {
      log.error(e);
    } finally {
      spinner.stop();
      log.success("模板安装成功");
    }
    await this.ejsRender();
  }
  // 渲染动态模板
  async ejsRender() {
    const { projectName } = this.projectInfo;
    const templateIgnore = this.templateInfo.ignore || [];
    const dirPath = path.resolve(process.cwd(), projectName);
    const ejsRenderIgnore = ["**/node_modules/**", ...templateIgnore];
    return new Promise(async (resolve, reject) => {
      try {
        const files = await glob("**", {
          cwd: dirPath,
          ignore: ejsRenderIgnore,
          nodir: true,
        });
        Promise.all(
          files.map((file) => {
            const filePath = path.resolve(dirPath, file);
            return new Promise((resolve1, reject1) => {
              ejs.renderFile(filePath, this.projectInfo, {}, (err, content) => {
                if (err) {
                  reject1(err);
                }
                console.log(content);
                outputFileSync(filePath, content);
                resolve1(content);
              });
            });
          })
        ).then(resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
  }
  // 自动安装依赖并启动项目
  async installRepoAndRun() {}

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
