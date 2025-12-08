# Clean UI Design System - Quick Reference

## 🎨 Color Palette

### Primary Colors
```css
--primary-blue: #2563eb        /* Main brand color */
--primary-blue-dark: #1e40af   /* Hover states */
--primary-blue-light: #3b82f6  /* Accents */
```

### Accent Colors
```css
--accent-teal: #14b8a6         /* Secondary accent */
--accent-teal-dark: #0d9488
--accent-teal-light: #5eead4
```

### Neutral Grays
```css
--neutral-50: #f8fafc   /* Lightest background */
--neutral-100: #f1f5f9  /* Card backgrounds */
--neutral-200: #e2e8f0  /* Borders */
--neutral-300: #cbd5e1  /* Input borders */
--neutral-400: #94a3b8  /* Disabled text */
--neutral-500: #64748b  /* Secondary text */
--neutral-600: #475569  /* Body text */
--neutral-700: #334155  /* Headings */
--neutral-800: #1e293b  /* Dark text */
--neutral-900: #0f172a  /* Darkest */
```

### Status Colors
```css
--success: #10b981   /* Green - success states */
--warning: #f59e0b   /* Orange - warnings */
--error: #ef4444     /* Red - errors */
--info: #3b82f6      /* Blue - information */
```

### Activity Type Colors
```css
--activity-work: #3b82f6      /* Blue */
--activity-break: #f59e0b     /* Orange */
--activity-lunch: #10b981     /* Green */
--activity-meeting: #8b5cf6   /* Purple */
--activity-epub: #ec4899      /* Pink */
--activity-proof: #f97316     /* Deep Orange */
--activity-calibr: #14b8a6    /* Teal */
--activity-other: #64748b     /* Gray */
--activity-leave: #ef4444     /* Red */
```

## 📏 Spacing System

### Standard Spacing
```
4px   → var(--space-1)
8px   → var(--space-2)
12px  → var(--space-3)
16px  → var(--space-4)  ← Base unit
20px  → var(--space-5)
24px  → var(--space-6)
32px  → var(--space-8)
40px  → var(--space-10)
48px  → var(--space-12)
64px  → var(--space-16)
```

### Usage Guidelines
- **Padding**: Use space-3 to space-6 for most components
- **Margins**: Use space-4 to space-8 for section spacing
- **Gaps**: Use space-2 to space-4 for flex/grid gaps

## 🔤 Typography

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-display: 'Inter', sans-serif;
```

### Font Sizes
```
0.6875rem (11px) → Small badges
0.75rem (12px)   → Tiny text, metadata
0.8125rem (13px) → Small text
0.875rem (14px)  → Base size (body text)
1rem (16px)      → Medium text
1.125rem (18px)  → Subheadings
1.25rem (20px)   → Section titles
1.5rem (24px)    → Page titles
```

### Font Weights
```
400 → Normal text
500 → Medium (labels, emphasis)
600 → Semibold (buttons, headings)
700 → Bold (titles)
```

## 📐 Border Radius

```css
--radius-sm: 0.375rem (6px)    /* Small elements */
--radius-md: 0.5rem (8px)      /* Buttons, inputs */
--radius-lg: 0.75rem (12px)    /* Cards */
--radius-xl: 1rem (16px)       /* Large cards */
--radius-2xl: 1.5rem (24px)    /* Hero sections */
--radius-full: 9999px          /* Pills, badges */
```

## 🌑 Shadows

### Shadow Levels
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
/* Use for: Subtle elevation, cards at rest */

--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
/* Use for: Buttons, hover states */

--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
/* Use for: Dropdowns, popovers */

--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
/* Use for: Modals, toasts */
```

## ⚡ Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
/* Use for: Small UI changes, color changes */

--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
/* Use for: Most interactions, hover states */

--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
/* Use for: Large movements, modal animations */
```

## 🎯 Component Patterns

### Buttons
```css
/* Primary Button */
background: var(--primary-blue);
color: var(--white);
padding: var(--space-2) var(--space-4);
border-radius: var(--radius-md);
font-weight: 500;

/* Secondary Button */
background: var(--white);
color: var(--neutral-700);
border: 1px solid var(--neutral-300);
```

### Cards
```css
background: var(--white);
border: 1px solid var(--neutral-200);
border-radius: var(--radius-xl);
padding: var(--space-6);
box-shadow: var(--shadow-sm);
```

### Inputs
```css
padding: var(--space-2) var(--space-3);
border: 1px solid var(--neutral-300);
border-radius: var(--radius-md);
font-size: 0.875rem;

/* Focus State */
border-color: var(--primary-blue);
box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
```

### Badges
```css
padding: var(--space-1) var(--space-3);
border-radius: var(--radius-full);
font-size: 0.6875rem;
font-weight: 600;
text-transform: uppercase;
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  /* Reduce spacing */
  /* Stack layouts */
  /* Smaller text */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Medium spacing */
  /* Flexible layouts */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full spacing */
  /* Multi-column layouts */
}
```

## ✅ Best Practices

### DO ✓
- Use design tokens (CSS variables) consistently
- Maintain visual hierarchy with spacing
- Keep hover states subtle (1px translate, light shadow)
- Use neutral colors for most UI elements
- Apply primary color sparingly for emphasis
- Ensure sufficient color contrast (WCAG AA minimum)

### DON'T ✗
- Mix spacing values arbitrarily
- Use heavy shadows or gradients
- Overuse animations
- Use too many colors
- Create custom values outside the system
- Ignore responsive design

## 🔄 Common Patterns

### Hover States
```css
.element:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  border-color: var(--neutral-400);
}
```

### Focus States
```css
.element:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Disabled States
```css
.element:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

**Quick Tip**: When in doubt, use neutral colors and minimal styling. The clean design prioritizes content over decoration.
