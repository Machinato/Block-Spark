# Design System: Dark Prism

## Concept

The 3D prism is the sole source of color on the page. All UI components are neutral, dark, and restrained — they exist to frame the prism, not compete with it. Color is used sparingly: only for interactive states, gradients on key CTAs, and status indicators.

---

## Color Tokens

These tokens are defined in `globals.css` and mapped via `@theme inline`. **Never use raw Tailwind color names** like `fuchsia-500`, `purple-600`, `orange-400` directly in components.

### Backgrounds

| Token class | CSS variable | Usage |
|---|---|---|
| `bg-background` | `--background` | Page background (`#0a0a0b`) |
| `bg-card` | `--card` | Cards, panels, modals (`#111113`) |
| `bg-secondary` | `--secondary` | Inputs, hover states, elevated surfaces |
| `bg-muted` | `--muted` | Subtle fills, disabled states |

### Text

| Token class | CSS variable | Usage |
|---|---|---|
| `text-foreground` | `--foreground` | Primary text — warm near-white |
| `text-muted-foreground` | `--muted-foreground` | Secondary text, labels, captions |
| `text-accent-glow` | `--accent-glow` | Highlight text, near-white with glow feel |

### Borders

| Token class | CSS variable | Usage |
|---|---|---|
| `border-border` | `--border` | Default border — barely visible |
| `border-accent-from/30` | `--accent-from` at 30% | Hover border on cards |
| `border-accent-from/60` | `--accent-from` at 60% | Active/focused border |

### Prism Accent (use sparingly)

These are the ONLY color tokens. Used for gradients, active states, CTAs, progress bars.

| Token class | CSS variable | Value | Represents |
|---|---|---|---|
| `from-accent-from` | `--accent-from` | violet/fuchsia | Top ray of the prism |
| `to-accent-to` | `--accent-to` | orange | Bottom ray of the prism |
| `text-accent-glow` | `--accent-glow` | near-white | Entry point of the beam |
| `bg-accent-from` | `--accent-from` | violet/fuchsia | Solid accent fill |
| `bg-accent-to` | `--accent-to` | orange | Solid accent fill |

---

## Typography

Font: **Geist** (already configured in `@theme inline`).

| Role | Classes | Usage |
|---|---|---|
| Display | `text-3xl font-semibold tracking-tight text-foreground` | Page titles |
| Heading | `text-xl font-semibold text-foreground` | Section headings |
| Body | `text-sm text-foreground` | Default body text |
| Caption | `text-xs text-muted-foreground` | Labels, hints, timestamps |
| Numeric | `text-2xl font-bold tabular-nums text-foreground` | Stats, amounts, counts |

---

## Component Patterns

### Card

```tsx
// ✅ Correct
<div className="bg-card border border-border rounded-lg p-6 
                hover:border-accent-from/30 transition-colors">

// ❌ Wrong
<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
```

### CTA Button (primary gradient)

```tsx
// ✅ Correct — only used for the main CTA, once per view
<button className="bg-gradient-to-r from-accent-from to-accent-to 
                   text-white font-medium px-6 py-2.5 rounded-lg
                   hover:opacity-90 transition-opacity">

// ❌ Wrong
<button className="bg-gradient-to-r from-fuchsia-500 to-orange-500 ...">
```

### Secondary Button

```tsx
// ✅ Correct — no color, just border
<button className="border border-border text-foreground 
                   hover:border-accent-from/30 hover:text-foreground
                   px-6 py-2.5 rounded-lg transition-colors">
```

### ProgressBar

```tsx
// ✅ Correct
<div className="h-1.5 bg-secondary rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full transition-all"
    style={{ width: `${percent}%` }}
  />
</div>

// ❌ Wrong
<div className="h-1.5 bg-zinc-800 rounded-full">
  <div className="h-full bg-gradient-to-r from-fuchsia-500 to-orange-500" ...>
```

### StatusBadge

Status uses accent tokens — NOT arbitrary colors. There are only 3 statuses.

