import Command from "@zctools/command";
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import { doESLint } from "./lints/eslint/doESLint.js";
import { doMarkdownlint } from "./lints/markdownlint/doMarkdownlint.js";
import { doPrettier } from "./lints/prettier/doPrettier.js";
import { doStylelint } from "./lints/stylelint/doStylelint.js";
import { PKG_NAME } from "./lints/scanInitDetail.js";
import printReport from "./lints/print-report.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

class LintScanCommand extends Command {
  initialize() {
    console.log("lint scan initialize");
  }
  async execute() {
    const checking = ora();
    const { fix, isCommitLint } = this._argv[0];
    if (fix) {
      checking.start(`执行 ${PKG_NAME} 代码修复`);
    } else if (isCommitLint) {
      checking.start(`执行 ${PKG_NAME} 提交检查`);
    } else {
      checking.start(`执行 ${PKG_NAME} 代码检查`);
    }

    const { results, errorCount, warningCount, runErrors } = await this.scan(
      this._argv[0]
    );
    // 修复模式
    if (fix) {
      checking.succeed();
      if (results.length > 0) printReport(results, true);
    } else if (isCommitLint) {
      if (errorCount > 0 || (cmd.strict && warningCount > 0)) {
        checking.fail();
        printReport(results, false);
        process.exitCode = 1;
      } else {
        checking.succeed();
      }
    } else {
      let type = "succeed";
      if (runErrors.length > 0 || errorCount > 0) {
        type = "fail";
      } else if (warningCount > 0) {
        type = "warn";
      }
      checking[type]();
      if (results.length > 0) printReport(results, false);
      // 输出 lint 运行错误
      runErrors.forEach((e) => console.log(e));
    }
  }

  async scan(options) {
    const { cwd, fix, outputReport, config: scanConfig } = options;
    const readConfigFile = (pth) => {
      const localPath = path.resolve(cwd, pth);
      return fs.existsSync(localPath) ? require(localPath) : {};
    };
    const pkg = readConfigFile("package.json");
    const config = scanConfig || readConfigFile(`${PKG_NAME}.config.js`);
    const runErrors = [];
    let results = [];

    // prettier
    if (fix && config.enablePrettier !== false) {
      await doPrettier(options);
    }
    // eslint
    if (config.enableESLint !== false) {
      try {
        const eslintResults = await doESLint({ ...options, pkg, config });
        results = results.concat(eslintResults);
      } catch (e) {
        runErrors.push(e);
      }
    }

    // stylelint
    if (config.enableStylelint !== false) {
      try {
        const stylelintResults = await doStylelint({
          ...options,
          pkg,
          config,
        });
        results = results.concat(stylelintResults);
      } catch (e) {
        runErrors.push(e);
      }
    }

    // markdown
    if (config.enableMarkdownlint !== false) {
      try {
        const markdownlintResults = await doMarkdownlint({
          ...options,
          pkg,
          config,
        });
        results = results.concat(markdownlintResults);
      } catch (e) {
        runErrors.push(e);
      }
    }

    // 生成报告文件
    if (outputReport) {
      const reportPath = path.resolve(
        process.cwd(),
        `./${PKG_NAME}-report.json`
      );
      fs.outputFile(reportPath, JSON.stringify(results, null, 2), () => {});
    }

    return {
      results,
      errorCount: results.reduce(
        (count, { errorCount }) => count + errorCount,
        0
      ),
      warningCount: results.reduce(
        (count, { warningCount }) => count + warningCount,
        0
      ),
      runErrors,
    };
  }
}

export default function (argv) {
  return new LintScanCommand(argv);
}
