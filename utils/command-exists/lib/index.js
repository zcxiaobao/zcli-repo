import path from "node:path";
import fs from "node:fs";
import { sync as commandExitSync } from "command-exists";
import { LRUCache } from "lru-cache";
import { execa } from "execa";
import semver from "semver";
let _hasPnpm;
let _hasNpm;
let _hasYarn;
const _yarnProjects = new LRUCache({
  max: 10,
  maxAge: 1000,
});
const _pnpmProjects = new LRUCache({
  max: 10,
  maxAge: 1000,
});
const _npmProjects = new LRUCache({
  max: 10,
  maxAge: 1000,
});

const hasYarn = () => {
  if (_hasYarn != null) {
    return _hasYarn;
  }
  _hasYarn = commandExitSync("yarn");
  return _hasYarn;
};

const checkYarn = (result) => {
  if (result && !hasYarn()) {
    throw new Error("Yarn is required to run this command");
  }
  return result;
};

export const hasProjectYarn = (cwd) => {
  if (_yarnProjects.has(cwd)) {
    return checkYarn(_yarnProjects.get(cwd));
  }
  const lockFile = path.join(cwd, "yarn.lock");
  const result = fs.existsSync(lockFile);
  _yarnProjects.set(cwd, result);
  return checkYarn(result);
};

const hasPnpm = () => {
  if (_hasPnpm != null) {
    return _hasPnpm;
  }
  _hasPnpm = commandExitSync("pnpm");
  return _hasPnpm;
};

const checkPnpm = (result) => {
  if (result && !hasPnpm()) {
    throw new Error("Pnpm is required to run this command");
  }
  return result;
};

export const hasProjectPnpm = (cwd) => {
  if (_pnpmProjects.has(cwd)) {
    return checkPnpm(_pnpmProjects.get(cwd));
  }
  const lockFile = path.join(cwd, "pnpm-lock.yaml");
  const result = fs.existsSync(lockFile);
  _pnpmProjects.set(cwd, result);
  return checkPnpm(result);
};

const hasNpm = () => {
  if (_hasNpm != null) {
    return _hasNpm;
  }
  _hasNpm = commandExitSync("npm");
  return _hasNpm;
};

const checkNpm = (result) => {
  if (result && !hasNpm()) {
    throw new Error("Npm is required to run this command");
  }
  return result;
};

export const hasProjectNpm = (cwd) => {
  if (_npmProjects.has(cwd)) {
    return checkNpm(_npmProjects.get(cwd));
  }
  const lockFile = path.join(cwd, "package.json");
  const result = fs.existsSync(lockFile);
  _npmProjects.set(cwd, result);
  return checkNpm(result);
};
