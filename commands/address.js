import {createSubDirectory, getLoganDirectory, listLoganDirectory} from "./folder.js";
import {execCardanoCli} from "./node.js";
import * as fs from 'fs'
import { table } from 'table';


export async function printAddresses () {
  let names = listLoganDirectory('addresses');
  if (!names.length) {
    console.log('No names')
  } else {
    const data = [
      ['name', 'address']
    ]
    names.forEach(name => {
      data.push([name, getAddress(name)])
    })
    console.log(table(data));
  }
}

export function createAddress (name) {
  const addressesDirectory = getLoganDirectory('addresses')
  const addressDirectory = createSubDirectory(addressesDirectory, name)

  execCardanoCli('address key-gen'
    + ` --verification-key-file ${addressDirectory}/${name}.vkey`
    + ` --signing-key-file ${addressDirectory}/${name}.skey`,
    false)

  execCardanoCli('stake-address key-gen'
    + ` --verification-key-file ${addressDirectory}/${name}.stake.vkey`
    + ` --signing-key-file ${addressDirectory}/${name}.stake.skey`,
    false)

  execCardanoCli('address build'
    + ` --payment-verification-key-file ${addressDirectory}/${name}.vkey`
    + ` --stake-verification-key-file ${addressDirectory}/${name}.stake.vkey`
    + ` --out-file ${addressDirectory}/${name}.address`)

  console.log(getAddress(name))
}

export function printAddressUtxos(addressName) {
  const data = [
    ['utxo', 'value']
  ]

  const addressUtxos = getAddressUtxos(addressName)
  Object.keys(addressUtxos).forEach(utxo => {
    const value = addressUtxos[utxo].value
    let printValue = `${value.lovelace} Lovelace`
    Object.keys(value).filter(currency => currency !== 'lovelace').forEach(currency => {
      Object.keys(value[currency]).forEach(tokenName => {
        printValue += `\n${value[currency][tokenName]} ${currency} ${tokenName}`
      })
    })
    data.push([utxo, printValue])
  })
  console.log(table(data));
}

export function getAddressUtxos(addressName) {
  const address = getAddress(addressName)
  execCardanoCli(`query utxo --address ${address} --out-file /tmp/utxo.json`)
  return JSON.parse(fs.readFileSync('/tmp/utxo.json').toString())
}

export function getAddress(name) {
  const addressesDirectory = getLoganDirectory('addresses')
  return fs.readFileSync(`${addressesDirectory}/${name}/${name}.address`).toString()
}