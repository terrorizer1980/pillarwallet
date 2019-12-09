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
import type { ThreadMeta } from 'models/Textile';

export const walletSettingsThreadMeta: ThreadMeta = {
  name: 'wallet_settings_blob',
  key: 'io.textile.pillar_wallet_settings_v1',
  schema: {
    name: 'io.textile.pillar_wallet_settings_v0.0.1',
    mill: '/json',
    json_schema: {
      definitions: {},
      type: 'object',
      title: '',
      required: ['key', 'value', 'updated', 'created'],
      properties: {
        key: {
          type: 'string',
        },
        value: {
          type: 'object',
        },
        updated: {
          type: 'integer',
        },
        created: {
          type: 'integer',
        },
      },
    },
  },
};
