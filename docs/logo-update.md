# SafeChat Logo Asset Update

Date: 2026-05-22

## Source

- Source file: `/Users/robgraham/Desktop/safe chat logos.png`
- Brand direction: plus-cross chat bubble identity, replacing the previous heart mark.

## Updated Assets

The app image assets now use the plus-cross identity:

- `app/images/logo-nav.png`
- `app/images/logo-nav-light.png`
- `app/images/icon-bubble.png`
- `app/images/icon-32.png`
- `app/images/icon-64.png`
- `app/images/icon-128.png`
- `app/images/icon-180.png`
- `app/images/icon-192.png`
- `app/images/icon-512.png`
- `app/images/logo-dark.png`
- `app/images/logo-light.png`

## Notes

- The previous dark heart/text logo was replaced because it did not read on the dark app background.
- Logo assets have transparent backgrounds.
- The current nav asset preserves the full horizontal plus-cross SafeChat mark and is sized to the existing `215x56` file contract used by `app/index.html`.
- PWA and favicon assets use the chat bubble with plus-cross only, not the rounded-square tile.
- The app icon sizes preserve the existing manifest and favicon filenames, so no HTML or manifest references were changed.

## Verification

- `npm test` passed: 446 passed, 0 failed.

## Separate Review Items

The verifier findings are still separate from this logo update:

- `.github/scripts/verify-resources.js` should handle array phone numbers.
- `.github/workflows/verify-resources.yml` should allow issue creation after verifier failures.
