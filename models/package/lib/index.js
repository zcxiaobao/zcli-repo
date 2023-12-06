// import fsExtra from "fs-extra";

class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package 类的 options 不能为空");
    }
    // package 的目标路径
    this.targetPath = options.targetPath;
    // package 的存储路径
    this.storeDir = options.storeDir;
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
    this.cacheFilePathPrefix = options.cacheFilePathPrefix;
  }

  async prepare() {}
  async exists() {}
  async install() {}
  async update() {}
  getRootFilePath() {}
  getCacheFilePath() {}
}

export default Package;
