# UI Library Documentation

## Overview

The `uiLibrary` folder contains enhanced shadcn/ui components customized for the StyleAI project. These components provide a consistent design system while extending base shadcn functionality.

## Structure

```
src/uiLibrary/
├── index.js                     # Main export file
└── components/
    ├── button.jsx               # Enhanced Button with loading state
    ├── loading-spinner.jsx      # Custom loading spinner
    ├── product-card.jsx         # Product display card
    └── search-input.jsx         # Enhanced search input with AI features
```

## Components

### Button (`button.jsx`)

Enhanced version of shadcn Button with loading state support.

**Features:**

- All standard shadcn button variants and sizes
- Loading state with spinner
- Automatic disable during loading

**Usage:**

```jsx
import { Button } from "@/uiLibrary";

<Button loading={isLoading} onClick={handleClick}>
  Save Changes
</Button>;
```

### LoadingSpinner (`loading-spinner.jsx`)

Consistent loading spinner component.

**Features:**

- Customizable size and color via className
- Accessibility features (screen reader text)
- CSS animation based

**Usage:**

```jsx
import { LoadingSpinner } from "@/uiLibrary";

<LoadingSpinner className="h-8 w-8 border-blue-600" />;
```

### ProductCard (`product-card.jsx`)

Specialized card component for displaying products.

**Features:**

- Built on shadcn Card components
- Image display with Next.js Image optimization
- Badge system (New, Best Seller, Sale)
- Hover effects and animations
- Optional linking functionality
- Price display with sale pricing support

**Usage:**

```jsx
import { ProductCard } from "@/uiLibrary";

<ProductCard product={product} linkHref={`/catalog/${product.id}`} className="h-full" />;
```

### SearchInput (`search-input.jsx`)

Enhanced input component for search functionality.

**Features:**

- Built on shadcn Input
- Search and clear buttons
- Loading state support
- Enter key handling
- Icon integration (Lucide React)

**Usage:**

```jsx
import { SearchInput } from "@/uiLibrary";

<SearchInput
  value={query}
  onChange={setQuery}
  onSearch={handleSearch}
  onClear={handleClear}
  loading={isSearching}
  placeholder="Search products..."
/>;
```

## Re-exported Components

The following shadcn components are re-exported for convenience:

- `Badge` - For status indicators
- `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle` - Card primitives
- `Input` - Base input component

## Utilities

- `cn` - Class name utility function from shadcn

## Design Principles

1. **Consistency**: All components follow the same design patterns and use the shadcn design tokens
2. **Extensibility**: Components are built to be easily extended and customized
3. **Accessibility**: All components maintain accessibility standards
4. **Performance**: Components are optimized for performance with proper prop handling
5. **Type Safety**: Components are built with TypeScript best practices

## Integration

Components in this library are integrated throughout the application:

- **FeaturedProducts**: Uses `ProductCard` and `Button`
- **Navbar**: Uses enhanced `Button` components
- **SearchInput**: Uses enhanced `SearchInput` component
- **Grid/GridItem**: Uses `ProductCard` for product display
- **Main pages**: Use `LoadingSpinner` and `Button` for loading states

## Customization

To customize components:

1. Modify the component files in `src/uiLibrary/components/`
2. Update the main export in `src/uiLibrary/index.js`
3. Maintain consistency with shadcn design tokens
4. Test across all usage points in the application

## Dependencies

- `@radix-ui/react-slot` - For composition patterns
- `class-variance-authority` - For component variants
- `clsx` & `tailwind-merge` - For class name handling
- `lucide-react` - For icons
- `next/image` & `next/link` - For Next.js optimization
