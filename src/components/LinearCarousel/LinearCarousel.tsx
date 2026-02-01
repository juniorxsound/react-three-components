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
  type ReactElement,
} from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import {
  DEFAULT_GAP,
  DEFAULT_DIRECTION,
  DEFAULT_DRAG_SENSITIVITY,
  SPRING_CONFIG,
  DRAG_SPRING_CONFIG,
} from "./constants";
import { clamp } from "../../utils";
import { getItemPosition } from "./utils";
import { LinearCarouselContext } from "./context";
import {
  LinearCarouselNextTrigger,
  LinearCarouselPrevTrigger,
} from "./LinearCarouselTriggers";
import { useCarouselDrag } from "../../hooks";
import type { LinearCarouselProps, LinearCarouselRef } from "./types";

export const LinearCarousel = Object.assign(
  forwardRef<LinearCarouselRef, LinearCarouselProps>(function LinearCarousel(
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
      infinite = false,
    },
    ref
  ) {
    const [internalIndex, setInternalIndex] = useState(defaultIndex);
    const isControlled = controlledIndex !== undefined;
    const activeIndex = isControlled ? controlledIndex : internalIndex;
    const currentIndexRef = useRef(activeIndex);

    // Keep ref in sync with activeIndex
    useEffect(() => {
      currentIndexRef.current = activeIndex;
    }, [activeIndex]);

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
    const dragAxis = dragAxisProp ?? (direction === "horizontal" ? "x" : "y");

    // Callbacks for the drag hook
    const calculateIndexFromOffset = useCallback(
      (offset: number) => Math.round(-offset / itemSpacing),
      [itemSpacing]
    );

    const calculateTargetIndex = useCallback(
      (currentOffset: number, startIndex: number) => {
        let targetIndex = Math.round(-currentOffset / itemSpacing);
        targetIndex = clamp(targetIndex, startIndex - 1, startIndex + 1);

        if (infinite) {
          return ((targetIndex % count) + count) % count;
        }
        return clamp(targetIndex, 0, count - 1);
      },
      [itemSpacing, infinite, count]
    );

    const calculateTargetOffset = useCallback(
      (index: number) => -index * itemSpacing,
      [itemSpacing]
    );

    const handleNavigate = useCallback(
      (index: number) => {
        currentIndexRef.current = index;
        if (!isControlled) setInternalIndex(index);
        onIndexChange?.(index);
      },
      [isControlled, onIndexChange]
    );

    const { offset, springApi, isDraggingRef, currentOffsetRef } =
      useCarouselDrag({
        count,
        dragEnabled,
        dragAxis,
        dragSensitivity,
        maxDragAmount: itemSpacing,
        dragConfig,
        springConfig: SPRING_CONFIG,
        dragSpringConfig: DRAG_SPRING_CONFIG,
        calculateIndexFromOffset,
        calculateTargetIndex,
        calculateTargetOffset,
        onNavigate: handleNavigate,
      });

    const goToIndex = useCallback(
      (nextIndex: number) => {
        if (count === 0) return;

        let targetIndex: number;
        if (infinite) {
          targetIndex = ((nextIndex % count) + count) % count;
        } else {
          targetIndex = clamp(nextIndex, 0, count - 1);
        }

        if (targetIndex === currentIndexRef.current) return;
        currentIndexRef.current = targetIndex;
        if (!isControlled) setInternalIndex(targetIndex);
        onIndexChange?.(targetIndex);

        const targetOffset = -targetIndex * itemSpacing;
        springApi.start({ offset: targetOffset, config: SPRING_CONFIG });
      },
      [count, isControlled, onIndexChange, itemSpacing, infinite, springApi]
    );

    const next = useCallback(() => {
      if (count === 0) return;
      const nextIdx = infinite
        ? (currentIndexRef.current + 1) % count
        : Math.min(currentIndexRef.current + 1, count - 1);
      goToIndex(nextIdx);
    }, [count, goToIndex, infinite]);

    const prev = useCallback(() => {
      if (count === 0) return;
      const prevIdx = infinite
        ? (currentIndexRef.current - 1 + count) % count
        : Math.max(currentIndexRef.current - 1, 0);
      goToIndex(prevIdx);
    }, [count, goToIndex, infinite]);

    const goTo = useCallback((i: number) => goToIndex(i), [goToIndex]);

    useImperativeHandle(ref, () => ({ next, prev, goTo }), [next, prev, goTo]);

    // Sync spring when activeIndex changes externally
    useEffect(() => {
      if (!isDraggingRef.current && count > 0) {
        const targetOffset = -activeIndex * itemSpacing;
        springApi.start({ offset: targetOffset, config: SPRING_CONFIG });
      }
    }, [activeIndex, count, itemSpacing, springApi, isDraggingRef]);

    // Update position each frame
    useFrame(() => {
      if (!rootRef.current) return;
      const v = offset.get();
      currentOffsetRef.current = v;
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
  }),
  {
    NextTrigger: LinearCarouselNextTrigger,
    PrevTrigger: LinearCarouselPrevTrigger,
  }
);
