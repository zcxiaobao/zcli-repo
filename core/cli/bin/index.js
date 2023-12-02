#! /usr/bin/env node
import { filename } from "dirname-filename-esm";
import importLocal from "import-local";
import npmlog from "npmlog";
import cli from "../lib/index.js";
const __filename = filename(import.meta);

if (importLocal(__filename)) {
  npmlog.info("cli", "正在使用 zctools 本地版本");
} else {
  cli(process.argv.slice(2));
}
