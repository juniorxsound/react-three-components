import { createContext, useContext } from "react";

export type CarouselContextValue = {
  /** Currently active item index */
  activeIndex: number;
  /** Total number of items */
  count: number;
  /** Navigate to the next item */
  next: () => void;
  /** Navigate to the previous item */
  prev: () => void;
  /** Navigate to a specific item by index */
  goTo: (index: number) => void;
};

export const CarouselContext = createContext<CarouselContextValue | null>(null);

/**
 * Hook to access carousel context from within a carousel component.
 * @param componentName - Name of the carousel component for error messages
 * @returns The carousel context value
 * @throws If used outside of a carousel component
 */
export function useCarouselContext(componentName: string): CarouselContextValue {
  const ctx = useContext(CarouselContext);
  if (!ctx) {
    throw new Error(
      `${componentName} compound components must be used within ${componentName}`
    );
  }
  return ctx;
}
