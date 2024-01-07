import Command from "@zctools/command";

class LintScanCommand extends Command {
  initialize() {
    console.log("lint scan initialize");
  }
  async execute() {
    console.log("lint scan execute");
  }
}

export default function (argv) {
  return new LintScanCommand(argv);
}
