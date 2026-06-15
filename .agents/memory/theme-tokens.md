---
name: Dark/Light theme system — landing page
description: How the landing-page implements dark/light mode with CSS custom properties
---

## Rule
Landing page uses a CSS custom property token system. All neutral colors (bg, border, text) go through `var(--token)`. Accent colors (blue/violet gradient, amber, green) stay hardcoded — only neutrals swap.

## Token set
`:root` = dark defaults; `[data-theme="light"]` = overrides on `<html>`.

Tokens: `--bg`, `--bg-alt`, `--bg-card`, `--bg-input`, `--nav-bg`, `--foot-bg`, `--bd`, `--bd-soft`, `--bd-sub`, `--bd-mid`, `--bd-btn`, `--bd-foot`, `--tx`, `--tx-muted`, `--tx-dim`, `--tx-faint`, `--tx-ghost`, `--grid`

## Toggle mechanism
`useTheme()` hook in App.tsx: reads localStorage `"theme"`, calls `document.documentElement.setAttribute("data-theme", ...)` on change, persists to localStorage. Sun/Moon button in NavBar.

**Why:** CSS-variable approach means zero JavaScript color switching — one attribute change on `<html>` applies everywhere via cascade.

**How to apply:** When adding new components, use `var(--tx)` / `var(--bg-card)` / `var(--bd)` for neutral colors in inline styles. Never hardcode oklch values for content text/bg/borders.
