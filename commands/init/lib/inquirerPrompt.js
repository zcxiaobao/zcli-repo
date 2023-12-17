import semver from "semver";
import validatePackageName from "validate-npm-package-name";
import { ADD_TYPE_LIST } from "./initDetail.js";
export const projectNamePrompt = {
  name: "projectName",
  type: "input",
  message: "Please choose a correct project name:",
  validate: async (input) => {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        const result = validatePackageName(input);
        if (!result.validForNewPackages) {
          reject(
            `Invalid project name: "${input}". Please choose a correct project name.`
          );
          return;
        } else {
          resolve(true);
        }
      }, 0);
    });
    return true;
  },
};

export const typePrompt = {
  message: "请选择初始化类型",
  type: "list",
  name: "type",
  choices: ADD_TYPE_LIST,
};

export const projectVersionPrompt = (type) => ({
  type: "input",
  name: "projectVersion",
  message: `请输入${type}版本号`,
  default: "1.0.0",
  validate: async (v) => {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!!!semver.valid(v)) {
          reject("请输入合法的版本号");
          return;
        } else {
          resolve(true);
        }
      }, 0);
    });
    return true;
  },
  filter: function (v) {
    if (!!semver.valid(v)) {
      return semver.valid(v);
    } else {
      return v;
    }
  },
});

export const templatePrompt = (type, template) => ({
  type: "list",
  name: "projectTemplate",
  message: `请选择${type}模板`,
  choices: createTemplateChoice(template),
});

export const componentDescirptionPrompt = {
  type: "input",
  name: "componentDescription",
  message: "请输入组件描述信息",
  default: "",
  validate: async (v) => {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!v) {
          reject("请输入组件描述信息");
          return;
        }
        resolve(true);
      }, 0);
    });
    return true;
  },
};

export const isNeedInstallDepAndRunPrompt = {
  type: "confirm",
  name: "isNeedInstallDepAndRun",
  message: "是否需要安装依赖并运行项目",
  default: true,
};

function createTemplateChoice(template) {
  return template.map((item) => ({
    value: item.npmName,
    name: item.name,
  }));
}
