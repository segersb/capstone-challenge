import {getLoganDirectory} from "./folder.js";
import * as fs from 'fs'
import download from 'download'
import * as tar from 'tar'
import {exec, execSync} from 'child_process'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const networkFlag = '--testnet-magic 1097911063'

export async function startNode () {
  const nodeDirectory = getLoganDirectory('node')

  console.log('starting cardano node')
  const cardanoNodeProcess = exec(`${nodeDirectory}/cardano-node run`
    + ` --topology ${nodeDirectory}/testnet-topology.json`
    + ` --config ${nodeDirectory}/testnet-config.json`
    + ` --database-path ${nodeDirectory}/db-testnet`
    + ` --socket-path ${nodeDirectory}/node.socket`
    + ' --host-addr 0.0.0.0'
    + ' --port 3001')

  const logStream = fs.createWriteStream(`${nodeDirectory}/node.log`, {flags: 'a'})
  cardanoNodeProcess.stdout.pipe(logStream)
  cardanoNodeProcess.stderr.pipe(logStream)

  console.log('waiting for socket')
  while (!fs.existsSync(`${nodeDirectory}/node.socket`)) {
    await delay(1000)
  }

  console.log('waiting for sync')
  let syncProgress = getSyncProgress()
  while (syncProgress !== 100) {
    console.log(syncProgress + '% synced')
    await delay(10000)
    syncProgress = getSyncProgress()
  }
  console.log("node fully synced")
}

export async function installNode () {
  const nodeDirectory = getLoganDirectory('node')

  console.log('downloading cardano-node')
  await download('https://hydra.iohk.io/build/7408438/download/1/cardano-node-1.29.0-linux.tar.gz', nodeDirectory)

  console.log('extracting cardano-node')
  tar.extract({
    cwd: nodeDirectory,
    file: `${nodeDirectory}/cardano-node-1.29.0-linux.tar.gz`
  })

  console.log('downloading configuration files')
  await download('https://hydra.iohk.io/build/7370192/download/1/testnet-config.json', nodeDirectory);
  await download('https://hydra.iohk.io/build/7370192/download/1/testnet-byron-genesis.json', nodeDirectory);
  await download('https://hydra.iohk.io/build/7370192/download/1/testnet-shelley-genesis.json', nodeDirectory);
  await download('https://hydra.iohk.io/build/7370192/download/1/testnet-alonzo-genesis.json', nodeDirectory);
  await download('https://hydra.iohk.io/build/7370192/download/1/testnet-topology.json', nodeDirectory);

  console.log('downloading database snapshot')
  await download('https://updates-cardano-testnet.s3.amazonaws.com/cardano-node-state-dir/db-testnet-2021-09-23.tar.gz', nodeDirectory)

  console.log('extracting database snapshot')
  tar.extract({
    cwd: nodeDirectory,
    file: `${nodeDirectory}/db-testnet-2021-09-23.tar.gz`
  })
}

export function execCardanoCli (cmd, addNetwork = true) {
  const nodeDirectory = getLoganDirectory('node')

  return execSync(`${nodeDirectory}/cardano-cli ${cmd} ${addNetwork ? networkFlag : ''}`, {
    env: {
      CARDANO_NODE_SOCKET_PATH: `${nodeDirectory}/node.socket`
    }
  }).toString()
}

export function getSyncProgress () {
  const tip = execCardanoCli('query tip')
  return Number(JSON.parse(tip).syncProgress)
}