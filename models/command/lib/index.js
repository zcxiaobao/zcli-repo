class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error("参数不能为空");
    }
    if (!Array.isArray(argv)) {
      throw new Error("参数必须为数组");
    }
    this._argv = argv;
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
  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, -1);
  }
  runProperties() {}
  async runCommand() {
    const proceed = await this.initialize();
    if (proceed !== false) {
      return await this.execute();
    }
    return Promise.reject("err");
  }
  initialize() {
    throw new Error("initialize must be implemented");
  }
  execute() {
    throw new Error("execute must be implemented");
  }
}

export default Command;
