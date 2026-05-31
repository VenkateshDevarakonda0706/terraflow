# TerraFlow Design System

TerraFlow is the Memory Layer of Earth. The interface should feel like a premium spatial product: cinematic, quiet, direct, and centered on the globe.

## Product Principles

- The globe is the product surface.
- Exploration comes before account creation.
- Controls float above Earth and disappear into the background.
- Memory detail should feel like arriving at a place, not opening a dashboard modal.
- Upload should stay under 30 seconds: image, location, title, visibility, publish.

## Typography

- Display: Inter 900, tight tracking, 0.88-1.05 line-height.
- Section labels: 11px, 900 weight, uppercase, 0.16-0.28em tracking.
- Body: 13-15px, 1.6-1.7 line-height.
- Controls: 12-13px, 800-900 weight.

## Spacing

- 4px: micro gaps.
- 8px: control clusters.
- 12px: compact rhythm.
- 18px: card body rhythm.
- 24px: panel padding.
- 28px: screen-edge offset on desktop.
- 32-34px: premium card radii.

## Color Tokens

- `--tf-bg`: deep space background.
- `--tf-surface`: translucent glass panel.
- `--tf-surface-strong`: elevated panel.
- `--tf-border-soft`: subtle glass border.
- `--tf-text`: primary text.
- `--tf-muted`: body copy.
- `--tf-faint`: secondary metadata.
- `--tf-accent`: violet memory glow.
- `--tf-accent-2`: atmospheric blue.
- `--tf-warm`: human warmth accent.
- `--tf-good`: success.
- `--tf-danger`: destructive/error.

## Motion

- Fast: `160ms cubic-bezier(0.16, 1, 0.3, 1)` for taps and hover.
- Medium: `360ms` for panels and search.
- Slow: `720ms` for media scale and reveal polish.
- Memory reveal uses scale, blur, and vertical lift.
- Search drops from the nav center.
- Stars drift slowly to create depth without competing with Earth.

## Core Components

- Globe canvas: fullscreen, atmospheric, default Cesium controls hidden.
- Floating nav: Explore, Search, Upload, Alerts, Profile.
- Hero card: guest-only, bottom-left, short and emotional.
- Featured memory chips: small entry points into the world, not a feed.
- Search panel: centered command surface with skeleton loading.
- Memory card: immersive image-first place card with location, user, date, description, and fly action.
- Publish card: split image/form layout with progress rail and frictionless fields.
- Mobile nav: bottom native-style navigation with full-screen globe preserved.

## Mobile Rules

- Globe remains full-screen.
- Primary navigation moves to the bottom.
- Hero compresses to a thumb-reachable card above the nav.
- Memory cards become bottom sheets.
- Upload becomes a vertical, scrollable sheet.
