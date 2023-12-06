import Command from "@zctools/command";

class InitCommand extends Command {
  initialize() {
    console.log("init project");
  }
  execute() {
    console.log("execute init project");
  }
}

export default function (argv) {
  return new InitCommand(argv);
}
