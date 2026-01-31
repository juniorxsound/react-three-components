# AGENTS.md

## Project Overview

A React component library for 3D components built with React Three Fiber. Provides reusable, gesture-enabled carousel components (`CircularCarousel`, `LinearCarousel`) for Three.js scenes.

## Tech Stack

- **React 18+** with React Compiler enabled
- **TypeScript** (strict mode)
- **Three.js** + **@react-three/fiber** for 3D rendering
- **@react-spring/web** for animations
- **@use-gesture/react** for drag gestures
- **Vite** for building (ES module library output)
- **Storybook** for component development/docs
- **Vitest** + **@react-three/test-renderer** for testing

## Project Structure

```
src/
├── index.ts                    # Public exports
├── types.ts                    # Shared types
└── components/
    ├── index.ts                # Component barrel export
    ├── CircularCarousel/       # Circular carousel (rotates around axis)
    │   ├── index.ts            # Component exports
    │   ├── CircularCarousel.tsx
    │   ├── CircularCarouselTriggers.tsx
    │   ├── context.ts          # React context for state
    │   ├── types.ts            # Props/ref types
    │   ├── constants.ts        # Default values
    │   ├── utils.ts            # Helper functions
    │   ├── CircularCarousel.test.tsx
    │   └── CircularCarousel.stories.tsx
    └── LinearCarousel/         # Linear carousel (slides in direction)
        └── (same structure)
```

## Development Commands

```bash
nvm use              # Switch to Node 24 (uses .nvmrc)
npm run dev          # Start Storybook dev server (port 6006)
npm run build        # Build library (tsc + vite + declarations)
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run lint         # Run ESLint
```

## Component Pattern

Each component follows this structure:

### 1. Types (`types.ts`)

```typescript
export type ComponentProps = {
  children: ReactNode;
  // ... props with JSDoc comments
};

export type ComponentRef = {
  next(): void;
  prev(): void;
  goTo(index: number): void;
};

export type ContextValue = {
  activeIndex: number;
  count: number;
  // ... navigation methods
};
```

### 2. Context (`context.ts`)

```typescript
import { createContext, useContext } from "react";
import type { ContextValue } from "./types";

export const ComponentContext = createContext<ContextValue | null>(null);

export function useComponentContext() {
  const ctx = useContext(ComponentContext);
  if (!ctx) throw new Error("Must be used within Component");
  return ctx;
}
```

### 3. Main Component (`Component.tsx`)

- Use `forwardRef` with `useImperativeHandle` for ref API
- Support both controlled (`index`) and uncontrolled (`defaultIndex`) modes
- Use `useSpring` for animations, `useDrag` for gestures
- Filter children to separate items from trigger components
- Provide context to children

### 4. Triggers (`ComponentTriggers.tsx`)

```typescript
export function ComponentNextTrigger({ children, ...props }: GroupProps) {
  const { next } = useComponentContext();
  return (
    <group onClick={next} {...props}>
      {children}
    </group>
  );
}
```

### 5. Compound Component Pattern

```typescript
(ComponentBase as ComponentType).NextTrigger = ComponentNextTrigger;
(ComponentBase as ComponentType).PrevTrigger = ComponentPrevTrigger;
export const Component = ComponentBase as ComponentType;
```

## Code Style

- **Strict TypeScript**: No `any`, explicit return types for exports
- **Named exports** only (no default exports except Storybook meta)
- **Type imports**: Use `import type { ... }` for types
- **Props**: Destructure with defaults in function signature
- **Hooks**: Memoize with `useCallback`/`useMemo` appropriately
- **ESLint**: React Hooks rules + React Refresh rules enabled

## Testing

Use `@react-three/test-renderer` for component tests:

```typescript
import ReactThreeTestRenderer, { act } from "@react-three/test-renderer";
import { describe, it, expect, vi } from "vitest";

describe("Component", () => {
  it("renders children", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <Component>{/* children */}</Component>
    );
    const scene = renderer.scene;
    // assertions
  });

  it("handles navigation", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<ComponentRef>();
    await ReactThreeTestRenderer.create(
      <Component ref={ref} onIndexChange={onIndexChange}>
        {/* children */}
      </Component>
    );
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });
});
```

## Storybook

Stories use Storybook 8 with `@storybook/react-vite`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Component> = {
  component: Component,
  title: "Components/ComponentName",
  argTypes: {
    // control definitions
  },
};

export default meta;
type Story = StoryObj<typeof Component>;

export const Basic: Story = {
  render: (args) => <Component {...args}>{/* ... */}</Component>,
};
```

## Adding a New Component

1. Create folder: `src/components/NewComponent/`
2. Add files following the pattern above
3. Export from `src/components/index.ts`
4. Export from `src/index.ts`
5. Write tests and stories
6. Run `npm run lint` and `npm run test:run`

## CI/CD

### Continuous Integration

Every push/PR runs (`.github/workflows/ci.yml`):
- Lint (`npm run lint`)
- Test (`npm run test:run`)
- Build (`npm run build`)

### Publishing to npm

Uses **npm trusted publishers** (OIDC) - no tokens needed. Configured in `.github/workflows/publish.yml`.

**Requirements:**
- Node 24+ (npm 11.5.1+ required for trusted publishers)
- Trusted publisher configured on npmjs.com

**Release workflow:**
```bash
# Bump version, run checks, push tag
npm run release:patch   # 0.1.0 → 0.1.1
npm run release:minor   # 0.1.0 → 0.2.0
npm run release:major   # 0.1.0 → 1.0.0

# Then create GitHub Release from the tag
# → Triggers automatic npm publish with provenance
```

**Release scripts run:** lint → test → build → version bump → git push + tags

### Trusted Publisher Setup (one-time)

1. First publish manually: `npm login && npm publish --access public`
2. Configure on npmjs.com → Package Settings → Trusted Publishers:
   - Owner: `juniorxsound`
   - Repository: `react-three-components`
   - Workflow: `publish.yml`

## Peer Dependencies

Consumers must provide:

- `react` >= 18
- `react-dom` >= 18
- `three` >= 0.150.0
- `@react-three/fiber` >= 8
- `@react-spring/web` >= 9
- `@use-gesture/react` >= 10
