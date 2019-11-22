// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
/*
 * Since our main target on this project is ETH, here are some insights
 * on the expected behaviour and the approach we're taking based on what
 * we understand for Bitcoin.
 *
 * Privacy:
 *
 *   In Bitcoin, privacy is really important, so there are many conventions
 *   and design decisions to protect users privacy as much as possible.
 *   Althought we can never guarantee transactions will not be traced back
 *   to anyone, we have to make sure we take into consideration the
 *   community standards for such purpose.
 *
 *   One of the conventions, is to use each address just once. Even tho in
 *   this first approach we're gonna be reusing addresses to avoid extra
 *   complexity during the MVP testing, there are many things we need to
 *   change to protect our users privacy when the feature is released to
 *   the public.
 *
 * Receiving funds:
 *
 *   When the user wants to receive funds, we'd need to derive a new address
 *   and provide it to them. Right now, we're gonna be using a single address
 *   for all the flows.
 *
 * Transactions:
 *
 *   Bitcoin transactions have outputs that indicate where the funds go to. They
 *   have each an output index inside the transaction, an amount and a destination
 *   address: [outid, amount, address].
 *
 *   The input of a transaction is a set of references to outputs from previous
 *   transactions, as a list of [transaction, outid], and the amount is simply the
 *   sum of the amounts for all used outputs.
 *   Any amount that is not sent to any address is considered miner fee. So the
 *   fee would be something like: sum(inputs) - sum(outputs)
 *
 * Calculating address balance:
 *
 *   After an address has received some transactions, it will have available
 *   outputs, that are not spent (not used by any transaction). We call those
 *   unspent outputs "utxos".
 *
 *   Then, the address balance is just the sum of the outputs it can spend,
 *   i.e. the sum of amounts on the uxtos it has.
 *
 * Sending transactions:
 *
 *   When sending a transaction, we need to choose among the available utxos, and
 *   use as many as needed to cover the amount we want to send. There are many
 *   strategies that can be used to select the outputs to use, each with its own
 *   advantages/disadvantages. We're gonna be using the coinselect's default
 *   implementation and see how it goes.
 *
 *   It is important that the utxos are updated when sending a transaction, since
 *   they can't be used twice (it'll result on a double spend error).
 *
 *   Since outputs are used entirely, if the total value is less than what we
 *   want to send, we need to provide what's called "change" address. That address
 *   can be the same address that's sending the funds, but that represents a
 *   privacy issue so a new adress should be created each time. Change addresses
 *   have nothing special other than its conventional name, they are regular
 *   addresses.
 *
 *   A transaction chain would (on a very basic view) look something like:
 *
 *     // Initial with 100 for each 'abc' and 'bcd':
 *     [tx: '0001'] -> {
 *       inputs: [ ... ],
 *       outputs: [
 *         { id: 0, amount: 100, address: 'abc' }, // 100 to 'abc'
 *         { id: 1, amount: 100, address: 'bcd' }, // 100 to 'bcd'
 *       ],
 *     }
 *
 *     // Sending 50 from 'abc' to 'cde':
 *     [tx: '0002'] -> {
 *       inputs: [
 *         { txid: '0001', out: 0 }, // output for 'abc' (total 100)
 *       ]
 *       outputs: [
 *         { id: 0, amount: 50, address: 'cde' }, // 50 to 'cde'
 *         { id: 1, amount: 40, address: 'def' }, // 40 to change address
 *         // We leave 10 unspent for miner fee
 *       ]
 *     }
 *
 *     // Sending 40 from 'bcd' to 'efg':
 *     [tx: '0003'] -> {
 *       inputs: [
 *         { txid: '0001', out: 1 }, // output for 'bcd' (total 100)
 *       ]
 *       outputs: [
 *         { id: 0, amount: 40, address: 'efg' }, // 40 to 'efg'
 *         { id: 1, amount: 40, address: 'fgh' }, // change address
 *         // We leave 20 unspent for miner fee
 *       ]
 *     }
 *
 *     // We can also send from multiple inputs:
 *     [tx: '0004'] -> {
 *       inputs: [
 *         { txid: '0002', out: 0 }, // from 'cde' (total 50)
 *         { txid: '0002', out: 1 }, // from 'def' (total 40)
 *         { txid: '0003', out: 0 }, // from 'efg' (total 40)
 *         // inputs total: 130
 *       ]
 *       outputs: [
 *         { id: 0, amount: 60, address: 'ghi' }, // 60 to 'ghi'
 *         { id: 1, amount: 60, address: 'hij' }, // 60 to 'hij'
 *         // We leave 10 unspent for miner fee
 *       ]
 *     }
 *
 */
