import fg from "fast-glob";
import fsExtra from "fs-extra";
import { extname, join } from "path";
import prettier from "prettier";
import {
  PRETTIER_FILE_EXT,
  PRETTIER_IGNORE_PATTERN,
} from "../scanInitDetail.js";

export async function doPrettier(options) {
  let files = [];
  if (options.files) {
    files = options.files.filter((name) =>
      PRETTIER_FILE_EXT.includes(extname(name))
    );
  } else {
    const pattern = join(
      options.include,
      `**/*.{${PRETTIER_FILE_EXT.map((t) => t.replace(/^\./, "")).join(",")}}`
    );
    files = await fg(pattern, {
      cwd: options.cwd,
      ignore: PRETTIER_IGNORE_PATTERN,
    });
  }
  await Promise.all(files.map(formatFile));
}

async function formatFile(filepath) {
  const text = await fsExtra.readFile(filepath, "utf8");
  const options = await prettier.resolveConfig(filepath);
  const formatted = prettier.format(text, { ...options, filepath });
  await fsExtra.writeFile(filepath, formatted, "utf8");
}
