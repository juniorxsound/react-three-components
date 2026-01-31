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
  TAU,
  DEFAULT_RADIUS,
  DEFAULT_AXIS,
  DEFAULT_DRAG_SENSITIVITY_FACTOR,
  SPRING_CONFIG,
  DRAG_SPRING_CONFIG,
} from "./constants";
import { clamp, getItemTransform, calculateShortestPath } from "./utils";
import { CarouselContext } from "./context";
import {
  CircularCarouselNextTrigger,
  CircularCarouselPrevTrigger,
} from "./CircularCarouselTriggers";
import type { CircularCarouselProps, CircularCarouselRef } from "./types";

type CircularCarouselComponent = ForwardRefExoticComponent<
  CircularCarouselProps & RefAttributes<CircularCarouselRef>
> & {
  NextTrigger: typeof CircularCarouselNextTrigger;
  PrevTrigger: typeof CircularCarouselPrevTrigger;
};

const CircularCarouselBase = forwardRef<
  CircularCarouselRef,
  CircularCarouselProps
>(function CircularCarousel(
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
  currentIndexRef.current = activeIndex;

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

  const [{ offset }, api] = useSpring(() => ({ offset: 0 }));
  const apiRef = useRef(api);
  apiRef.current = api;
  const isDraggingRef = useRef(false);
  const currentOffsetRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

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
      apiRef.current.start({ offset: targetOffset, config: SPRING_CONFIG });
    },
    [count, isControlled, onIndexChange]
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

  useEffect(() => {
    if (!isDraggingRef.current && count > 0) {
      const targetLogical = -(activeIndex / count) * TAU;
      const cur = currentOffsetRef.current;
      const stale = cur === 0 && activeIndex !== 0;
      const targetOffset = stale
        ? targetLogical
        : calculateShortestPath(cur, targetLogical);
      apiRef.current.start({ offset: targetOffset, config: SPRING_CONFIG });
    }
  }, [activeIndex, count]);

  const { gl } = useThree();

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
      const dragRad = Number.isFinite(movementNum)
        ? clamp(movementNum / dragSensitivity, -anglePerItem, anglePerItem)
        : 0;

      if (active) {
        apiRef.current.start({
          offset: baseOffset + dragRad,
          config: DRAG_SPRING_CONFIG,
        });
      } else {
        const current = currentIndexRef.current;
        const prevIndex = (current - 1 + count) % count;
        const nextIndex = (current + 1) % count;
        const currentOffset = baseOffset + dragRad;

        let targetIndex =
          ((Math.round((-currentOffset / TAU) * count) % count) + count) %
          count;
        if (
          targetIndex !== prevIndex &&
          targetIndex !== current &&
          targetIndex !== nextIndex
        ) {
          targetIndex =
            dragRad > 0 ? nextIndex : dragRad < 0 ? prevIndex : current;
        }

        const clampedIndex = clamp(targetIndex, 0, count - 1);
        if (count === 0 || !Number.isFinite(clampedIndex)) {
          apiRef.current.start({ offset: baseOffset, config: SPRING_CONFIG });
          return;
        }

        currentIndexRef.current = clampedIndex;
        if (!isControlled) setInternalIndex(clampedIndex);
        onIndexChange?.(clampedIndex);

        const targetLogical = -(clampedIndex / count) * TAU;
        const targetOffset = calculateShortestPath(currentOffset, targetLogical);
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
            <group key={child.key ?? i} position={position} rotation={rotation}>
              {child}
            </group>
          );
        })}
      </group>
      {triggers}
    </CarouselContext.Provider>
  );
});

(CircularCarouselBase as CircularCarouselComponent).NextTrigger =
  CircularCarouselNextTrigger;
(CircularCarouselBase as CircularCarouselComponent).PrevTrigger =
  CircularCarouselPrevTrigger;

export const CircularCarousel =
  CircularCarouselBase as CircularCarouselComponent;
