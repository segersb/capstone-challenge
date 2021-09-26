#!/usr/bin/env node
import { program } from 'commander'
import {execCardanoCli, installNode, startNode} from './commands/node.js'
import {createAddress, printAddresses, printAddressUtxos} from './commands/address.js'

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
  .command('address-create <name>')
  .description('Create an address')
  .option('-n --name', 'name of the address')
  .action(createAddress);

program
  .command('address-utxos <name>')
  .description('List the UTXO\'s of an address')
  .option('-n --name', 'name of the address')
  .action(printAddressUtxos);

program
  .command('cardano-cli <cmd>')
  .description('Executes a cardano-cli command with the testnet-magic flag added by default')
  .option('-c --cmd', 'cardano-cli command')
  .option('-n --no-magic', 'do not add the testnet-magic flag')
  .action((cmd, options) => {
    console.log(execCardanoCli(cmd, !options['no-magic']))
  });

program.parse(process.argv)