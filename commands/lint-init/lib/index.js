import Command from "@zctools/command";

class LintInitCommand extends Command {
  initialize() {
    console.log("lint init initialize");
    // this.projectName = this._argv[0] || "";
    // this.force = !!this._cmd.force;
    // log.verbose("projectName", this.projectName);
    // log.verbose("force", this.force);
  }
  async execute() {
    console.log("lint init execute");
    // await this.prepare();
    // await this.downloadTemplate();
    // await this.installTemplate();
    // await this.installRepoAndRun();
  }
}

export default function (argv) {
  return new LintInitCommand(argv);
}
