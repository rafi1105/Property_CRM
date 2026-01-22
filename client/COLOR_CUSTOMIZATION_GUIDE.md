# 🎨 Sintec  Real Estate - Color Customization Guide

## Quick Color Customization

All colors in this project are defined as CSS custom properties (variables) in `src/index.css`. This makes it incredibly easy to customize the entire color scheme of your application.

## 📍 Location of Color Variables

Open `src/index.css` and find the `:root` selector at the top of the file. All color variables are defined there.

## 🎨 Primary Colors

### How to Change Primary Blue Color

```css
:root {
  --color-primary: #2563eb;        /* Main brand color - Change this! */
  --color-primary-dark: #1e40af;   /* Darker shade for hover states */
  --color-primary-light: #3b82f6;  /* Lighter shade */
  --color-primary-lighter: #60a5fa; /* Even lighter */
}
```

**Example:** To change to a purple theme:
```css
:root {
  --color-primary: #7c3aed;        /* Purple */
  --color-primary-dark: #5b21b6;   /* Dark Purple */
  --color-primary-light: #8b5cf6;  /* Light Purple */
  --color-primary-lighter: #a78bfa; /* Lighter Purple */
}
```

## 🟢 Secondary Colors

### How to Change Secondary Green Color

```css
:root {
  --color-secondary: #10b981;      /* Secondary brand color */
  --color-secondary-dark: #059669; /* Darker shade */
  --color-secondary-light: #34d399; /* Lighter shade */
}
```

**Example:** To change to an orange theme:
```css
:root {
  --color-secondary: #f97316;      /* Orange */
  --color-secondary-dark: #ea580c; /* Dark Orange */
  --color-secondary-light: #fb923c; /* Light Orange */
}
```

## ⭐ Accent Colors

Used for special highlights and attention-grabbing elements:

```css
:root {
  --color-accent: #f59e0b;         /* Accent color (Amber) */
  --color-accent-dark: #d97706;    /* Darker accent */
  --color-accent-light: #fbbf24;   /* Lighter accent */
}
```

## 🏷️ Status Colors

Used for property status badges:

```css
:root {
  --color-premium: #eab308;        /* Premium properties (Yellow) */
  --color-sold: #ef4444;           /* Sold properties (Red) */
  --color-sale: #10b981;           /* For sale properties (Green) */
}
```

## 🎯 Quick Theme Examples

### Example 1: Modern Dark Blue & Teal

```css
:root {
  --color-primary: #0891b2;
  --color-primary-dark: #0e7490;
  --color-primary-light: #06b6d4;
  --color-primary-lighter: #22d3ee;
  
  --color-secondary: #14b8a6;
  --color-secondary-dark: #0f766e;
  --color-secondary-light: #2dd4bf;
}
```

### Example 2: Elegant Purple & Pink

```css
:root {
  --color-primary: #9333ea;
  --color-primary-dark: #7e22ce;
  --color-primary-light: #a855f7;
  --color-primary-lighter: #c084fc;
  
  --color-secondary: #ec4899;
  --color-secondary-dark: #db2777;
  --color-secondary-light: #f472b6;
}
```

### Example 3: Professional Navy & Gold

```css
:root {
  --color-primary: #1e40af;
  --color-primary-dark: #1e3a8a;
  --color-primary-light: #3b82f6;
  --color-primary-lighter: #60a5fa;
  
  --color-secondary: #f59e0b;
  --color-secondary-dark: #d97706;
  --color-secondary-light: #fbbf24;
}
```

### Example 4: Fresh Green & Lime

```css
:root {
  --color-primary: #16a34a;
  --color-primary-dark: #15803d;
  --color-primary-light: #22c55e;
  --color-primary-lighter: #4ade80;
  
  --color-secondary: #84cc16;
  --color-secondary-dark: #65a30d;
  --color-secondary-light: #a3e635;
}
```

## 🔧 Advanced Customization

### Spacing

Adjust spacing throughout the application:

```css
:root {
  --spacing-xs: 0.5rem;   /* 8px */
  --spacing-sm: 1rem;     /* 16px */
  --spacing-md: 1.5rem;   /* 24px */
  --spacing-lg: 2rem;     /* 32px */
  --spacing-xl: 3rem;     /* 48px */
  --spacing-2xl: 4rem;    /* 64px */
}
```

### Border Radius

Control the roundness of corners:

```css
:root {
  --radius-sm: 0.375rem;  /* Small corners */
  --radius-md: 0.5rem;    /* Medium corners */
  --radius-lg: 0.75rem;   /* Large corners */
  --radius-xl: 1rem;      /* Extra large corners */
  --radius-full: 9999px;  /* Fully rounded (pills) */
}
```

### Transition Speed

Adjust animation speeds:

```css
:root {
  --transition-fast: 150ms ease-in-out;   /* Quick animations */
  --transition-base: 300ms ease-in-out;   /* Standard animations */
  --transition-slow: 500ms ease-in-out;   /* Slow animations */
}
```

## 📱 Responsive Design

The application uses a mobile-first approach with these breakpoints:

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 768px (md)
- **Laptop**: 768px - 1024px (lg)
- **Desktop**: 1024px+ (xl)

All components automatically adapt to these screen sizes!

## 🎨 Where Colors Are Used

### Primary Color is used for:
- Navbar active links
- Buttons (Browse Properties, Contact, etc.)
- Property badges (Premium status)
- Links and interactive elements
- Focus states
- Icon colors

### Secondary Color is used for:
- Success messages
- "For Sale" property badges
- Secondary buttons
- Accent elements in gradients
- Icons in features sections

### Status Colors are used for:
- **Premium** (Yellow): Premium property badges
- **Sold** (Red): Sold property badges
- **Sale** (Green): For sale property badges

## 💡 Tips

1. **Test Your Colors**: After changing colors, test on both light and dark backgrounds
2. **Contrast**: Ensure good contrast between text and backgrounds (especially for accessibility)
3. **Consistency**: Stick to your color palette for a professional look
4. **Save Changes**: Remember to save `src/index.css` after making changes
5. **Hot Reload**: The dev server will automatically reflect your changes!

## 🔄 How to Reset to Default

If you want to revert back to the original colors, use these values:

```css
:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1e40af;
  --color-primary-light: #3b82f6;
  --color-primary-lighter: #60a5fa;
  
  --color-secondary: #10b981;
  --color-secondary-dark: #059669;
  --color-secondary-light: #34d399;
  
  --color-accent: #f59e0b;
  --color-accent-dark: #d97706;
  --color-accent-light: #fbbf24;
  
  --color-premium: #eab308;
  --color-sold: #ef4444;
  --color-sale: #10b981;
}
```

## 🚀 Need Help?

Visit these resources for color inspiration:
- [Coolors.co](https://coolors.co/) - Color scheme generator
- [Adobe Color](https://color.adobe.com/) - Color wheel tool
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors) - Pre-made color palettes

---

**Happy Customizing! 🎨**