```tsx
// ✅ Correct
const variants = {
  active:     'border-accent-from/40 text-accent-from bg-accent-from/10',
  successful: 'border-accent-to/40 text-accent-to bg-accent-to/10',
  failed:     'border-border text-muted-foreground bg-muted',
}
<span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${variants[status]}`}>

// ❌ Wrong
<span className="bg-purple-500/20 text-purple-300 border-purple-500/30 ...">
<span className="bg-green-500/20 text-green-300 ...">
```

### StatCard

```tsx
// ✅ Correct — no color, pure neutral
<div className="bg-card border border-border rounded-lg p-6">
  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
  <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
</div>

// ❌ Wrong
<div className="bg-gradient-to-br from-fuchsia-500/20 to-orange-500/20 ...">
```

### Input / Form Field

```tsx
// ✅ Correct
<input className="bg-secondary border border-border rounded-lg px-4 py-2.5
                  text-foreground placeholder:text-muted-foreground
                  focus:outline-none focus:border-accent-from/60
                  transition-colors w-full" />
```

### Header

```tsx
// ✅ Correct — transparent with blur, single gradient CTA
<header className="fixed top-0 inset-x-0 z-50 
                   bg-background/60 backdrop-blur-md 
                   border-b border-border">
  {/* Logo — white only, no color */}
  <span className="text-foreground font-semibold">BrandName</span>
  
  {/* CTA — only colored button in the header */}
  <button className="bg-gradient-to-r from-accent-from to-accent-to ...">
    Connect Wallet
  </button>
</header>
```

---

## Forbidden Patterns

These will be flagged during review. Replace every instance:

| ❌ Forbidden | ✅ Replacement |
|---|---|
| `from-fuchsia-500` | `from-accent-from` |
| `to-orange-500` | `to-accent-to` |
| `text-purple-300` | `text-accent-from` |
| `text-orange-300` | `text-accent-to` |
| `bg-purple-500/20` | `bg-accent-from/10` |
| `bg-orange-500/20` | `bg-accent-to/10` |
| `border-purple-500/30` | `border-accent-from/30` |
| `bg-zinc-900` | `bg-card` |
| `bg-zinc-800` | `bg-secondary` |
| `bg-zinc-950` | `bg-background` |
| `text-zinc-400` | `text-muted-foreground` |
| `text-zinc-500` | `text-muted-foreground` |
| `text-white` | `text-foreground` |
| `border-zinc-700` | `border-border` |
| `border-zinc-800` | `border-border` |
| `border-white/10` | `border-border` |

---

## Spacing & Radius

Always use the configured radius tokens — never hardcode `rounded-xl` for cards if the token differs.

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | `--radius-sm` | Badges, tags |
| `rounded-md` | `--radius-md` | Buttons, inputs |
| `rounded-lg` | `--radius-lg` | Cards, panels (default) |
| `rounded-xl` | `--radius-xl` | Featured cards, modals |
| `rounded-full` | — | Pills, avatars only |

Standard padding scale: `p-4` (compact), `p-6` (default card), `p-8` (spacious section).

---

## Dark Mode

The app is dark-first. The `.dark` class is applied on `<html>` in `layout.tsx`. All tokens already resolve to dark values. Do not add `dark:` variants for colors that are already handled by tokens.

```tsx
// ✅ Correct — token handles both themes
<div className="bg-card text-foreground">

// ❌ Wrong — double-handling what tokens already do  
<div className="bg-white dark:bg-zinc-900 text-black dark:text-white">
```

---

## What NOT to Do

- Do not use any Tailwind color outside of the token system (no `blue-*`, `green-*`, `red-*`, `purple-*`, `fuchsia-*`, `orange-*`, `zinc-*` etc.) except for `destructive` states
- Do not add decorative gradients to cards or backgrounds — the prism is the only gradient element on the page
- Do not use `shadow-*` utilities — depth is created through borders and background contrast, not shadows
- Do not use more than one gradient CTA per screen view
- Do not use `text-white` — always use `text-foreground` so light theme works in the future