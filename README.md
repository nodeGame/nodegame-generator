[nodeGame'](https://www.nodegame.org) game generator.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Linux Build][travis-image]][travis-url]

## Disclaimer

THIS PACKAGE IS WORK IN PROGRESS AND CURRENTLY BROKEN.

## Installation

```sh
$ npm install -g nodegame-generator
```

## Quick Start

The quickest way to get started with nodeGame is to utilize the executable `nodegame(1)` to generate a new game as shown below:

Create the game:

```bash
$ nodegame /tmp/mygame && cd /tmp/mygame
```

Install dependencies:

```bash
$ npm install
```

Rock and Roll

```bash
$ npm start
```

## Command Line Options

This generator can also be further configured with the following command line flags.

    -h, --help          output usage information
    -V, --version       output the version number
        --git           add .gitignore
    -f, --force         force on non-empty directory

## Kudos

Based on a fork of [Express Generator](https://github.com/expressjs/generator).

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/nodegame-generator.svg
[npm-url]: https://npmjs.org/package/nodegame-generator
[travis-image]: https://img.shields.io/travis/nodegamejs/generator/master.svg
[travis-url]: https://travis-ci.org/nodegamejs/generator
[downloads-image]: https://img.shields.io/npm/dm/nodegame-generator.svg
[downloads-url]: https://npmjs.org/package/nodegame-generator

