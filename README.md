# react-three-components

[![npm version](https://img.shields.io/npm/v/react-three-components.svg)](https://www.npmjs.com/package/react-three-components)
[![CI](https://github.com/juniorxsound/react-three-components/actions/workflows/ci.yml/badge.svg)](https://github.com/juniorxsound/react-three-components/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-three-components.svg)](https://github.com/juniorxsound/react-three-components/blob/main/LICENSE)

3D carousel components for React Three Fiber with gesture support.

## Installation

```bash
npm install react-three-components
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install react react-dom three @react-three/fiber @react-spring/web @use-gesture/react
```

## Components

### CircularCarousel

A 3D carousel that arranges items in a circle and rotates around an axis.

```tsx
import { Canvas } from "@react-three/fiber";
import { CircularCarousel, useCarouselContext } from "react-three-components";

function Item({ index }: { index: number }) {
  const { activeIndex } = useCarouselContext();
  const isActive = index === activeIndex;
  
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={isActive ? "hotpink" : "gray"} />
    </mesh>
  );
}

function App() {
  return (
    <Canvas>
      <CircularCarousel radius={3} onIndexChange={(i) => console.log(i)}>
        <Item index={0} />
        <Item index={1} />
        <Item index={2} />
        <Item index={3} />
      </CircularCarousel>
    </Canvas>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Carousel items |
| `radius` | `number` | `3` | Distance from center to items |
| `axis` | `"x" \| "y" \| "z"` | `"y"` | Rotation axis |
| `index` | `number` | - | Controlled active index |
| `defaultIndex` | `number` | `0` | Initial index (uncontrolled) |
| `onIndexChange` | `(index: number) => void` | - | Called when index changes |
| `dragEnabled` | `boolean` | `true` | Enable drag gestures |
| `dragSensitivity` | `number` | auto | Drag sensitivity |
| `dragAxis` | `"x" \| "y"` | `"x"` | Drag gesture axis |
| `dragConfig` | `DragConfig` | - | Additional drag options |

#### Ref Methods

```tsx
const ref = useRef<CircularCarouselRef>(null);

ref.current.next();      // Go to next item
ref.current.prev();      // Go to previous item
ref.current.goTo(2);     // Go to specific index
```

#### With Navigation Triggers

```tsx
<CircularCarousel>
  <Item index={0} />
  <Item index={1} />
  <Item index={2} />
  
  <CircularCarousel.PrevTrigger position={[-2, 0, 0]}>
    <mesh><boxGeometry /><meshBasicMaterial color="blue" /></mesh>
  </CircularCarousel.PrevTrigger>
  
  <CircularCarousel.NextTrigger position={[2, 0, 0]}>
    <mesh><boxGeometry /><meshBasicMaterial color="red" /></mesh>
  </CircularCarousel.NextTrigger>
</CircularCarousel>
```

---

### LinearCarousel

A carousel that slides items linearly (horizontally or vertically).

```tsx
import { Canvas } from "@react-three/fiber";
import { LinearCarousel, useLinearCarouselContext } from "react-three-components";

function Item({ index }: { index: number }) {
  const { activeIndex } = useLinearCarouselContext();
  const isActive = index === activeIndex;
  
  return (
    <mesh scale={isActive ? 1.2 : 1}>
      <planeGeometry args={[2, 1.5]} />
      <meshBasicMaterial color={isActive ? "hotpink" : "gray"} />
    </mesh>
  );
}

function App() {
  return (
    <Canvas>
      <LinearCarousel gap={0.5} direction="horizontal">
        <Item index={0} />
        <Item index={1} />
        <Item index={2} />
        <Item index={3} />
      </LinearCarousel>
    </Canvas>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Carousel items |
| `gap` | `number` | `0.2` | Space between items |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Slide direction |
| `index` | `number` | - | Controlled active index |
| `defaultIndex` | `number` | `0` | Initial index (uncontrolled) |
| `onIndexChange` | `(index: number) => void` | - | Called when index changes |
| `dragEnabled` | `boolean` | `true` | Enable drag gestures |
| `dragSensitivity` | `number` | `150` | Drag sensitivity |
| `dragAxis` | `"x" \| "y"` | auto | Drag axis (derived from direction) |
| `dragConfig` | `DragConfig` | - | Additional drag options |

#### Ref Methods

```tsx
const ref = useRef<LinearCarouselRef>(null);

ref.current.next();      // Go to next item (bounded)
ref.current.prev();      // Go to previous item (bounded)
ref.current.goTo(2);     // Go to specific index
```

> Note: LinearCarousel is bounded (doesn't wrap around), unlike CircularCarousel which loops infinitely.

#### With Navigation Triggers

```tsx
<LinearCarousel>
  <Item index={0} />
  <Item index={1} />
  <Item index={2} />
  
  <LinearCarousel.PrevTrigger position={[-3, 0, 0]}>
    <PrevButton />
  </LinearCarousel.PrevTrigger>
  
  <LinearCarousel.NextTrigger position={[3, 0, 0]}>
    <NextButton />
  </LinearCarousel.NextTrigger>
</LinearCarousel>
```

---

## Context Hooks

Access carousel state from any child component:

```tsx
// For CircularCarousel
import { useCarouselContext } from "react-three-components";

const { activeIndex, count, next, prev, goTo } = useCarouselContext();

// For LinearCarousel
import { useLinearCarouselContext } from "react-three-components";

const { activeIndex, count, next, prev, goTo } = useLinearCarouselContext();
```

## DragConfig

Fine-tune drag behavior:

```tsx
<CircularCarousel
  dragConfig={{
    axis: "x",                    // Constrain to axis
    threshold: 10,                // Pixels before drag starts
    rubberband: 0.2,              // Elastic effect at bounds
    touchAction: "pan-y",         // CSS touch-action
    pointer: { touch: true },     // Pointer options
  }}
>
```

## Contributing

### Development

```bash
nvm use              # Switch to Node 24 (uses .nvmrc)
npm install          # Install dependencies
npm run dev          # Start Storybook dev server
npm run test         # Run tests in watch mode
npm run lint         # Run ESLint
npm run build        # Build the library
```

### Releasing

This package uses [npm trusted publishers](https://docs.npmjs.com/trusted-publishers) for secure, token-free publishing.

```bash
npm run release:patch   # 0.1.0 → 0.1.1
npm run release:minor   # 0.1.0 → 0.2.0
npm run release:major   # 0.1.0 → 1.0.0
```

Then create a GitHub Release from the tag - this triggers automatic npm publish with provenance.

## License

MIT