import Toast from 'components/Toast';
import {
  UPDATE_BITCOIN_BALANCE,
  REFRESH_THRESHOLD,
  SET_BITCOIN_ADDRESSES,
  BITCOIN_WALLET_CREATION_FAILED,
  UPDATE_UNSPENT_TRANSACTIONS,
  UPDATE_BITCOIN_TRANSACTIONS,
} from 'constants/bitcoinConstants';
import {
  keyPairAddress,
  getAddressUtxos,
  getAddressBalance,
  importKeyPair,
  exportKeyPair,
  rootFromMnemonic,
  transactionFromPlan,
  sendRawTransaction,
  getBTCTransactions,
} from 'services/bitcoin';
import Storage from 'services/storage';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import type {
  BitcoinReducerAction,
  SetBitcoinAddressesAction,
  UpdateBitcoinBalanceAction,
  UpdateUnspentTransactionsAction,
  BitcoinWalletCreationFailedAction,
  UpdateBTCTransactionsAction,
} from 'reducers/bitcoinReducer';
import type { EthereumWallet } from 'models/Wallet';
import type {
  BitcoinAddress,
  BitcoinTransactionPlan,
  BitcoinUtxo,
  BitcoinStore,
  BTCBalance,
  BTCTransaction,
} from 'models/Bitcoin';

import { saveDbAction } from 'actions/dbActions';

const storage = Storage.getInstance('db');

const saveDb = (data: BitcoinStore) => {
  return saveDbAction('bitcoin', data, true);
};

const loadDb = (): Promise<BitcoinStore> => {
  return storage.get('bitcoin');
};

const setBitcoinAddressesAction = (addresses: string[]): SetBitcoinAddressesAction => ({
  type: SET_BITCOIN_ADDRESSES,
  addresses,
});

const updateBitcoinBalance = (
  address: string,
  balance: BTCBalance,
): UpdateBitcoinBalanceAction => ({
  type: UPDATE_BITCOIN_BALANCE,
  address,
  balance,
});

const updateBitcoinUnspentTransactions = (
  address: string,
  unspentTransactions: BitcoinUtxo[],
): UpdateUnspentTransactionsAction => ({
  type: UPDATE_UNSPENT_TRANSACTIONS,
  address,
  unspentTransactions,
});

const updateBTCTransactions = (
  address: string,
  transactions: BTCTransaction[],
): UpdateBTCTransactionsAction => ({
  type: UPDATE_BITCOIN_TRANSACTIONS,
  address,
  transactions,
});

const bitcoinWalletCreationFailed = (): BitcoinWalletCreationFailedAction => ({
  type: BITCOIN_WALLET_CREATION_FAILED,
});

export const initializeBitcoinWalletAction = (wallet: EthereumWallet) => {
  return async (dispatch: Dispatch) => {
    const { mnemonic, path } = wallet;
    if (!mnemonic) {
      await dispatch(bitcoinWalletCreationFailed());
      return;
    }

    let seed = wallet.privateKey;
    if (mnemonic && mnemonic !== 'ENCRYPTED') {
      seed = mnemonic;
    }
    const root = await rootFromMnemonic(seed);
    const keyPair = root.derivePath(path);

    const address = keyPairAddress(keyPair);
    if (!address) {
      Toast.show({
        message: 'There was an error creating your Bitcoin wallet',
        type: 'warning',
        title: 'Cannot initialize Bitcoin',
        autoClose: false,
      });

      return;
    }

    await dispatch(saveDb({
      keys: { [address]: exportKeyPair(keyPair) },
    }));

    await dispatch(setBitcoinAddressesAction([address]));
  };
};

