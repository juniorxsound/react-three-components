import type { ReactNode } from "react";
import type { DragConfig, CarouselContextValue } from "../../hooks";

export type { DragConfig, CarouselContextValue };

export type CircularCarouselProps = {
  children: ReactNode;
  radius?: number;
  axis?: "x" | "y" | "z";
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  dragEnabled?: boolean;
  dragSensitivity?: number;
  /** Axis for drag gesture. Default: "x" */
  dragAxis?: "x" | "y";
  /** Additional drag gesture configuration */
  dragConfig?: DragConfig;
};

export type CircularCarouselRef = {
  next(): void;
  prev(): void;
  goTo(index: number): void;
};
