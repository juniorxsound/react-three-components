import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import ReactThreeTestRenderer, { act } from "@react-three/test-renderer";
import { LinearCarousel } from "./LinearCarousel";
import type { LinearCarouselRef } from "./types";

function CarouselItem({ color }: { color: string }) {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

describe("LinearCarousel", () => {
  it("renders N children as N groups in the scene", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LinearCarousel dragEnabled={false}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
      </LinearCarousel>
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
    const ref = createRef<LinearCarouselRef>();
    await ReactThreeTestRenderer.create(
      <LinearCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
      </LinearCarousel>
    );
    expect(ref.current).toBeDefined();
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("ref.prev() goes to previous index and calls onIndexChange", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<LinearCarouselRef>();
    await ReactThreeTestRenderer.create(
      <LinearCarousel
        ref={ref}
        defaultIndex={2}
        onIndexChange={onIndexChange}
      >
        <CarouselItem color="red" />
        <CarouselItem color="blue" />
        <CarouselItem color="green" />
      </LinearCarousel>
    );
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("ref.goTo(index) sets index and calls onIndexChange", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<LinearCarouselRef>();
    await ReactThreeTestRenderer.create(
      <LinearCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
      </LinearCarousel>
    );
    await act(async () => ref.current!.goTo(2));
    expect(onIndexChange).toHaveBeenCalledWith(2);
    await act(async () => ref.current!.goTo(0));
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("ref.goTo clamps index to valid range", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<LinearCarouselRef>();
    await ReactThreeTestRenderer.create(
      <LinearCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
      </LinearCarousel>
    );
    await act(async () => ref.current!.goTo(10));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await act(async () => ref.current!.goTo(-1));
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("renders when dragEnabled is true", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LinearCarousel dragEnabled={true}>
        <CarouselItem color="red" />
      </LinearCarousel>
    );
    const root = renderer.scene.children[0];
    expect(root).toBeDefined();
    expect(root.children.length).toBe(1);
  });

  it("renders when dragEnabled is false", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LinearCarousel dragEnabled={false}>
        <CarouselItem color="red" />
      </LinearCarousel>
    );
    const root = renderer.scene.children[0];
    expect(root).toBeDefined();
    expect(root.children.length).toBe(1);
  });

  it("NextTrigger and PrevTrigger work when used inside LinearCarousel", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<LinearCarouselRef>();
    const renderer = await ReactThreeTestRenderer.create(
      <LinearCarousel ref={ref} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
        <LinearCarousel.PrevTrigger>
          <mesh />
        </LinearCarousel.PrevTrigger>
        <LinearCarousel.NextTrigger>
          <mesh />
        </LinearCarousel.NextTrigger>
      </LinearCarousel>
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

  // Key difference from CircularCarousel: bounded navigation (no wrapping)
  it("next() at last index stays at last (no wrap)", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<LinearCarouselRef>();
    await ReactThreeTestRenderer.create(
      <LinearCarousel ref={ref} defaultIndex={5} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
        <CarouselItem color="yellow" />
        <CarouselItem color="purple" />
        <CarouselItem color="cyan" />
      </LinearCarousel>
    );
    await act(async () => ref.current!.next());
    // Should NOT call onIndexChange because we're already at the last index
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("prev() at first index stays at first (no wrap)", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<LinearCarouselRef>();
    await ReactThreeTestRenderer.create(
      <LinearCarousel ref={ref} defaultIndex={0} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
        <CarouselItem color="yellow" />
        <CarouselItem color="purple" />
        <CarouselItem color="cyan" />
      </LinearCarousel>
    );
    await act(async () => ref.current!.prev());
    // Should NOT call onIndexChange because we're already at the first index
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("bounded navigation works correctly across multiple operations", async () => {
    const onIndexChange = vi.fn();
    const ref = createRef<LinearCarouselRef>();
    await ReactThreeTestRenderer.create(
      <LinearCarousel ref={ref} defaultIndex={0} onIndexChange={onIndexChange}>
        <CarouselItem color="red" />
        <CarouselItem color="green" />
        <CarouselItem color="blue" />
      </LinearCarousel>
    );
    // Go forward: 0 -> 1
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    // Go forward: 1 -> 2
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    // Try to go forward at end: stays at 2
    await act(async () => ref.current!.next());
    expect(onIndexChange).toHaveBeenCalledTimes(2); // No additional call
    // Go backward: 2 -> 1
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    // Go backward: 1 -> 0
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    // Try to go backward at start: stays at 0
    await act(async () => ref.current!.prev());
    expect(onIndexChange).toHaveBeenCalledTimes(4); // No additional call
  });
});
