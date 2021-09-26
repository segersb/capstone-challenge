import * as fs from 'fs'
import * as os from 'os'

export function listLoganDirectory (name) {
  const loganDirectory = getLoganDirectory(name)
  return fs.readdirSync(loganDirectory)
}

export function getLoganDirectory (name) {
  const loganHome = getLoganHome()
  const loganDirectory = `${loganHome}/${name}`
  if (!fs.existsSync(loganDirectory)) {
    fs.mkdirSync(loganDirectory)
  }
  return loganDirectory
}

export function getLoganHome () {
  const loganHome = `${os.homedir()}/.logan`
  if (!fs.existsSync(loganHome)) {
    fs.mkdirSync(loganHome)
  }
  return loganHome
}

export function createSubDirectory (parentDirectory, directoryName) {
  const subDirectory = `${parentDirectory}/${directoryName}`
  if (fs.existsSync(subDirectory)) {
    fs.rmdirSync(subDirectory, { recursive: true });
  }
  fs.mkdirSync(subDirectory)
  return subDirectory
}