# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0](https://github.com/klarna-incubator/aps-evaluator/compare/v1.5.0...v2.0.0) (2024-01-12)


### ⚠ BREAKING CHANGES

* support for multi possible values for productId and merchantName

### Features

* support for multi possible values for productId and merchantName ([7a3200c](https://github.com/klarna-incubator/aps-evaluator/commit/7a3200c7dd4349ff6d3401092804d63718eaae31))

## [1.5.0](https://github.com/klarna-incubator/aps-evaluator/compare/v1.4.0...v1.5.0) (2024-01-12)


### Features

* support for multi possible values for productId and merchantName ([3f044af](https://github.com/klarna-incubator/aps-evaluator/commit/3f044af87cfad2a086c95f04610c018914c3b21a))

## [1.4.0](https://github.com/klarna-incubator/aps-evaluator/compare/v1.3.2...v1.4.0) (2023-12-13)


### Features

* support for multi possible values for line item fields ([46dfa97](https://github.com/klarna-incubator/aps-evaluator/commit/46dfa979ece5e2660328675b99b8f7d30ecd13cb))


### Bug Fixes

* export lineitem type ([80c18f4](https://github.com/klarna-incubator/aps-evaluator/commit/80c18f407ab18ecb69ae525b82c585d49692d9f4))

## [1.3.2](https://github.com/klarna-incubator/aps-evaluator/compare/v1.3.1...v1.3.2) (2023-11-20)


### Bug Fixes

* Fixed issue where fallback values for line-item quantity was not implemented correctly ([083c8eb](https://github.com/klarna-incubator/aps-evaluator/commit/083c8ebdfa02fbab09bb0f033150784be8f2fb5c))
* Return partial match when comparing null and zero values for numerics if partial matching is enabled ([7b75ddc](https://github.com/klarna-incubator/aps-evaluator/commit/7b75ddcce377b89da3d35689591938f7ab99f300))

## [1.3.1](https://github.com/klarna-incubator/aps-evaluator/compare/v1.3.0...v1.3.1) (2023-11-17)


### Bug Fixes

* Fixed issue where tracking numbers were not compared correctely ([fdb3407](https://github.com/klarna-incubator/aps-evaluator/commit/fdb340730c2a9ca2fbdd2149324ec4e569475a6d))

## [1.3.0](https://github.com/klarna-incubator/aps-evaluator/compare/v1.2.0...v1.3.0) (2023-11-17)


### Features

* Added APS_FIELDS constant to exports ([6c4bc8d](https://github.com/klarna-incubator/aps-evaluator/commit/6c4bc8db9ec8797002953eb2fe4f54eb48640986))
* Updated package exports to include types for ComparisonInput and ComparisonResult as well as MatchKey enum ([335fd46](https://github.com/klarna-incubator/aps-evaluator/commit/335fd46d142e10e1d0b190a283464f273c2b74a1))


### Bug Fixes

* Removed unused commands and dependencies from package.json and standardized timezone when running tests ([0f4981c](https://github.com/klarna-incubator/aps-evaluator/commit/0f4981ca829521e2924cf1c6c8ab92d25fbefb36))

## [1.2.0](https://github.com/klarna-incubator/aps-evaluator/compare/v1.1.0...v1.2.0) (2023-11-17)


### Features

* Updated license from MIT to Apache 2.0 ([67d4b1a](https://github.com/klarna-incubator/aps-evaluator/commit/67d4b1ace86bb75febd734895350952820a3f12b))

## [1.1.0](https://github.com/klarna-incubator/aps-evaluator/compare/v1.0.0...v1.1.0) (2023-11-16)


### Features

* refactoring ([3e723d4](https://github.com/klarna-incubator/aps-evaluator/commit/3e723d40d4ee60f7004b0fcc7716359edcb830e6))

## 1.0.0 (2023-11-14)


### Bug Fixes

* readme doc ([0c4d456](https://github.com/klarna-incubator/aps-evaluator/commit/0c4d45653dd0bfdd95e0d7875105632126272197))

## [0.0.1] - 2023-11-12

### Added

- Initial implementation

<!-- Markdown link dfn's -->

[0.0.1]: https://github.com/klarna-incubator/TODO/releases/tag/v0.0.1
