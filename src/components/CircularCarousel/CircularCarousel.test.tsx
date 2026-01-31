import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import ReactThreeTestRenderer, { act } from "@react-three/test-renderer";
import { CircularCarousel } from "./CircularCarousel";
import type { CircularCarouselRef } from "./types";

function CarouselItem({ color }: { color: string }) {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

describe("CircularCarousel", () => {
  it("renders N children as N groups in the scene", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <CircularCarousel dragEnabled={false}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
      </CircularCarousel>
    );
    const scene = renderer.scene;
    const groups = scene.findAllByType("Group");
    expect(groups.length).toBeGreaterThanOrEqual(3);
    const root = scene.children[0];
    expect(root).toBeDefined();
    expect(root.children.length).toBe(3);
  });

  it("ref.next() advances index and calls onIndexChange", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    await ReactThreeTestRenderer.create(
      <CircularCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
      </CircularCarousel>
    );
    expect(ref.current).toBeDefined();
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledWith(2);
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("ref.prev() goes to previous index and calls onIndexChange", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    await ReactThreeTestRenderer.create(
      <CircularCarousel
        ref={ref}
        defaultIndex={2}
        onIndexChange={onIndexChange}
      >
        <CarouselItem color="red" />
        <CarouselItem color="blue" />
        <CarouselItem color="green" />
      </CircularCarousel>
    );
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenCalledWith(0);
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("ref.goTo(index) sets index and calls onIndexChange", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    await ReactThreeTestRenderer.create(
      <CircularCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
      </CircularCarousel>
    );
    await act(async () => ref.current!.goTo(2));
    expect(onIndexChange).toHaveBeenCalledWith(2);
    await act(async () => ref.current!.goTo(0));
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("ref.goTo clamps index to valid range", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    await ReactThreeTestRenderer.create(
      <CircularCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
      </CircularCarousel>
    );
    await act(async () => ref.current!.goTo(10));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await act(async () => ref.current!.goTo(-1));
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("renders when dragEnabled is true", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <CircularCarousel dragEnabled={true}>
        <CarouselItem color="red" />
      </CircularCarousel>
    );
    const root = renderer.scene.children[0];
    expect(root).toBeDefined();
    expect(root.children.length).toBe(1);
  });

  it("renders when dragEnabled is false", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <CircularCarousel dragEnabled={false}>
        <CarouselItem color="red" />
      </CircularCarousel>
    );
    const root = renderer.scene.children[0];
    expect(root).toBeDefined();
    expect(root.children.length).toBe(1);
  });

  it("NextTrigger and PrevTrigger work when used inside CircularCarousel", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    const renderer = await ReactThreeTestRenderer.create(
      <CircularCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
        <CircularCarousel.PrevTrigger>
          <mesh />
        </CircularCarousel.PrevTrigger>
        <CircularCarousel.NextTrigger>
          <mesh />
        </CircularCarousel.NextTrigger>
      </CircularCarousel>
    );
    const root = renderer.scene.children[0];
    expect(root.children.length).toBeGreaterThanOrEqual(3);

    const groupsWithClick = renderer.scene
      .findAllByType("Group")
      .filter((g: { props?: { onClick?: unknown } }) => g.props?.onClick != null);
    expect(groupsWithClick.length).toBeGreaterThanOrEqual(2);
    await renderer.fireEvent(groupsWithClick[1], "click", {});
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("next() from last index wraps to first (boundary transition)", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    await ReactThreeTestRenderer.create(
      <CircularCarousel ref={ref} defaultIndex={5} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
        <CarouselItem color="yellow" />
        <CarouselItem color="purple" />
        <CarouselItem color="cyan" />
      </CircularCarousel>
    );
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("prev() from first index wraps to last (boundary transition)", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    await ReactThreeTestRenderer.create(
      <CircularCarousel ref={ref} defaultIndex={0} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
        <CarouselItem color="yellow" />
        <CarouselItem color="purple" />
        <CarouselItem color="cyan" />
      </CircularCarousel>
    );
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenCalledWith(5);
  });

  it("multiple boundary transitions work correctly", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<CircularCarouselRef>();
    await ReactThreeTestRenderer.create(
      <CircularCarousel ref={ref} defaultIndex={0} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
        <CarouselItem color="yellow" />
        <CarouselItem color="purple" />
        <CarouselItem color="cyan" />
      </CircularCarousel>
    );
    // Go backwards across boundary: 0 -> 5
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenLastCalledWith(5);
    // Go forwards across boundary: 5 -> 0
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    // Go backwards again: 0 -> 5
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenLastCalledWith(5);
    // Go backwards: 5 -> 4
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenLastCalledWith(4);
  });
});
