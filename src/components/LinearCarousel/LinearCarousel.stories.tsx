import type React from "react";
import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Html, Image } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group } from "three";
import { LinearCarousel } from "./LinearCarousel";
import { useLinearCarouselContext } from "./context";
import { FloatingShape } from "../StorybookUtils";

type StoryProps = React.ComponentProps<typeof LinearCarousel> & {
  itemCount: number;
};

const meta: Meta<StoryProps> = {
  component: LinearCarousel,
  title: "Components/LinearCarousel",
  argTypes: {
    gap: { control: { type: "number", min: 0, max: 2, step: 0.1 } },
    direction: { control: "select", options: ["horizontal", "vertical"] },
    index: { control: { type: "number", min: 0 } },
    defaultIndex: { control: { type: "number", min: 0 } },
    dragEnabled: { control: "boolean" },
    dragSensitivity: { control: { type: "number", min: 50, max: 500 } },
    itemCount: { control: { type: "number", min: 1, max: 20 } },
    infinite: { control: "boolean" },
  },
  args: {
    itemCount: 6,
    gap: 2.7,
  },
};

export default meta;

type Story = StoryObj<StoryProps>;

function Item({ index }: { index: number }) {
  const ref = useRef<Group>(null);
  const { activeIndex } = useLinearCarouselContext();
  const active = index === activeIndex;
  const targetScale = active ? 1.5 : 1;

  useFrame(() => {
    if (!ref.current) return;
    const s = MathUtils.lerp(ref.current.scale.x, targetScale, 0.1);
    ref.current.scale.setScalar(s);
    ref.current.position.z = active ? 0.01 : 0;
  });

  return (
    <group ref={ref}>
      <Image
        url={`https://picsum.photos/seed/${index}/400/300`}
        scale={[3.6, 2.8]}
      />
    </group>
  );
}

function PrevArrow() {
  const { prev } = useLinearCarouselContext();
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
  const { next } = useLinearCarouselContext();
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
    <LinearCarousel {...args}>
      {Array.from({ length: itemCount ?? 6 }, (_, i) => (
        <Item key={i} index={i} />
      ))}
    </LinearCarousel>
  ),
};

export const WithTriggers: Story = {
  render: ({ itemCount, ...args }) => (
    <LinearCarousel {...args}>
      {Array.from({ length: itemCount ?? 6 }, (_, i) => (
        <Item key={i} index={i} />
      ))}
      <LinearCarousel.PrevTrigger position={[-2.5, -3, 0]}>
        <PrevArrow />
      </LinearCarousel.PrevTrigger>
      <LinearCarousel.NextTrigger position={[2.5, -3, 0]}>
        <NextArrow />
      </LinearCarousel.NextTrigger>
    </LinearCarousel>
  ),
};

export const Vertical: Story = {
  args: {
    direction: "vertical",
  },
  render: ({ itemCount, ...args }) => (
    <LinearCarousel {...args}>
      {Array.from({ length: itemCount ?? 6 }, (_, i) => (
        <Item key={i} index={i} />
      ))}
    </LinearCarousel>
  ),
};

function LinearFloatingShape({
  type,
  index,
}: {
  type: "box" | "sphere" | "cone" | "plane";
  index: number;
}): React.ReactNode {
  const { activeIndex } = useLinearCarouselContext();
  return <FloatingShape type={type} isActive={activeIndex === index} />;
}

export const FloatingObjects: Story = {
  args: {
    gap: 3,
    infinite: true,
  },
  render: ({ itemCount: _itemCount, ...args }) => (
    <LinearCarousel {...args}>
      <LinearFloatingShape type="box" index={0} />
      <LinearFloatingShape type="sphere" index={1} />
      <LinearFloatingShape type="cone" index={2} />
      <LinearFloatingShape type="plane" index={3} />

      {/* Navigation triggers */}
      <LinearCarousel.PrevTrigger position={[-2.5, -3, 0]}>
        <PrevArrow />
      </LinearCarousel.PrevTrigger>
      <LinearCarousel.NextTrigger position={[2.5, -3, 0]}>
        <NextArrow />
      </LinearCarousel.NextTrigger>
    </LinearCarousel>
  ),
};

export const Infinite: Story = {
  args: {
    infinite: true,
  },
  render: ({ itemCount, ...args }) => (
    <LinearCarousel {...args}>
      {Array.from({ length: itemCount ?? 6 }, (_, i) => (
        <Item key={i} index={i} />
      ))}
      <LinearCarousel.PrevTrigger position={[-2.5, -3, 0]}>
        <PrevArrow />
      </LinearCarousel.PrevTrigger>
      <LinearCarousel.NextTrigger position={[2.5, -3, 0]}>
        <NextArrow />
      </LinearCarousel.NextTrigger>
    </LinearCarousel>
  ),
};
