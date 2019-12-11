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
import { IThread } from '@textile/react-native-sdk';
import {
  SET_TEXTILE_INITIALIZED,
  SET_TEXTILE_VERSION,
  SET_TEXTILE_NODE_STARTED,
  UPDATE_TEXTILE_THREADS,
  ADD_TEXTILE_THREAD,
  SET_TEXTILE_THREAD_ITEMS,
} from 'constants/textileConstants';
import type { UIThreadItem } from 'models/Textile';

export type TextileReducerState = {|
  initialized: boolean,
  textileVersion: string,
  nodeStarted: boolean,
  threads: IThread[],
  threadItems: UIThreadItem[],
|};

export type TextileReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  initialized: false,
  textileVersion: '',
  nodeStarted: false,
  threads: [],
  threadItems: [],
};

export default function textileReducer(
  state: TextileReducerState = initialState,
  action: TextileReducerAction,
): TextileReducerState {
  switch (action.type) {
    case SET_TEXTILE_INITIALIZED:
      return { ...state, initialized: true };
    case SET_TEXTILE_VERSION:
      return { ...state, textileVersion: action.payload };
    case SET_TEXTILE_NODE_STARTED:
      return { ...state, nodeStarted: true };
    case UPDATE_TEXTILE_THREADS:
      return { ...state, threads: action.payload };
    case ADD_TEXTILE_THREAD:
      return { ...state, threads: [...state.threads, action.payload] };
    case SET_TEXTILE_THREAD_ITEMS:
      return { ...state, threadItems: action.payload };
    default:
      return state;
  }
}
