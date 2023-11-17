# APS Evaluator

APS is an acronym for Accurately Parsed Score and aims to provide a unified standard for comparing parsing results and ground truths.

## Usage

Check the basic [example](test/index.ts)

## Development

### Installation

The project uses [Volta](https://volta.sh/) to manage node and yarn version management. Once you have volta installed you can run the following command to install dependencies:

```shell
yarn install
```

### Build

Alternatively, if you want to build and run:

```bash
yarn build
```

### Testing

```bash
yarn test
```

During development it can be helpful to run the tests automatically whenever a file is changed.
You can do this by appending the `--watch` flag.

```bash
yarn test --watch
```

### Linting

```bash
yarn lint
```

If you also want to fix any found linting errors:

```bash
yarn lint --fix
```

## How to contribute

See our guide on [contributing](.github/CONTRIBUTING.md).

## Release History

See our [changelog](CHANGELOG.md).

## License

Copyright © 2022 Klarna Bank AB

For license details, see the [LICENSE](LICENSE) file in the root of this project.

<!-- Markdown link & img dfn's -->

[ci-image]: https://img.shields.io/badge/build-passing-brightgreen?style=flat-square
[ci-url]: https://github.com/klarna-incubator/TODO
[license-image]: https://img.shields.io/badge/license-Apache%202-blue?style=flat-square
[license-url]: http://www.apache.org/licenses/LICENSE-2.0
[klarna-image]: https://img.shields.io/badge/%20-Developed%20at%20Klarna-black?style=flat-square&labelColor=ffb3c7&logo=klarna&logoColor=black
[klarna-url]: https://klarna.github.io
