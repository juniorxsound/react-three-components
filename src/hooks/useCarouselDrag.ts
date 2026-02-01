import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useSpring, type SpringRef } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { clamp } from "../utils";

export type DragConfig = {
  /** Axis to constrain drag movement */
  axis?: "x" | "y";
  /** Pointer options for drag gesture */
  pointer?: { touch?: boolean; capture?: boolean; keys?: boolean };
  /** Touch action CSS property. Default: "none" */
  touchAction?: string;
  /** Threshold in pixels before drag starts. Default: 5 */
  threshold?: number;
  /** Rubberband effect when dragging past bounds (0-1) */
  rubberband?: boolean | number;
  /** Filter out taps (clicks) from drags. Default: true */
  filterTaps?: boolean;
};

export type SpringConfig = {
  tension: number;
  friction: number;
};

export type UseCarouselDragOptions = {
  /** Number of items in the carousel */
  count: number;
  /** Whether drag is enabled */
  dragEnabled: boolean;
  /** Axis for drag gesture ("x" or "y") */
  dragAxis: "x" | "y";
  /** Sensitivity for drag movement (pixels per unit) */
  dragSensitivity: number;
  /** Maximum drag amount per gesture (e.g., itemSpacing or anglePerItem) */
  maxDragAmount: number;
  /** Additional drag configuration */
  dragConfig?: DragConfig;
  /** Spring configuration for settling animations */
  springConfig: SpringConfig;
  /** Spring configuration for drag animations */
  dragSpringConfig: SpringConfig;
  /**
   * Calculate the nearest index from an offset value.
   * @param offset - The current offset value
   * @returns The nearest index
   */
  calculateIndexFromOffset: (offset: number) => number;
  /**
   * Calculate the final target index after drag ends.
   * @param currentOffset - The offset at drag end
   * @param startIndex - The index when drag started
   * @param dragAmount - The clamped drag amount
   * @returns The target index to navigate to
   */
  calculateTargetIndex: (
    currentOffset: number,
    startIndex: number,
    dragAmount: number
  ) => number;
  /**
   * Calculate the target offset for an index.
   * @param index - The target index
   * @param currentOffset - The current offset (useful for shortest path calculations)
   * @returns The target offset value
   */
  calculateTargetOffset: (index: number, currentOffset: number) => number;
  /**
   * Called when navigation completes with the final index.
   */
  onNavigate: (index: number) => void;
};

export type UseCarouselDragReturn = {
  /** Spring offset value */
  offset: { get: () => number };
  /** Spring API for manual control */
  springApi: SpringRef<{ offset: number }>;
  /** Ref tracking if currently dragging */
  isDraggingRef: React.MutableRefObject<boolean>;
  /** Ref tracking current offset value (updated each frame) */
  currentOffsetRef: React.MutableRefObject<number>;
};

/**
 * Shared hook for carousel drag behavior.
 * Handles spring animation, gesture recognition, and cursor management.
 */
export function useCarouselDrag(
  options: UseCarouselDragOptions
): UseCarouselDragReturn {
  const {
    count,
    dragEnabled,
    dragAxis,
    dragSensitivity,
    maxDragAmount,
    dragConfig,
    springConfig,
    dragSpringConfig,
    calculateIndexFromOffset,
    calculateTargetIndex,
    calculateTargetOffset,
    onNavigate,
  } = options;

  const { gl } = useThree();

  // Spring for smooth animations
  const [{ offset }, springApi] = useSpring(() => ({ offset: 0 }));
  const springApiRef = useRef(springApi);
  springApiRef.current = springApi;

  // Refs for tracking state
  const isDraggingRef = useRef(false);
  const currentOffsetRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragStartIndexRef = useRef(0);

  // Set up drag gesture
  useDrag(
    ({ active, movement: [mx, my], first, last }) => {
      isDraggingRef.current = active;
      const movement = dragAxis === "x" ? mx : my;

      // Capture offset and index at drag start
      if (first) {
        dragStartOffsetRef.current = currentOffsetRef.current;
        dragStartIndexRef.current = calculateIndexFromOffset(
          currentOffsetRef.current
        );
      }

      // Update cursor
      if (active && first) {
        gl.domElement.style.cursor = "grabbing";
      }
      if (!active && last) {
        gl.domElement.style.cursor = "grab";
      }

      // Calculate clamped drag amount
      const baseOffset = dragStartOffsetRef.current;
      const movementNum = Number(movement);
      let dragAmount = 0;
      if (Number.isFinite(movementNum)) {
        const raw = movementNum / dragSensitivity;
        dragAmount = clamp(raw, -maxDragAmount, maxDragAmount);
      }

      if (active) {
        // During drag: animate to drag position
        springApiRef.current.start({
          offset: baseOffset + dragAmount,
          config: dragSpringConfig,
        });
      } else {
        // Drag ended: calculate and navigate to target
        const startIndex = dragStartIndexRef.current;
        const currentOffset = baseOffset + dragAmount;

        const targetIndex = calculateTargetIndex(
          currentOffset,
          startIndex,
          dragAmount
        );

        if (count === 0 || !Number.isFinite(targetIndex)) {
          springApiRef.current.start({
            offset: baseOffset,
            config: springConfig,
          });
          return;
        }

        onNavigate(targetIndex);

        const targetOffset = calculateTargetOffset(targetIndex, currentOffset);
        springApiRef.current.start({
          offset: targetOffset,
          config: springConfig,
        });
      }
    },
    {
      target: gl.domElement,
      enabled: dragEnabled,
      from: () => [0, 0],
      filterTaps: dragConfig?.filterTaps ?? true,
      threshold: dragConfig?.threshold ?? 5,
      pointer: dragConfig?.pointer ?? { touch: true, capture: true },
      axis: dragConfig?.axis ?? dragAxis,
      touchAction: dragConfig?.touchAction ?? "none",
      rubberband: dragConfig?.rubberband,
    }
  );

  // Set up touch action and cursor styles
  useEffect(() => {
    if (!dragEnabled) return;
    const el = gl.domElement;
    const prevTouchAction = el.style.touchAction;
    const prevCursor = el.style.cursor;
    el.style.touchAction = "none";
    el.style.cursor = "grab";
    return () => {
      el.style.touchAction = prevTouchAction;
      el.style.cursor = prevCursor;
    };
  }, [dragEnabled, gl.domElement]);

  return {
    offset,
    springApi,
    isDraggingRef,
    currentOffsetRef,
  };
}
