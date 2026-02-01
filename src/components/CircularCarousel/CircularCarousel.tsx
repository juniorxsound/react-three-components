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
  TAU,
  DEFAULT_RADIUS,
  DEFAULT_AXIS,
  DEFAULT_DRAG_SENSITIVITY_FACTOR,
  SPRING_CONFIG,
  DRAG_SPRING_CONFIG,
} from "./constants";
import { clamp } from "../../utils";
import { getItemTransform, calculateShortestPath } from "./utils";
import { CarouselContext } from "./context";
import {
  CircularCarouselNextTrigger,
  CircularCarouselPrevTrigger,
} from "./CircularCarouselTriggers";
import { useCarouselDrag } from "../../hooks";
import type { CircularCarouselProps, CircularCarouselRef } from "./types";

export const CircularCarousel = Object.assign(
  forwardRef<CircularCarouselRef, CircularCarouselProps>(
    function CircularCarousel(
      {
        children,
        radius = DEFAULT_RADIUS,
        axis = DEFAULT_AXIS,
        index: controlledIndex,
        defaultIndex = 0,
        onIndexChange,
        dragEnabled = true,
        dragSensitivity: dragSensitivityProp,
        dragAxis = "x",
        dragConfig,
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
          c.type !== CircularCarouselNextTrigger &&
          c.type !== CircularCarouselPrevTrigger
      );
      const triggers = allChildren.filter(
        (c): c is ReactElement =>
          isValidElement(c) &&
          (c.type === CircularCarouselNextTrigger ||
            c.type === CircularCarouselPrevTrigger)
      );
      const count = items.length;

      const rootRef = useRef<Group>(null);
      const anglePerItem = count > 0 ? TAU / count : TAU;
      const dragSensitivity =
        dragSensitivityProp ?? DEFAULT_DRAG_SENSITIVITY_FACTOR / anglePerItem;

      // Callbacks for the drag hook
      const calculateIndexFromOffset = useCallback(
        (offset: number) =>
          ((Math.round((-offset / TAU) * count) % count) + count) % count,
        [count]
      );

      const calculateTargetIndex = useCallback(
        (currentOffset: number, startIndex: number, dragAmount: number) => {
          const prevIndex = (startIndex - 1 + count) % count;
          const nextIndex = (startIndex + 1) % count;

          let targetIndex =
            ((Math.round((-currentOffset / TAU) * count) % count) + count) %
            count;

          // Strictly enforce ±1 from start index
          if (
            targetIndex !== prevIndex &&
            targetIndex !== startIndex &&
            targetIndex !== nextIndex
          ) {
            targetIndex =
              dragAmount > 0
                ? nextIndex
                : dragAmount < 0
                  ? prevIndex
                  : startIndex;
          }

          return targetIndex;
        },
        [count]
      );

      const calculateTargetOffset = useCallback(
        (index: number, currentOffset: number) => {
          const targetLogical = -(index / count) * TAU;
          return calculateShortestPath(currentOffset, targetLogical);
        },
        [count]
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
          maxDragAmount: anglePerItem,
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
          const clamped = clamp(nextIndex, 0, count - 1);
          if (clamped === currentIndexRef.current) return;
          currentIndexRef.current = clamped;
          if (!isControlled) setInternalIndex(clamped);
          onIndexChange?.(clamped);

          const targetLogical = -(clamped / count) * TAU;
          const targetOffset = calculateShortestPath(
            currentOffsetRef.current,
            targetLogical
          );
          springApi.start({ offset: targetOffset, config: SPRING_CONFIG });
        },
        [count, isControlled, onIndexChange, currentOffsetRef, springApi]
      );

      const next = useCallback(() => {
        if (count === 0) return;
        goToIndex((currentIndexRef.current + 1) % count);
      }, [count, goToIndex]);

      const prev = useCallback(() => {
        if (count === 0) return;
        goToIndex((currentIndexRef.current - 1 + count) % count);
      }, [count, goToIndex]);

      const goTo = useCallback((i: number) => goToIndex(i), [goToIndex]);

      useImperativeHandle(ref, () => ({ next, prev, goTo }), [next, prev, goTo]);

      // Sync spring when activeIndex changes externally
      useEffect(() => {
        if (!isDraggingRef.current && count > 0) {
          const targetLogical = -(activeIndex / count) * TAU;
          const cur = currentOffsetRef.current;
          const stale = cur === 0 && activeIndex !== 0;
          const targetOffset = stale
            ? targetLogical
            : calculateShortestPath(cur, targetLogical);
          springApi.start({ offset: targetOffset, config: SPRING_CONFIG });
        }
      }, [activeIndex, count, springApi, isDraggingRef, currentOffsetRef]);

      // Update rotation each frame
      useFrame(() => {
        if (!rootRef.current) return;
        const v = offset.get();
        currentOffsetRef.current = v;
        rootRef.current.rotation[axis] = v;
      });

      const computeTransform = useCallback(
        (i: number) => getItemTransform(i, count, radius, axis),
        [count, radius, axis]
      );

      const ctx = useMemo(
        () => ({ activeIndex, count, next, prev, goTo }),
        [activeIndex, count, next, prev, goTo]
      );

      return (
        <CarouselContext.Provider value={ctx}>
          <group ref={rootRef}>
            {items.map((child, i) => {
              const { position, rotation } = computeTransform(i);
              return (
                <group
                  key={child.key ?? i}
                  position={position}
                  rotation={rotation}
                >
                  {child}
                </group>
              );
            })}
          </group>
          {triggers}
        </CarouselContext.Provider>
      );
    }
  ),
  {
    NextTrigger: CircularCarouselNextTrigger,
    PrevTrigger: CircularCarouselPrevTrigger,
  }
);
