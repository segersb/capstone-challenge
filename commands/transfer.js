import {getAddress, getAddressSigningKey, getAddressUtxos, getAddressValues} from "./address.js";
import {execCardanoCli} from "./node.js";

export function transfer (fromAddressName, toAddressName, values) {
  const fromAddress = getAddress(fromAddressName)
  const toAddress = getAddress(toAddressName)
  const fromUtxos = getAddressUtxos(fromAddressName)
  const fromValues = getAddressValues(fromAddressName)

  console.log('validating values')
  values.forEach(value => {
    if (value.amount < 0) {
      throw new Error('unable to transfer negative amounts')
    }
    const fromValue = fromValues.find(v => v.currencySymbol === value.currencySymbol && v.tokenName === value.tokenName)
    if (!fromValue) {
      throw new Error(`value not found in from address: ${value.amount} ${value.currencySymbol} ${value.tokenName}`)
    }
    if (fromValue.amount < value.amount) {
      throw new Error(`insufficient amount of value: ${value.currencySymbol} ${value.tokenName}`)
    }
  })

  console.log('checking lovelace requirements')
  const lovelaceValue = values.find(value => !value.currencySymbol)
  if (lovelaceValue && lovelaceValue.amount < 1310316) {
    throw new Error('need at least 1310316 lovelaces to transfer')
  }
  if (!lovelaceValue) {
    console.log('adding minimum 1310316 lovelaces to transfer')
    values.push({
      amount: 1310316,
      currencySymbol: '',
      tokenName: ''
    })
  }

  console.log('calculating asset changes')
  const assetChangeValues = fromValues
    .map(v => {
      return {...v}
    })
    .filter(addressValue => !!addressValue.currencySymbol)
    .map(addressValue => {
      const transferValue = values.find(v => v.currencySymbol === addressValue.currencySymbol && v.tokenName === addressValue.tokenName)
      if (!transferValue) {
        return addressValue
      }

      addressValue.amount -= transferValue.amount
      return addressValue
    })
    .filter(changeValue => changeValue.amount > 0)

  if (assetChangeValues.length) {
    assetChangeValues.push({
      amount: 1310316,
      currencySymbol: '',
      tokenName: ''
    })
  }

  console.log('building transaction')
  let buildCmd = 'transaction build --alonzo-era '
  fromUtxos.forEach(fromUtxo => {
    buildCmd += `--tx-in ${fromUtxo.utxoRef} `
  })
  buildCmd += `--tx-out ${createTxOut(toAddress, values)} `
  if (assetChangeValues.length) {
    buildCmd += `--tx-out ${createTxOut(fromAddress, assetChangeValues)} `
  }
  buildCmd += `--change-address ${fromAddress} `
  buildCmd += `--out-file /tmp/tx.raw`
  execCardanoCli(buildCmd)

  console.log('signing transaction')
  const addressSigningKey = getAddressSigningKey(fromAddressName);
  execCardanoCli(`transaction sign --signing-key-file ${addressSigningKey} --tx-body-file /tmp/tx.raw --out-file /tmp/tx.sign`)

  console.log('submitting transaction')
  execCardanoCli(`transaction submit --tx-file /tmp/tx.sign`)
}

export function createTxOut (address, values) {
  let txOutValue = address
  values.forEach(value => {
    if (!value.currencySymbol) {
      txOutValue += `+${value.amount}`
    } else if (!value.tokenName) {
      txOutValue += `+"${value.amount} ${value.currencySymbol}"`
    } else {
      txOutValue += `+"${value.amount} ${value.currencySymbol}.${value.tokenName}"`
    }
  })
  return txOutValue
}
