import type React from "react";
import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Html, Image } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, MathUtils, type Group } from "three";
import { CircularCarousel } from "./CircularCarousel";
import { useCarouselContext } from "./context";

type StoryProps = React.ComponentProps<typeof CircularCarousel> & {
  itemCount: number;
};

const meta: Meta<StoryProps> = {
  component: CircularCarousel,
  title: "Components/CircularCarousel",
  argTypes: {
    radius: { control: { type: "number", min: 1, max: 10, step: 0.5 } },
    axis: { control: "select", options: ["x", "y", "z"] },
    index: { control: { type: "number", min: 0 } },
    defaultIndex: { control: { type: "number", min: 0 } },
    dragEnabled: { control: "boolean" },
    dragSensitivity: { control: { type: "number", min: 10, max: 500 } },
    itemCount: { control: { type: "number", min: 1, max: 20 } },
  },
  args: {
    itemCount: 6,
  },
};

export default meta;

type Story = StoryObj<StoryProps>;

function Item({ index }: { index: number }) {
  const ref = useRef<Group>(null);
  const { activeIndex } = useCarouselContext();
  const active = index === activeIndex;
  const targetScale = active ? 1.2 : 1;

  useFrame(() => {
    if (!ref.current) return;
    const s = MathUtils.lerp(ref.current.scale.x, targetScale, 0.1);
    ref.current.scale.setScalar(s);
  });

  return (
    <group ref={ref}>
      <Image
        url={`https://picsum.photos/seed/${index}/400/300`}
        scale={[1.6, 1.2]}
        transparent
        side={DoubleSide}
        opacity={active ? 1 : 0.6}
      />
    </group>
  );
}

function PrevArrow() {
  const { prev } = useCarouselContext();
  return (
    <Html center>
      <span
        onClick={prev}
        style={{ fontSize: 32, cursor: "pointer", userSelect: "none" }}
      >
        ←
      </span>
    </Html>
  );
}

function NextArrow() {
  const { next } = useCarouselContext();
  return (
    <Html center>
      <span
        onClick={next}
        style={{ fontSize: 32, cursor: "pointer", userSelect: "none" }}
      >
        →
      </span>
    </Html>
  );
}

export const Basic: Story = {
  render: ({ itemCount, ...args }) => (
    <CircularCarousel {...args}>
      {Array.from({ length: itemCount ?? 6 }, (_, i) => (
        <Item key={i} index={i} />
      ))}
    </CircularCarousel>
  ),
};

export const WithTriggers: Story = {
  render: ({ itemCount, ...args }) => (
    <CircularCarousel {...args}>
      {Array.from({ length: itemCount ?? 6 }, (_, i) => (
        <Item key={i} index={i} />
      ))}
      <CircularCarousel.PrevTrigger position={[-2.5, 0, 0]}>
        <PrevArrow />
      </CircularCarousel.PrevTrigger>
      <CircularCarousel.NextTrigger position={[2.5, 0, 0]}>
        <NextArrow />
      </CircularCarousel.NextTrigger>
    </CircularCarousel>
  ),
};
