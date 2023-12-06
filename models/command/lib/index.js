class Command {
  constructor(argv) {
    const runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.configeEnv());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.runProperties());
      chain = chain.then(() => this.runCommand());
      chain.then(() => resolve);
      chain.catch((err) => {
        console.log(err);
        reject(err);
      });
    });
    this.runner = runner;
  }
  configeEnv() {}
  initArgs() {}
  runProperties() {}
  async runCommand() {
    const proceed = await this.initialize();
    if (proceed !== false) {
      return this.execute();
    }
    return undefined;
  }
  initialize() {
    throw new Error("initialize must be implemented");
  }
  execute() {
    new Error("execute must be implemented");
  }
}

export default Command;
