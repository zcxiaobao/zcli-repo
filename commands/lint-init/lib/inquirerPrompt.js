import { PROJECT_TYPES } from "./lintInitDetail.js";
let step = 0;

export const eslintTypePrompt = {
  type: "list",
  name: "type",
  message: `Step ${++step}. 请选择项目的语言（JS/TS）和框架（React/Vue）类型：`,
  choices: PROJECT_TYPES,
};

export const stylelintPrompt = (defaultValue) => ({
  type: "confirm",
  name: "enable",
  message: `Step ${++step}. 是否需要使用 stylelint（若没有样式文件则不需要）：`,
  default: defaultValue,
});

export const markdownlintPrompt = {
  type: "confirm",
  name: "enable",
  message: `Step ${++step}. 是否需要使用 markdownlint（若没有 Markdown 文件则不需要）：`,
  default: true,
};

export const prettierPrompt = {
  type: "confirm",
  name: "enable",
  message: `Step ${++step}. 是否需要使用 Prettier 格式化代码：`,
  default: true,
};
