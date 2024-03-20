import { ESLint } from "eslint";
import fg from "fast-glob";
import { extname } from "path";
import { ESLINT_FILE_EXT, ESLINT_IGNORE_PATTERN } from "../scanInitDetail.js";
import { formatESLintResults } from "./formatESLintResults.js";
import { getESLintConfig } from "./getESLintConfig.js";

export async function doESLint(options) {
  let files;
  if (options.files) {
    files = options.files.filter((name) =>
      ESLINT_FILE_EXT.includes(extname(name))
    );
  } else {
    files = await fg(
      `**/*.{${ESLINT_FILE_EXT.map((t) => t.replace(/^\./, "")).join(",")}}`,
      {
        cwd: options.cwd,
        ignore: ESLINT_IGNORE_PATTERN,
      }
    );
  }

  const eslint = new ESLint(
    getESLintConfig(options, options.pkg, options.config)
  );
  const reports = await eslint.lintFiles(files);
  if (options.fix) {
    await ESLint.outputFixes(reports);
  }

  return formatESLintResults(reports, options.quiet, eslint);
}
