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
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';
import FS from 'react-native-fs';
import Textile, {
  IAddThreadConfig,
  Thread,
  AddThreadConfig,
  ThreadList,
  IFilesList,
} from '@textile/react-native-sdk';
import { TEXTILE_MNEMONIC } from 'react-native-dotenv';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { ThreadMeta, ThreadItem, UIThreadItem } from 'models/Textile';
import {
  SET_TEXTILE_INITIALIZED,
  SET_TEXTILE_VERSION,
  SET_TEXTILE_NODE_STARTED,
  UPDATE_TEXTILE_THREADS,
  ADD_TEXTILE_THREAD,
  SET_TEXTILE_THREAD_ITEMS,
} from 'constants/textileConstants';
import { walletSettingsThreadMeta } from 'configs/textileConfig';
import { threadSelector } from 'selectors/textile';
import { getRandomInt } from 'utils/common';
import Toast from 'components/Toast';

export const initTextileAction = () => {
  return async (dispatch: Dispatch) => {
    if (!TEXTILE_MNEMONIC) throw new Error('Textile mnemonic is not set');

    const textileRepoPath = `${FS.DocumentDirectoryPath}/textile-go`;
    const recoveryPhrase = TEXTILE_MNEMONIC;
    const textileWallet = await Textile.walletAccountAt(recoveryPhrase, 0);

    const initialized = await Textile.isInitialized(textileRepoPath);
    if (!initialized) {
      await Textile.initialize(textileRepoPath, textileWallet.seed, true, false);
    }

    await Textile.launch(textileRepoPath, true);
    dispatch({ type: SET_TEXTILE_INITIALIZED });

    const version = await Textile.version();
    dispatch({ type: SET_TEXTILE_VERSION, payload: version });
  };
};

export const loadAllThreadsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { textile: { initialized } } = getState();
    if (!initialized) throw new Error('Textile is not initialized');

    const threads: ThreadList = await Textile.threads.list();
    if (!isEmpty(get(threads, 'items'))) {
      dispatch({ type: UPDATE_TEXTILE_THREADS, payload: threads.items });
    }
  };
};

export const findOrCreateThreadAction = (threadMeta: ThreadMeta) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const threadExists = threadSelector(threadMeta.key, getState());
    if (threadExists) return;

    const schema = {
      id: '',
      json: JSON.stringify(threadMeta.schema),
      preset: AddThreadConfig.Schema.Preset.NONE,
    };
    const config: IAddThreadConfig = {
      key: threadMeta.key,
      name: threadMeta.key,
      type: Thread.Type.PRIVATE,
      sharing: Thread.Sharing.NOT_SHARED,
      schema,
      force: false,
      whitelist: [],
    };

    const newThread = await Textile.threads.add(config);
    dispatch({
      type: ADD_TEXTILE_THREAD,
      payload: newThread,
    });
  };
};

export const loadOrCreateThreadsAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      await dispatch(loadAllThreadsAction());
      await dispatch(findOrCreateThreadAction(walletSettingsThreadMeta));
    } catch (e) {
      console.log('Error loading textile threads', e);
    }
  };
};

export const loadThreadAction = (threadKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const threadData = threadSelector(threadKey, getState());
    if (!threadData) return;

    const threadItems: UIThreadItem[] = [];
    try {
      const files: IFilesList = await Textile.files.list(threadData.id, '', -1);
      console.log({ files });

      const promises = files.items.map(async file => {
        const { block } = file;
        const hashes = file.files.map((ffs) => ffs.file.hash);

        await Promise.all(hashes.map(async hash => {
          const content = await Textile.files.content(hash);
          // const json = Buffer.from(data.split(',')[1], 'base64').toString()
          const json = Buffer.from(content.data, 'base64').toString();
          const data = JSON.parse(json);
          threadItems.push({
            block,
            stored: data,
          });
        }));
      });
      await Promise.all(promises);
    } catch (err) {
      console.error(err);
    } finally {
      dispatch({
        type: SET_TEXTILE_THREAD_ITEMS,
        payload: threadItems,
      });
    }
  };
};

const addToThread = (data: ThreadItem, threadId: string) => {
  const payload = JSON.stringify(data);
  const input = Buffer.from(payload).toString('base64');
  return Textile.files.addData(input, threadId);
  // return Textile.files.addFiles(result.dir, threadId);
};

const updateRecord = (key: string, value: any, allRecords: UIThreadItem[]): UIThreadItem => {
  const currentRecord = allRecords.find(({ stored }) => stored.key === key);

  return {
    block: get(currentRecord, 'block'),
    stored: {
      key,
      value: { [key]: value },
      created: get(currentRecord, 'stored.created', new Date().getTime()),
      updated: new Date().getTime(),
    },
  };
};

export const publishThreadItemsAction = (threadKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const threadData = threadSelector(threadKey, getState());
    if (!threadData) return;

    const { threadItems } = getState().textile;
    const saveItems = [
      updateRecord('testKey', `value${getRandomInt(1, 1000)}`, threadItems),
    ];

    try {
      await Promise.all(saveItems.map(async saveItem => {
        const { block, stored } = saveItem;
        await addToThread(stored, threadData.id);
        // Mark block as ignored so it would be deleted from IPFS at some point
        if (block) {
          await Textile.ignores.add(block);
        }
      }));
    } catch (error) {
      console.info(error);
    } finally {
      Toast.show({
        message: 'Data updated',
        type: 'success',
        title: 'Success',
        autoClose: true,
      });
      dispatch(loadThreadAction(threadKey));
    }
  };
};

export const onNodeStartedAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { textile: { initialized } } = getState();
    if (!initialized) throw new Error('Textile is not initialized');

    dispatch({ type: SET_TEXTILE_NODE_STARTED });
    dispatch(loadOrCreateThreadsAction());
  };
};
