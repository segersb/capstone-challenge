#!/usr/bin/env node
import { program } from 'commander'
import {execCardanoCli, installNode, startNode} from './commands/node.js'
import {createAddress, printAddresses, printAddressUtxos, printAddressValues} from './commands/address.js'
import {transfer} from "./commands/transfer.js";

program.version('1.0.0')

program
  .command('node-install')
  .description('Download and configure the testnet cardano-node')
  .action(installNode);

program
  .command('node-start')
  .description('Starts the testnet cardano-node and follows the sync progress')
  .action(startNode);

program
  .command('address-list')
  .description('List all addresses')
  .action(printAddresses);

program
  .command('address-create')
  .description('Create an address')
  .requiredOption('-n --name [name]', 'name of the address')
  .action(options => {
    createAddress(options.name)
  });

program
  .command('address-utxos')
  .description('List the UTXO\'s of an address')
  .requiredOption('-n --name [name]', 'name of the address')
  .action(options => {
    printAddressUtxos(options.name)
  });

program
  .command('address-values')
  .description('List the total values of an address')
  .requiredOption('-n --name [name]', 'name of the address')
  .action(options => {
    printAddressValues(options.name)
  });

program
  .command('transfer')
  .description('Transfer values from one address to another')
  .requiredOption('-f --from [from]', 'the address to transfer values from')
  .requiredOption('-t --to [to]', 'the address to transfer values to')
  .requiredOption('-v --value <value>', 'value to transfer', collectValues)
  .action(async options => {
    await runAction(() => transfer(options.from, options.to, options.value))
  });

program
  .command('cardano-cli')
  .description('Executes a cardano-cli command with the testnet-magic flag added by default')
  .requiredOption('-c --cmd [cmd]', 'cardano-cli command')
  .option('-n --no-magic', 'do not add the testnet-magic flag')
  .action((cmd, options) => {
    console.log(execCardanoCli(options.cmd, !options['no-magic']))
  });

program.parse(process.argv)

function collectValues(value, previous = []) {
  let valueSplit = value.split(".");
  const amount = Number(valueSplit[0])
  const currencySymbol = valueSplit.length > 1 ? valueSplit[1] : ''
  const tokenName = valueSplit.length > 2 ? valueSplit[2] : ''
  return previous.concat([{
    amount,
    currencySymbol,
    tokenName
  }])
}

async function runAction(action) {
  try {
    await action()
  } catch (e) {
    console.error(e.message)
  }
}