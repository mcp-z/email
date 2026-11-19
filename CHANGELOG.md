# Changelog

## [1.1.6] - 2026-11-18

### Fixed

- `extractCurrentMessageFromHtml` kept the quoted history and returned the original HTML unchanged for HTML nested thousands of elements deep. It now removes the quotes. This needs `node-html-parser` 9.0.7 or later, which the dependency range now requires.

## [1.1.5] - 2026-11-16

### Added

- `headerText(description)` (a string schema that rejects line breaks and other control characters, tab allowed), `sanitizeHeaderText(value)` (turns each run of such characters into one space) and `HEADER_UNSAFE` (the character set) are exported, so mail servers can keep text out of header lines.

### Changed

- `createEmailRecipientsSchema` (To, Cc, Bcc) now rejects values containing line breaks or other control characters, with an error naming the field and the rule. Previously such a value passed validation and could add extra header lines to the message.

### Fixed

- `stripHtml` and `extractCurrentMessageFromHtmlToText` returned an empty body for HTML nested thousands of elements deep; they now return its text.

## [1.1.1] - 2026-08-30

Documentation and lockfile refresh only; the code is identical to 1.1.0.

## [1.1.0] - 2026-08-29

Test and tooling only; the public API is unchanged. The suite now verifies the package loads through the CommonJS, ESM, and `.ts` entry points.

## [1.0.4] - 2026-08-28

### Changed

- `engines.node` raised from `>=14` to `>=16`.

## [1.0.3] - 2026-08-23

### Changed

- The `node-html-parser` dependency is now 9.x (was 7.x).

## [1.0.2] - 2026-01-03

No changes; the code is identical to 1.0.1.

## [1.0.1] - 2026-01-03

### Changed

- The `zod` dependency floor is raised to `^4.3.4` (was `^4.0.0`).

## [1.0.0] - 2025-12-28

Initial release.
