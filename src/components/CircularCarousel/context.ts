import { CarouselContext, useCarouselContext } from "../../hooks";

// Re-export the shared context for use in this component
export { CarouselContext };

// Wrapper with component-specific error message
export function useCircularCarouselContext() {
  return useCarouselContext("CircularCarousel");
}

// Keep the old name for backwards compatibility
export { useCircularCarouselContext as useCarouselContext };
