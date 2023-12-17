import execa from "execa";
import {
  hasProjectNpm,
  hasProjectYarn,
  hasProjectPnpm,
} from "@zctools/command-exists";

function checkCommand(command, cwd) {
  try {
    switch (command) {
      case "npm":
        return hasProjectNpm(cwd);
      case "yarn":
        return hasProjectYarn(cwd);
      case "pnpm":
        return hasProjectPnpm(cwd);
    }
  } catch (e) {
    return false;
  }
}

export default async (command, args, options) => {
  const cwd = options.cwd || process.cwd();
  if (!checkCommand(command, cwd)) {
    throw new Error(`command ${command} not found`);
  }
  return new Promise(async (resolve, reject) => {
    try {
      await execa(
        command,
        command === "npm"
          ? [...args, "--registry=https://registry.npm.taobao.org"]
          : args,
        { ...options, stdio: "inherit" }
      );
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
};
