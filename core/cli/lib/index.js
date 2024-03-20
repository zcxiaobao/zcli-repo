import { homedir } from "os";
import path from "node:path";
import { readFileSync } from "node:fs";
import semver from "semver";
import chalk from "chalk";
import log from "@zctools/log";
import { program, Command } from "commander";
import leven from "leven";
import exec from "@zctools/exec";
import dotenv from "dotenv";
import { pathExists } from "path-exists";
import constant from "./const.js";
import { getAmendFiles, getCommitFiles } from "@zctools/git-util";

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
    .option("-d,--debug", "是否开启调试模式", false)
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "");

  // 指定targetPath 方便本地调试使用
  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = this.opts().targetPath;
  });
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
    .action(exec);

  const lint = new Command("lint");
  lint.command("init").action(exec);
  lint
    .command("scan")
    .description("一键扫描：对项目进行代码规范问题扫描")
    .option("-q, --quiet", "仅报告错误信息 - 默认: false")
    .option("-o, --output-report", "输出扫描出的规范问题日志")
    .option("-i, --include <dirpath>", "指定要进行规范扫描的目录")
    .option("--no-ignore", "忽略 eslint 的 ignore 配置文件和 ignore 规则")
    .action(async (cmd, ...args) => {
      const cwd = process.cwd();
      exec(
        {
          cwd,
          fix: false,
          include: cmd.include || cwd,
          quiet: Boolean(cmd.quiet),
          outputReport: Boolean(cmd.outputReport),
          ignore: cmd.ignore, // 对应 --no-ignore
        },
        ...args
      );
    });

  lint
    .command("commit-msg-scan")
    .description("commit message 检查: git commit 时对 commit message 进行检查")
    .action(() => {
      const result = spawn.sync("commitlint", ["-E", "HUSKY_GIT_PARAMS"], {
        stdio: "inherit",
      });

      if (result.status !== 0) {
        process.exit(result.status);
      }
    });

  lint
    .command("commit-file-scan")
    .description("代码提交检查: git commit 时对提交代码进行规范问题扫描")
    .option(
      "-s, --strict",
      "严格模式，对 warn 和 error 问题都卡口，默认仅对 error 问题卡口"
    )
    .action(async (cmd, ...args) => {
      // git add 检查
      const files = await getAmendFiles();
      if (files)
        log.warn(`exits many changes not staged for commit: \n${files}\n`);

      await exec(
        {
          cwd,
          include: cwd,
          quiet: !cmd.strict,
          files: await getCommitFiles(),
          isCommitLint: true,
        },
        ...args
      );
    });

  lint
    .command("fix")
    .description("一键修复：自动修复项目的代码规范扫描问题")
    .option("-i, --include <dirpath>", "指定要进行修复扫描的目录")
    .option("--no-ignore", "忽略 eslint 的 ignore 配置文件和 ignore 规则")
    .action(async (cmd, ...args) => {
      await exec(
        {
          cwd,
          fix: true,
          include: cmd.include || cwd,
          ignore: cmd.ignore, // 对应 --no-ignore
        },
        ...args
      );
    });

  program.addCommand(lint);
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
  if (!pathExists(homedir())) {
    throw new Error(chalk.red("当前用户主目录不存在"));
  }
};

// 检察环境变量
const checkEnvVaribles = function () {
  const dotenvPath = path.resolve(homedir(), ".env");
  if (pathExists(dotenvPath)) {
    dotenv.config({ path: dotenvPath });
  }
  createCliDefaultConfig();
};

// 配置 cli 环境变量

const createCliDefaultConfig = function () {
  if (process.env.CLI_HOME) {
    process.env.CLI_HOME_PATH = path.join(homedir(), process.env.CLI_HOME);
  } else {
    process.env.CLI_HOME_PATH = path.join(homedir(), constant.DEFAULT_CLI_HOME);
  }
};

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

export default core;
export const a = 10;
