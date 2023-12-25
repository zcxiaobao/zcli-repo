import path from "node:path";
import Package from "@zctools/package";
import { execa } from "execa";
import url from "node:url";
const SETTINGS = {
  init: "@zctools/init",
  "lint-init": "@zctools/lint",
};

const exec = async function (...args) {
  const homePath = process.env.CLI_HOME_PATH;
  let targetPath = process.env.CLI_TARGET_PATH;
  const cmdObj = args[args.length - 1];
  const cmdParentName = cmdObj.parent?.name();
  const cmdName =
    cmdParentName == "zctools" ? "" : `${cmdParentName}-` + cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "latest";

  let pkg;
  let storeDir = "";
  if (!targetPath) {
    targetPath = path.resolve(homePath, "dependencies");
    storeDir = path.resolve(targetPath, "node_modules");
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      await pkg.update();
    } else {
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const cmd = args[args.length - 1];
  const o = Object.create(null);
  Object.keys(cmd).forEach((key) => {
    if (cmd.hasOwnProperty(key) && !key.startsWith("_") && key !== "parent") {
      o[key] = cmd[key];
    }
  });
  args[args.length - 1] = o;
  const rootFile = await pkg.getRootFilePath();
  if (rootFile) {
    import(url.pathToFileURL(rootFile)).then((module) => {
      execa("node", ["-e", `${module.default(args)}`]);
    });
  }
};

export default exec;
