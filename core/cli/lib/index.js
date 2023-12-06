import { homedir } from "os";
import { existsSync, readFileSync } from "node:fs";
import semver from "semver";
import chalk from "chalk";
import log from "@zctools/log";
import { program } from "commander";
import leven from "leven";
import initCommand from "@zctools/init";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url))
);
const core = function () {
  try {
    prepare();
    commandDefaultConfig();
    registerCommand();
  } catch (e) {
    log.error(e.message);
    process.exit(1);
  }
};

export default core;

// 脚手架准备工作
const prepare = async function () {
  checkNodeVersion();
  checkUserHomePath();
  checkEnvVaribles();
  await checkGlobalUpdate();
};

// 脚手架默认配置
const commandDefaultConfig = function () {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d,--debug", "是否开启调试模式", false);

  program.on("option:debug", function () {
    if (this.opts().debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose("debug mode launched");
  });

  // add some useful into on help
  program.on("--help", function () {
    console.log();
    console.log(
      `  Run ${chalk.cyan(
        `zctools <command> --help`
      )} for detailed usage of given command.`
    );
    console.log();
  });

  program.on("command:*", function ([cmd]) {
    program.outputHelp();
    console.log(`  ` + chalk.red(`Unknown command: ${chalk.yellow(cmd)}.`));
    console.log();
    suggestCommands(cmd);
    console.log();
    process.exit(1);
  });
};

// 脚手架命令注册
const registerCommand = function () {
  program
    .command("init [project-name]")
    .description("initialize a new project or component")
    .option("-f,--force", "是否强制覆盖已存在的文件", false)
    .action(initCommand);
  program.parse(process.argv);
};

// 检查 node 版本
const checkNodeVersion = function () {
  if (!semver.satisfies(process.version, pkg.engines.node)) {
    throw new Error(
      chalk.red(
        `当前 Node.js 版本不满足要求，请使用 ${pkg.engines.node} 及以上版本`
      )
    );
  }
};

// 检查用户主目录
const checkUserHomePath = function () {
  if (!existsSync(homedir())) {
    throw new Error(chalk.red("当前用户主目录不存在"));
  }
};

// 检察环境变量
const checkEnvVaribles = function () {};

// 检查 zctools 版本
const checkGlobalUpdate = async function () {};

// command 输入错误时，智能提示
const suggestCommands = function (unknownCommand) {
  const availableCommands = program.commands.map((cmd) => cmd._name);
  let suggestion;

  availableCommands.forEach((cmd) => {
    let isBestMatch =
      leven(cmd, unknownCommand) < leven(suggestion || "", unknownCommand);
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd;
    }
  });

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`));
  }
};
