import { createContext, useContext } from "react";
import type { CarouselContextValue } from "./types";

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarouselContext(): CarouselContextValue {
  const ctx = useContext(CarouselContext);
  if (!ctx) {
    throw new Error(
      "CircularCarousel compound components must be used within CircularCarousel"
    );
  }
  return ctx;
}
