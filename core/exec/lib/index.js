import path from "node:path";
import Package from "@zctools/package";
import { execaNode } from "execa";
import url from "node:url";
const SETTINGS = {
  init: "@zctools/cli",
};

const exec = async function (...args) {
  const homePath = process.env.CLI_HOME_PATH;
  let targetPath = process.env.CLI_TARGET_PATH;
  const cmdObj = args[args.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "0.0.2";

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
    // if (await pkg.exists()) {
    //   await pkg.update();
    // } else {
    //   await pkg.install();
    // }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = await pkg.getRootFilePath();
  if (rootFile) {
    import(url.pathToFileURL(rootFile)).then((module) => {
      console.log(module, module.default.core);
    });
  }
};

export default exec;
