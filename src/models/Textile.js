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

type JSONSchema = {|
  definitions: any,
  type: string,
  title: string,
  required: string[],
  properties: any,
|};

type WalletSettingsSchema = {|
  name: string,
  mill: string,
  pin?: boolean,
  plaintext?: boolean,
  json_schema?: JSONSchema,
|};

export type ThreadMeta = {|
  name: string,
  key: string,
  schema: WalletSettingsSchema,
|};

export type WalletSettingsThreadItem = {|
  key: string,
  value: any,
  created: number,
  updated: number,
|};

export type UIWalletSettings = {|
  block?: string,
  stored: WalletSettingsThreadItem,
|};
