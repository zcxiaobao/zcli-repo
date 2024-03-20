import axios from "axios";
import semver from "semver";
class NpmRepoDetail {
  constructor(options) {
    if (!options) {
      throw new Error("NpmRepoDetail 类的 options 不能为空");
    }
    this.npmName = options.npmName;
    this.registry = options.registry || this.getDefaultRegistry(options.isNpm);
    this.service = axios.create({
      baseURL: this.registry,
      timeout: 10000,
    });
    // this.service.interceptors.response.use(
    //   (response) => {
    //     console.log(response);
    //     if (response.status === 200) {
    //       return response.data;
    //     } else {
    //       return Promise.reject(response);
    //     }
    //   },
    //   (err) => Promise.reject(err)
    // );
  }

  getDefaultRegistry(isNpm = false) {
    return isNpm
      ? "https://registry.npmjs.org"
      : "https://registry.npmmirror.com";
  }
  // 获取 npm repo 详情信息
  getNpmRepoDetail() {
    return this.service.get(this.npmName).then(
      (response) => {
        if (response.status === 200) {
          return response.data;
        } else {
          return Promise.reject(response);
        }
      },
      (err) => Promise.reject(err)
    );
  }
  // 获取所有版本
  getNpmAllVersions() {
    return this.getNpmRepoDetail(this.npmName).then((data) => {
      if (!data.versions) {
        // log.error("没有版本号");
        return Promise.reject(new Error("没有版本号"));
      } else {
        return Object.keys(data.versions);
      }
    });
  }
  // 获取最新版本
  getLatestVersion() {
    return this.getNpmRepoDetail(this.npmName).then((data) => {
      if (!data["dist-tags"] || !data["dist-tags"].latest) {
        // log.error("没有 latest 版本号");
        return Promise.reject(new Error("没有 latest 版本号"));
      } else {
        return data["dist-tags"].latest;
      }
    });
  }
  async getNpmSatisfyVersions(baseVersion) {
    const versions = await this.getNpmAllVersions(this.npmName);
    return versions
      .filter((version) => semver.satisfies(version, `>${baseVersion}`))
      .sort((a, b) => (semver.gt(b, a) ? 1 : -1));
  }
}

// let npm = new NpmRepoDetail({ npmName: "@vue/cli" });
// npm.getNpmAllVersions().then((data) => {
//   console.log(data);
// });

// npm.getNpmSatisfyVersions("4.0.0").then((data) => {
//   console.log(data);
// });
export default NpmRepoDetail;
