import fg from "fast-glob";
import fsExtra from "fs-extra";
import markdownlintRuleHelpers from "markdownlint-rule-helpers";
import { extname, join } from "path";
import markdownlint from "markdownlint";
import {
  MARKDOWN_LINT_FILE_EXT,
  MARKDOWN_LINT_IGNORE_PATTERN,
} from "../scanInitDetail.js";
import { formatMarkdownlintResults } from "./formatMarkdownlintResults.js";
import { getMarkdownlintConfig } from "./getMarkdownlintConfig.js";

export async function doMarkdownlint(options) {
  let files;
  if (options.files) {
    files = options.files.filter((name) =>
      MARKDOWN_LINT_FILE_EXT.includes(extname(name))
    );
  } else {
    const pattern = join(
      options.include,
      `**/*.{${MARKDOWN_LINT_FILE_EXT.map((t) => t.replace(/^\./, "")).join(",")}}`
    );
    files = await fg(pattern, {
      cwd: options.cwd,
      ignore: MARKDOWN_LINT_IGNORE_PATTERN,
    });
  }
  const results = await markdownlint.promises.markdownlint({
    ...getMarkdownlintConfig(options, options.pkg, options.config),
    files,
  });
  // 修复
  if (options.fix) {
    await Promise.all(
      Object.keys(results).map((filename) =>
        formatMarkdownFile(filename, results[filename])
      )
    );
    for (const file in results) {
      if (!Object.prototype.hasOwnProperty.call(results, file)) continue;
    }
  }
  return formatMarkdownlintResults(results, options.quiet);
}

async function formatMarkdownFile(filename, errors) {
  const fixes = errors?.filter((error) => error.fixInfo);

  if (fixes?.length > 0) {
    const originalText = await fsExtra.readFile(filename, "utf8");
    const fixedText = markdownlintRuleHelpers.applyFixes(originalText, fixes);
    if (originalText !== fixedText) {
      await fsExtra.writeFile(filename, fixedText, "utf8");
      return errors.filter((error) => !error.fixInfo);
    }
  }
  return errors;
}
