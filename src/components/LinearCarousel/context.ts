import { createContext, useContext } from "react";
import type { LinearCarouselContextValue } from "./types";

export const LinearCarouselContext =
  createContext<LinearCarouselContextValue | null>(null);

export function useLinearCarouselContext(): LinearCarouselContextValue {
  const ctx = useContext(LinearCarouselContext);
  if (!ctx) {
    throw new Error(
      "LinearCarousel compound components must be used within LinearCarousel"
    );
  }
  return ctx;
}
