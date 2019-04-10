#!/usr/bin/env node
/* aslint-disable */

const fs = require('fs-extra');
const find = require('findit');
const path = require('path');

const hackers = [
  {
    name: 'iso-url',
    regex: [
      /iso-url\/src\/relative\.js$/,
    ],
    hack(file, contents) {
      let fixed = contents;

      fixed = fixed.replace(
        "const { URLWithLegacySupport, format } = require('./url');",
        "const { format } = require('./url');\n" +
        "const URLWithLegacySupport = require('url-parse-lax');");
      fixed = fixed.replace('protocol: protocol || urlParsed.protocol', 'protocol: urlParsed.protocol');
      fixed = fixed.replace('host: location.host || urlParsed.host', 'host: urlParsed.host');
      fixed = fixed.replace('return new URLWithLegacySupport(url, format(base)).toString();', 'return format(base);');

      return contents === fixed ? null : fixed;
    },
  },
  {
    name: 'pull-ws',
    regex: [
      /pull-ws\/client\.js$/,
    ],
    hack(file, contents) {
      let fixed = contents;
      fixed = fixed.replace(
        "var location = typeof window === 'undefined' ? {} : window.location",
        "var location = {}; // typeof window === 'undefined' ? {} : window.location",
      );
      return contents === fixed ? null : fixed;
    },
  },
  {
    name: 'ipfs',
    regex: [
      /ipfs\/src\/core\/components\/mfs\.js$/,
    ],
    hack(file, contents) {
      let fixed = contents;
      fixed = fixed.replace(
        'const mfsSelf = Object.assign({}, self)',
        'const mfsSelf = { ...self }',
      );
      return contents === fixed ? null : fixed;
    },
  },
  {
    name: 'orbit-db-keystore',
    regex: [
      /orbit-db-keystore\/src\/keystore\.js$/,
    ],
    hack(file, contents) {
      let fixed = contents;
      fixed = fixed.replace(
        'let key = JSON.parse(this._storage.getItem(id))',
        'let key;\n' +
        '    try {\n' +
        '      key = JSON.parse(this._storage.getItem(id))\n' +
        '    } catch (e) {}',
      );
      return contents === fixed ? null : fixed;
    },
  },
  {
    name: 'libp2p-websockets',
    regex: [
      /libp2p-websockets\/src\/index\.js$/,
      /libp2p-websockets\/src\/listener\.js$/,
    ],
    hack(file, contents) {
      let fixed = contents;

      if (/index.js/.test(file)) {
        fixed = fixed.replace(
          'const url = toUri(ma)',
          "const url = 'wss://ipfs.3box.io:443'//toUri(ma)",
        );
      } else if (/listener.js/.test(file)) {
        fixed = fixed.replace(
          "const createServer = require('pull-ws/server') || noop",
          "const createServer = noop; // require('pull-ws/server') || noop",
        );
      }
      return contents === fixed ? null : fixed;
    },
  },
];

function hackFiles(hacks) {
  const finder = find('./node_modules');
  hacks = hacks || hackers.map(h => h.name);

  finder.on('file', (file) => {
    if (!/\.(js|json)$/.test(file) || /\/tests?\//.test(file)) {
      return;
    }

    file = file.replace(/\\/g, path.posix.sep);

    const matchingHackers = hackers.filter((hacker) => {
      return hacks.includes(hacker.name) && hacker.regex.some((regex) => regex.test(file));
    });

    if (!matchingHackers.length) return;

    file = path.resolve(file);
    fs.readFile(file, { encoding: 'utf8' }, onread); // eslint-disable-line

    function onread(err, str) {
      if (err) throw err;

      const hackedResult = matchingHackers.reduce((hacked, hacker) => {
        return hacker.hack(file, hacked || str) || hacked;
      }, str);

      if (hackedResult && hackedResult !== str) {
        console.log('hacking', file);
        fs.writeFile(file, hackedResult);
      }
    }
  });
}

hackFiles();

module.exports = hackFiles;
