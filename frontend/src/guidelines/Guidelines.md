# KANGO Design System

> A modern, mobile-first design system for the KANGO Smart Bus Navigation app. Ensures visual consistency, professional polish, and excellent user experience across all platforms.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Color System](#color-system)
5. [Spacing & Layout](#spacing--layout)
6. [Component Patterns](#component-patterns)
7. [Responsive Design](#responsive-design)
8. [Animations & Motion](#animations--motion)
9. [Accessibility](#accessibility)

---

## Design Philosophy

**Mobile-First Consumer App Aesthetic**

KANGO prioritizes:
- **Clarity** - Clear hierarchy, readable text, intuitive navigation
- **Accessibility** - WCAG 2.1 AA compliant, keyboard navigation, screen reader support
- **Polish** - Subtle animations, smooth transitions, thoughtful micro-interactions
- **Consistency** - Unified visual language across all pages and components
- **Performance** - Smooth 60fps animations, optimized UI rendering

### Principles

1. **Mobile First** - Design for small screens first, then enhance for larger breakpoints
2. **Less is More** - Avoid clutter; use whitespace strategically
3. **Semantic Colors** - Always use semantic colors (primary, danger, success, warning) over raw hex codes
4. **Component Reuse** - Maximize use of pre-built UI components; avoid custom styling
5. **Accessibility by Default** - Built-in ARIA, focus states, keyboard support on all interactive elements

---

## Design Tokens

### Color Reference Structure

All colors follow OKLCH color space (modern, perceptually uniform). Base palette in [index.css](../index.css):
- **Red**: 50, 100, 500, 600, 700
- **Orange**: 50, 100, 200, 400, 500, 600, 700, 900
- **Yellow**: 50, 200, 400, 500, 600, 700
- **Green**: 50, 100, 200, 500, 600, 700, 900
- **Blue**: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900
- **Purple**: 50, 100, 200, 500, 600, 700, 800, 900
- **Gray**: 50, 100, 200, 300, 400, 500, 600, 700, 800
- **Black/White**: #000, #fff

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--primary-color` | `#2563eb` (blue-600) | Primary actions, interactive elements, links |
| `--primary-dark` | `#1e40af` (blue-700) | Primary hover, active states |
| `--success-color` | `#10b981` (green-500) | Success messages, confirmations |
| `--warning-color` | `#f59e0b` (orange-500) | Warnings, important notices |
| `--danger-color` | `#ef4444` (red-500) | Errors, destructive actions |
| `--background-primary` | `#ffffff` (light), `#111827` (dark) | Main background |
| `--background-secondary` | `#f9fafb` (light), `#1f2937` (dark) | Secondary background |
| `--text-primary` | `#111827` (light), `#f9fafb` (dark) | Primary text |
| `--text-secondary` | `#6b7280` (light), `#9ca3af` (dark) | Secondary text, labels |
| `--border-color` | `#e5e7eb` (light), `#374151` (dark) | Borders, dividers |

### Crowd Level Indicators

- `--crowd-low`: Green (#10b981) - Low bus occupancy
- `--crowd-medium`: Orange (#f59e0b) - Medium occupancy
- `--crowd-high`: Red (#ef4444) - High occupancy

---

## Typography

### Font Family

**System Font Stack** (optimized for all platforms):
```css
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif
```

### Font Sizes & Line Heights

| Scale | Size | Line Height | Usage |
|-------|------|-------------|-------|
| **xs** | 0.75rem (12px) | 1.5 | Form labels, captions, badges |
| **sm** | 0.875rem (14px) | 1.43 | Secondary text, helper text |
| **base** | 1rem (16px) | 1.5 | Body text, standard labels |
| **lg** | 1.125rem (18px) | 1.56 | Section introductions |
| **xl** | 1.25rem (20px) | 1.4 | Subheadings, card titles |
| **2xl** | 1.5rem (24px) | 1.33 | Page titles, main headings |
| **3xl** | 1.875rem (30px) | 1.2 | Large section titles |
| **5xl** | 3rem (48px) | 1 | Hero headings |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| **Regular** | 400 | Body text (default) |
| **Medium** | 500 | Labels, form inputs |
| **Semibold** | 600 | Subheadings, card titles, buttons |
| **Bold** | 700 | Headings (h1-h3), emphasis |

### Heading Hierarchy

```tsx
<h1 className="text-5xl font-bold">Page Title</h1>
<h2 className="text-3xl font-bold">Section</h2>
<h3 className="text-2xl font-semibold">Subsection</h3>
<h4 className="text-xl font-semibold">Card Title</h4>
<h5 className="text-lg font-semibold">Modal Title</h5>
<p className="text-base font-medium">Body Text</p>
```

---

## Color System

### Light Mode

```
Background:
  Primary: #ffffff (white)
  Secondary: #f9fafb (gray-50)
  Tertiary: #f3f4f6 (gray-100)

Text:
  Primary: #111827 (gray-900)
  Secondary: #6b7280 (gray-500)
  Tertiary: #9ca3af (gray-400)

Borders:
  Default: #e5e7eb (gray-200)
  Light: #f3f4f6 (gray-100)
```

### Dark Mode

```
Background:
  Primary: #111827 (gray-900)
  Secondary: #1f2937 (gray-800)
  Tertiary: #374151 (gray-700)

Text:
  Primary: #f9fafb (gray-50)
  Secondary: #9ca3af (gray-400)
  Tertiary: #6b7280 (gray-500)

Borders:
  Default: #374151 (gray-700)
  Light: #4b5563 (gray-600)
```

### Interactive States

All interactive elements follow this pattern:

| State | Opacity/Color | Usage |
|-------|---------------|-------|
| **Default** | `100%` | Normal state |
| **Hover** | `-7% lightness, +15% saturation` | Mouse over |
| **Active** | `-15% lightness, +20% saturation` | Pressed/clicked |
| **Disabled** | `gray-300 / gray-600 dark` | Disabled state, 50% opacity |
| **Focus** | `ring-2 ring-primary-color` | Keyboard focus |

---

## Spacing & Layout

### Spacing Scale

Base unit: **0.25rem (4px)**

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 0.5rem (8px) | Tight spacing, icon gaps |
| **sm** | 1rem (16px) | Component padding, small gaps |
| **md** | 1.5rem (24px) | Section padding, standard gaps |
| **lg** | 2rem (32px) | Large gaps, section margins |
| **xl** | 3rem (48px) | Major section separation |
| **2xl** | 4rem (64px) | Full-screen section spacing |

### Layout Grid

- **Mobile** (< 768px): Full width, 16px padding
- **Tablet** (768px - 1024px): Max-width 750px, centered
- **Desktop** (> 1024px): Max-width 1200px, centered

### Container Sizes

```
--container-md: 28rem (448px)
Container full: flex-1 / w-full for mobile-first
```

### Common Padding Patterns

| Pattern | Values | Usage |
|---------|--------|-------|
| **Dialog/Modal** | `p-6` (24px) | Padding on modals and overlays |
| **Card** | `p-4` (16px) (mobile), `p-6` (desktop) | Card content |
| **Page** | `px-4` (16px) (mobile), `px-6` (desktop) | Page content |
| **Form** | `gap-4` (16px) between fields | Form field spacing |
| **Buttons** | `px-4 py-2` (small), `px-6 py-3` (large) | Button padding |

---

## Component Patterns

### Buttons

Four primary variants:

#### Primary Button
- **Usage**: Main actions, CTAs, form submissions
- **Styling**: `bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800`
- **States**: Default, Hover, Active, Disabled, Loading

#### Secondary Button
- **Usage**: Alternative actions, less prominent
- **Styling**: `bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white`
- **States**: Default, Hover, Active, Disabled

#### Ghost Button
- **Usage**: Less prominent actions, links
- **Styling**: `bg-transparent text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800`
- **States**: Default, Hover, Active, Disabled

#### Outline Button
- **Usage**: Destructive actions, secondary emphasis
- **Styling**: `border-2 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400`
- **States**: Default, Hover, Active, Disabled

**Button Sizes**:
- Small: `px-3 py-1.5 text-sm`
- Medium: `px-4 py-2 text-base`
- Large: `px-6 py-3 text-lg`

### Form Inputs

**Standard Input Field**:
```tsx
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600" />
```

**States**:
- Default: `border-gray-300 dark:border-gray-600`
- Focus: `ring-2 ring-blue-500 border-transparent`
- Error: `border-red-500 ring-2 ring-red-500`
- Disabled: `bg-gray-100 cursor-not-allowed opacity-50`

**Validation**:
- Error text: `text-sm text-red-600 dark:text-red-400 mt-1`
- Success text: `text-sm text-green-600 dark:text-green-400 mt-1`
- Helper text: `text-sm text-gray-500 dark:text-gray-400 mt-1`

### Cards

**Card Component**:
```tsx
<Card className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
  {/* Content */}
</Card>
```

**Shadow Hierarchy**:
- Card default: `shadow-md` (0 4px 6px -1px rgba(0,0,0,0.1))
- Card hover (optional): `shadow-lg`
- Modal/Dialog: `shadow-xl` (0 20px 25px -5px rgba(0,0,0,0.1))

### Badges

**Success Badge**: `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
**Warning Badge**: `bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`
**Error Badge**: `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
**Info Badge**: `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`

---

## Responsive Design

### Breakpoints

```
Mobile:   0px - 640px     (default)
Tablet:   640px - 1024px  (sm:)
Desktop:  1024px+         (lg:)
```

### Mobile-First Approach

1. **Mobile** (default styles, no prefix)
2. **Tablet** (add `sm:` classes for 640px+ screens)
3. **Desktop** (add `lg:` classes for 1024px+ screens)

#### Example:
```tsx
<div className="px-4 sm:px-6 lg:px-8">
  {/* 16px padding mobile, 24px tablet, 32px desktop */}
</div>

<h1 className="text-2xl sm:text-3xl lg:text-5xl">
  {/* 24px mobile, 30px tablet, 48px desktop */}
</h1>
```

### Component Responsiveness

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| **Card Padding** | `p-4` | `p-5` | `p-6` |
| **Dialog Width** | `full` | `max-w-md` | `max-w-lg` |
| **Grid Columns** | `grid-cols-1` | `grid-cols-2` | `grid-cols-3+` |
| **Modal Padding** | `p-4` | `p-6` | `p-6` |
| **Page Padding** | `px-4` | `px-6` | `px-8` |

### Navigation Responsive

- **Mobile**: Hamburger menu / bottom nav, full-width
- **Tablet**: Side nav or full horizontal nav, constrained width
- **Desktop**: Full horizontal/side nav, max-width container

---

## Animations & Motion

### Duration Standards

| Duration | Value | Usage |
|----------|-------|-------|
| **Quick** | 150ms | Quick feedback, hover states |
| **Normal** | 300ms | Standard transitions, modals |
| **Slow** | 500ms | Entrance animations, complex transitions |

### Timing Functions

- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- **Entrance**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (ease-out-back)
- **Dismissal**: `cubic-bezier(0.3, 0, 0.8, 0.15)` (ease-in)

### Animation Patterns

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 300ms ease-out;
```

#### Slide Up
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: slideUp 300ms ease-out;
```

#### Scale
```css
@keyframes scale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
animation: scale 300ms ease-out;
```

### Implementation

Always use Tailwind transition utilities:

```tsx
<button className="transition duration-300 ease-out hover:bg-blue-700">
  Click me
</button>

<div className="animate-fade-in">
  Content
</div>
```

### Micro-interactions

- **Button Hover**: Slight scale or color shift, 150ms
- **Form Focus**: Subtle glow effect (ring), no animation needed
- **Page Transition**: 300ms fade/slide combo
- **Modal Entrance**: Scale + fade, 300ms
- **Success Notification**: Slide in + auto-dismiss, 500ms total

---

## Accessibility

### Color Contrast (WCAG 2.1 AA)

- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18px+): 3:1 contrast ratio
- **Disabled**: Can be lower, but should meet 3:1 if possible

### Keyboard Navigation

- Tab through all interactive elements in logical order
- Escape key closes modals
- Enter/Space activates buttons
- Arrow keys for custom components (slider, tabs, etc.)

### Focus Indicators

All interactive elements must have visible focus states:
```tsx
className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
```

### ARIA Labels

- Use `aria-label` for icon-only buttons
- Use `aria-describedby` for form validation messages
- Use `aria-live` for notifications
- Use `aria-modal="true"` for modals
- Use `aria-hidden="true"` for decorative elements

### Screen Reader

- Meaningful alt text for images
- Semantic HTML (buttons, links, headings)
- Form labels associated with inputs via `htmlFor`
- Skip navigation link on first tab
- Page title updates on route change

### Dark Mode Support

KANGO implements dark mode via `next-themes`:

```tsx
<div className="text-gray-900 dark:text-gray-50">
  {/* Automatically adapts to system preference or user toggle */}
</div>
```

---

## Implementation Checklist

When building a new component, ensure:

- [ ] Uses semantic colors, not hex codes
- [ ] Follows typography hierarchy
- [ ] Proper spacing using design token scale
- [ ] Mobile-first responsive design (sm: and lg: breakpoints)
- [ ] Smooth transitions/animations (150-300ms)
- [ ] Proper focus states and keyboard navigation
- [ ] Dark mode support with `dark:` variants
- [ ] ARIA labels and semantic HTML
- [ ] 4.5:1 color contrast ratio minimum
- [ ] Component reuse from UI library

---

## Resources

- **Color Palette**: [OKLCH Color Picker](https://oklch.com)
- **Icons**: [Lucide React](https://lucide.dev) (487 icons)
- **UI Components**: [Radix UI](https://radix-ui.com) + Tailwind CSS
- **Testing**: Use DevTools at 375px, 768px, 1024px mobile/tablet/desktop
- **Dark Mode**: [next-themes Documentation](https://github.com/pacocoursey/next-themes)

---

## Maintenance

This document is living and evolves with the design system. Update when:
- Adding new component patterns
- Changing color semantics
- Establishing new spacing/sizing conventions
- Documenting discovered best practices

**Last Updated**: February 14, 2026
