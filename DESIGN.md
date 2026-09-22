# Relod design system

## Direction

Desert Indigo: a warm paper canvas, deep indigo actions, saffron highlights, readable evidence, and a single decision-trace motif connecting policy clause, approved rule, order fact, and outcome. The palette intentionally avoids the green/teal association of commerce platforms such as Salla.

## Tokens

Light mode uses a warm near-white canvas, white surfaces, deep ink text, `#4F46E5` indigo primary action, saffron highlight, and separated eligibility/status colors. Dark mode uses an ink-indigo canvas, elevated dark surfaces, soft lavender text, and lighter indigo actions. Tokens are defined as CSS variables in `src/index.css` and consumed through Tailwind utilities.

## Typography

Sora is used for display headings. Manrope is used for body copy, labels, navigation, tables, and forms. Both are bundled through Fontsource with system fallbacks.

## Layout

Public marketing content uses a maximum width near 1200px. Merchant content uses a maximum width near 1280px with a stable sidebar. Customer forms use a maximum width near 520px. Mobile flows stack content and keep primary actions full width.

## Motion and interaction

Buttons use short transitions. Cards use subtle border or shadow changes. Disclosures use Radix keyboard behavior. Reduced motion disables translated movement and prolonged animation. There are no decorative looping animations or forced scroll effects.

## Accessibility and future RTL

Controls use visible focus styles, semantic labels, keyboard-friendly Radix primitives, and separate outcome/status labels. The current implementation is English/LTR. Future Arabic work should use logical spacing and direction-aware icon handling rather than duplicating layouts.
