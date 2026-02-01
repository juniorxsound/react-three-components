import type { ReactNode } from "react";
import type { DragConfig, CarouselContextValue } from "../../hooks";

export type { DragConfig };

// Re-export for backwards compatibility
export type { CarouselContextValue as LinearCarouselContextValue };

export type LinearCarouselProps = {
  children: ReactNode;
  gap?: number;
  direction?: "horizontal" | "vertical";
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  dragEnabled?: boolean;
  dragSensitivity?: number;
  /** Axis for drag gesture. Default: derived from direction ("x" for horizontal, "y" for vertical) */
  dragAxis?: "x" | "y";
  /** Additional drag gesture configuration */
  dragConfig?: DragConfig;
  /** When true, navigation wraps from last item to first and vice versa. Default: false */
  infinite?: boolean;
};

export type LinearCarouselRef = {
  next(): void;
  prev(): void;
  goTo(index: number): void;
};
