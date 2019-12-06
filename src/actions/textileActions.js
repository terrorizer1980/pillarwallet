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
import FS from 'react-native-fs';
import Textile from '@textile/react-native-sdk';
import { TEXTILE_MNEMONIC } from 'react-native-dotenv';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import { SET_TEXTILE_INITIALIZED, SET_TEXTILE_VERSION } from 'constants/textileConstants';

export const initTextileAction = () => {
  return async (dispatch: Dispatch) => {
    if (!TEXTILE_MNEMONIC) throw new Error('Textile mnemonic is not set');

    const textileRepoPath = `${FS.DocumentDirectoryPath}/textile-go`;
    const recoveryPhrase = TEXTILE_MNEMONIC;
    const textileWallet = await Textile.walletAccountAt(recoveryPhrase, 0);

    const initialized = await Textile.isInitialized(textileRepoPath);
    console.log({ initialized });
    if (!initialized) {
      await Textile.initialize(textileRepoPath, textileWallet.seed, true, false);
    }

    await Textile.launch(textileRepoPath, true);
    // console.log('fromApp', await Textile.gitSummary());

    dispatch({ type: SET_TEXTILE_INITIALIZED });

    const version = await Textile.version();
    dispatch({ type: SET_TEXTILE_VERSION, version });
  };
};

export const getThreadsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { textile: { initialized } } = getState();
    if (!initialized) throw new Error('Textile is not initialized');
  };
};
