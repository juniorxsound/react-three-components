import {
  useCallback,
  useImperativeHandle,
  isValidElement,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useEffect,
  Children,
  type ForwardRefExoticComponent,
  type ReactElement,
  type RefAttributes,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import type { Group } from "three";

import {
  DEFAULT_GAP,
  DEFAULT_DIRECTION,
  DEFAULT_DRAG_SENSITIVITY,
  SPRING_CONFIG,
  DRAG_SPRING_CONFIG,
} from "./constants";
import { clamp, getItemPosition } from "./utils";
import { LinearCarouselContext } from "./context";
import {
  LinearCarouselNextTrigger,
  LinearCarouselPrevTrigger,
} from "./LinearCarouselTriggers";
import type { LinearCarouselProps, LinearCarouselRef } from "./types";

type LinearCarouselComponent = ForwardRefExoticComponent<
  LinearCarouselProps & RefAttributes<LinearCarouselRef>
> & {
  NextTrigger: typeof LinearCarouselNextTrigger;
  PrevTrigger: typeof LinearCarouselPrevTrigger;
};

const LinearCarouselBase = forwardRef<LinearCarouselRef, LinearCarouselProps>(
  function LinearCarousel(
    {
      children,
      gap = DEFAULT_GAP,
      direction = DEFAULT_DIRECTION,
      index: controlledIndex,
      defaultIndex = 0,
      onIndexChange,
      dragEnabled = true,
      dragSensitivity: dragSensitivityProp,
      dragAxis: dragAxisProp,
      dragConfig,
    },
    ref
  ) {
    const [internalIndex, setInternalIndex] = useState(defaultIndex);
    const isControlled = controlledIndex !== undefined;
    const activeIndex = isControlled ? controlledIndex : internalIndex;
    const currentIndexRef = useRef(activeIndex);
    currentIndexRef.current = activeIndex;

    const allChildren = useMemo(() => Children.toArray(children), [children]);
    const items = allChildren.filter(
      (c): c is ReactElement =>
        isValidElement(c) &&
        c.type !== LinearCarouselNextTrigger &&
        c.type !== LinearCarouselPrevTrigger
    );
    const triggers = allChildren.filter(
      (c): c is ReactElement =>
        isValidElement(c) &&
        (c.type === LinearCarouselNextTrigger ||
          c.type === LinearCarouselPrevTrigger)
    );
    const count = items.length;

    const rootRef = useRef<Group>(null);
    const itemSpacing = 1 + gap;
    const dragSensitivity = dragSensitivityProp ?? DEFAULT_DRAG_SENSITIVITY;

    const [{ offset }, api] = useSpring(() => ({ offset: 0 }));
    const apiRef = useRef(api);
    apiRef.current = api;
    const isDraggingRef = useRef(false);
    const currentOffsetRef = useRef(0);
    const dragStartOffsetRef = useRef(0);

    const goToIndex = useCallback(
      (nextIndex: number) => {
        // Clamp to valid range (bounded, not circular)
        const clamped = clamp(nextIndex, 0, count - 1);
        if (clamped === currentIndexRef.current) return;
        currentIndexRef.current = clamped;
        if (!isControlled) setInternalIndex(clamped);
        onIndexChange?.(clamped);

        const targetOffset = -clamped * itemSpacing;
        apiRef.current.start({ offset: targetOffset, config: SPRING_CONFIG });
      },
      [count, isControlled, onIndexChange, itemSpacing]
    );

    // Bounded navigation - no wrapping
    const next = useCallback(() => {
      if (count === 0) return;
      const nextIdx = Math.min(currentIndexRef.current + 1, count - 1);
      goToIndex(nextIdx);
    }, [count, goToIndex]);

    const prev = useCallback(() => {
      if (count === 0) return;
      const prevIdx = Math.max(currentIndexRef.current - 1, 0);
      goToIndex(prevIdx);
    }, [count, goToIndex]);

    const goTo = useCallback((i: number) => goToIndex(i), [goToIndex]);

    useImperativeHandle(ref, () => ({ next, prev, goTo }), [next, prev, goTo]);

    useEffect(() => {
      if (!isDraggingRef.current && count > 0) {
        const targetOffset = -activeIndex * itemSpacing;
        apiRef.current.start({ offset: targetOffset, config: SPRING_CONFIG });
      }
    }, [activeIndex, count, itemSpacing]);

    const { gl } = useThree();
    // Default drag axis based on direction, but allow override
    const dragAxis = dragAxisProp ?? (direction === "horizontal" ? "x" : "y");

    useDrag(
      ({ active, movement: [mx, my], first, last, event }) => {
        isDraggingRef.current = active;
        const e = event as PointerEvent;
        const movement = dragAxis === "x" ? mx : my;

        if (active && first && e.pointerId != null) {
          gl.domElement.setPointerCapture(e.pointerId);
          gl.domElement.style.cursor = "grabbing";
          dragStartOffsetRef.current = currentOffsetRef.current;
        }
        if (!active && last && e.pointerId != null) {
          try {
            gl.domElement.releasePointerCapture(e.pointerId);
          } catch {
            // Pointer may already be released
          }
          gl.domElement.style.cursor = "grab";
        }

        const baseOffset = first
          ? currentOffsetRef.current
          : dragStartOffsetRef.current;
        const movementNum = Number(movement);
        const dragOffset = Number.isFinite(movementNum)
          ? clamp(movementNum / dragSensitivity, -itemSpacing, itemSpacing)
          : 0;

        if (active) {
          apiRef.current.start({
            offset: baseOffset + dragOffset,
            config: DRAG_SPRING_CONFIG,
          });
        } else {
          const current = currentIndexRef.current;
          const currentOffset = baseOffset + dragOffset;

          // Calculate target index from offset
          let targetIndex = Math.round(-currentOffset / itemSpacing);
          
          // Clamp to one item distance from current
          targetIndex = clamp(targetIndex, current - 1, current + 1);
          
          // Clamp to valid range (bounded)
          const clampedIndex = clamp(targetIndex, 0, count - 1);
          
          if (count === 0 || !Number.isFinite(clampedIndex)) {
            apiRef.current.start({ offset: baseOffset, config: SPRING_CONFIG });
            return;
          }

          currentIndexRef.current = clampedIndex;
          if (!isControlled) setInternalIndex(clampedIndex);
          onIndexChange?.(clampedIndex);

          const targetOffset = -clampedIndex * itemSpacing;
          apiRef.current.start({ offset: targetOffset, config: SPRING_CONFIG });
        }
      },
      {
        target: gl.domElement,
        enabled: dragEnabled,
        pointer: dragConfig?.pointer ?? { touch: true, capture: true },
        axis: dragConfig?.axis ?? dragAxis,
        touchAction: dragConfig?.touchAction ?? "none",
        threshold: dragConfig?.threshold,
        rubberband: dragConfig?.rubberband,
      }
    );

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

    useFrame(() => {
      if (!rootRef.current) return;
      const v = offset.get();
      currentOffsetRef.current = v;
      // Apply offset to position based on direction
      if (direction === "horizontal") {
        rootRef.current.position.x = v;
      } else {
        rootRef.current.position.y = v;
      }
    });

    const computePosition = useCallback(
      (i: number) => getItemPosition(i, gap, direction),
      [gap, direction]
    );

    const ctx = useMemo(
      () => ({ activeIndex, count, next, prev, goTo }),
      [activeIndex, count, next, prev, goTo]
    );

    return (
      <LinearCarouselContext.Provider value={ctx}>
        <group ref={rootRef}>
          {items.map((child, i) => {
            const position = computePosition(i);
            return (
              <group key={child.key ?? i} position={[...position]}>
                {child}
              </group>
            );
          })}
        </group>
        {triggers}
      </LinearCarouselContext.Provider>
    );
  }
);

(LinearCarouselBase as LinearCarouselComponent).NextTrigger =
  LinearCarouselNextTrigger;
(LinearCarouselBase as LinearCarouselComponent).PrevTrigger =
  LinearCarouselPrevTrigger;

export const LinearCarousel = LinearCarouselBase as LinearCarouselComponent;