export const loadBitcoinAddressesAction = () => {
  return async (dispatch: Dispatch) => {
    const { keys = {} } = await loadDb();

    const loaded: string[] = Object.keys(keys);

    if (loaded.length) {
      dispatch(setBitcoinAddressesAction(loaded));
    }
  };
};

const outdatedAddresses = (addresses: BitcoinAddress[]): BitcoinAddress[] => {
  const minDate = Date.now() - REFRESH_THRESHOLD;

  return addresses.filter(({ updatedAt }) => updatedAt <= minDate);
};

const fetchUnspentTxAction = (address: string): Promise<BitcoinReducerAction> => {
  return getAddressUtxos(address)
    .then(unspentOutputs => updateBitcoinUnspentTransactions(address, unspentOutputs));
};

const fetchBalanceAction = (address: string): Promise<BitcoinReducerAction> => {
  return getAddressBalance(address)
    .then(balance => updateBitcoinBalance(address, balance));
};

const fetchBTCTransactionsAction = (address: string): Promise<BitcoinReducerAction> => {
  return getBTCTransactions(address)
    .then(transactions => updateBTCTransactions(address, transactions));
};

const transactionSendingFailed = () => {
  Toast.show({
    message: 'There was an error sending the transaction',
    type: 'warning',
    title: 'Transaction could not be sent',
    autoClose: false,
  });
};

const fetchUnspentTxFailed = () => {
  Toast.show({
    message: 'There was an error fetching the Bitcoin unspent transactions',
    type: 'warning',
    title: 'Cannot fetch unspent transactions',
    autoClose: false,
  });
};

const fetchBTCTransactionsFailed = () => {
  Toast.show({
    message: 'There was an error fetching the Bitcoin transactions',
    type: 'warning',
    title: 'Cannot fetch transactions',
    autoClose: false,
  });
};

const fetchBalanceFailed = () => {
  Toast.show({
    message: 'There was an error fetching the Bitcoin balance',
    type: 'warning',
    title: 'Cannot fetch balance',
    autoClose: false,
  });
};

const transactionSent = () => {
  Toast.show({
    message: 'The transaction was sent to the Bitcoin network',
    type: 'success',
    title: 'Transaction sent',
    autoClose: true,
  });
};

export const sendTransactionAction = (plan: BitcoinTransactionPlan) => {
  return async () => {
    const { keys = {} } = await loadDb();

    const rawTransaction = transactionFromPlan(
      plan,
      (address: string) => importKeyPair(keys[address]),
    );

    sendRawTransaction(rawTransaction)
      .then((txid) => {
        if (!txid) {
          transactionSendingFailed();
          return;
        }

        transactionSent();
      })
      .catch(transactionSendingFailed);
  };
};

export const refreshBitcoinUnspentTxAction = (force: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { bitcoin: { data: { addresses } } } = getState();

    const addressesToUpdate = force ? addresses : outdatedAddresses(addresses);
    if (!addressesToUpdate.length) {
      return;
    }

    await Promise.all(addressesToUpdate.map(({ address }) => {
      return fetchUnspentTxAction(address)
        .then(action => dispatch(action))
        .catch(fetchUnspentTxFailed);
    }));
  };
};

export const refreshBitcoinBalanceAction = (force: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { bitcoin: { data: { addresses } } } = getState();

    const addressesToUpdate = force ? addresses : outdatedAddresses(addresses);
    if (!addressesToUpdate.length) {
      return;
    }

    await Promise.all(addressesToUpdate.map(({ address }) => {
      return fetchBalanceAction(address)
        .then(action => dispatch(action))
        .catch(fetchBalanceFailed);
    }));
  };
};

export const refreshBTCTransactionsAction = (force: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { bitcoin: { data: { addresses } } } = getState();

    const addressesToUpdate = force ? addresses : outdatedAddresses(addresses);
    if (!addressesToUpdate.length) {
      return;
    }

    await Promise.all(addressesToUpdate.map(({ address }) => {
      return fetchBTCTransactionsAction(address)
        .then(action => dispatch(action))
        .catch(fetchBTCTransactionsFailed);
    }));
  };
};
