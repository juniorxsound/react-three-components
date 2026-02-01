import { CarouselContext, useCarouselContext } from "../../hooks";

// Re-export the shared context for use in this component
export { CarouselContext as LinearCarouselContext };

// Wrapper with component-specific error message
export function useLinearCarouselContext() {
  return useCarouselContext("LinearCarousel");
}
