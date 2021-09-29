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
    ['UTXO reference', 'values']
  ]

  const addressUtxos = getAddressUtxos(addressName)
  addressUtxos.forEach(utxo => {
    let printValues = utxo.values.map(value => {
      let printValue = value.amount
      if (value.currencySymbol) {
        printValue += ' ' + value.currencySymbol
      }
      if (value.tokenName) {
        printValue += ' ' + value.tokenName
      }
      return printValue
    }).join('\n')

    data.push([utxo.utxoRef, printValues])
  })
  console.log(table(data));
}

export function printAddressValues(addressName) {
  const data = [
    ['Amount', 'Currency symbol', 'Token name']
  ]

  const addressValues = getAddressValues(addressName)
  addressValues.forEach(value => {
    data.push([value.amount, value.currencySymbol, value.tokenName])
  })

  console.log(table(data));
}

export function getAddressUtxos(addressName) {
  const address = getAddress(addressName)
  execCardanoCli(`query utxo --address ${address} --out-file /tmp/utxo.json`)
  let utxoOutput = JSON.parse(fs.readFileSync('/tmp/utxo.json').toString());
  return Object.keys(utxoOutput).map(utxoRef => {
    const utxoRefKeys = utxoRef.split('#')
    const transactionHash = utxoRefKeys[0]
    const transactionIndex = utxoRefKeys[1]

    const utxoValue = utxoOutput[utxoRef].value
    const values = [{
      amount: utxoValue.lovelace,
      currencySymbol: '',
      tokenName: ''
    }]

    Object.keys(utxoValue).filter(currencySymbol => currencySymbol !== 'lovelace').forEach(currencySymbol => {
      Object.keys(utxoValue[currencySymbol]).forEach(tokenName => {
        values.push({
          amount: utxoValue[currencySymbol][tokenName],
          currencySymbol: currencySymbol,
          tokenName: tokenName
        })
      })
    })

    return {
      utxoRef,
      transactionHash,
      transactionIndex,
      values
    }
  })
}

export function getAddressValues(addressName) {
  let values = []
  getAddressUtxos(addressName).forEach(utxo => {
    utxo.values.forEach(utxoValue => {
      let value = values.find(v => v.currencySymbol === utxoValue.currencySymbol && v.tokenName === utxoValue.tokenName)
      if (!value) {
        value = {
          amount: 0,
          currencySymbol: utxoValue.currencySymbol,
          tokenName: utxoValue.tokenName
        }
        values.push(value)
      }
      value.amount += utxoValue.amount
    })
  })
  return values
}

export function getAddress(name) {
  const addressesDirectory = getLoganDirectory('addresses')
  return fs.readFileSync(`${addressesDirectory}/${name}/${name}.address`).toString()
}

export function getAddressSigningKey(addressName) {
  const addressesDirectory = getLoganDirectory('addresses')
  return `${addressesDirectory}/${addressName}/${addressName}.skey`
}