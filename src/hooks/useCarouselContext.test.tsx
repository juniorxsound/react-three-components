import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { CarouselContext, useCarouselContext } from "./useCarouselContext";
import type { CarouselContextValue } from "./useCarouselContext";

// Test component that uses the hook
function TestConsumer({ componentName }: { componentName: string }) {
  const ctx = useCarouselContext(componentName);
  return createElement("div", { "data-index": ctx.activeIndex });
}

describe("useCarouselContext", () => {
  it("throws an error when used outside of a provider", () => {
    expect(() => {
      renderToString(createElement(TestConsumer, { componentName: "TestCarousel" }));
    }).toThrow(
      "TestCarousel compound components must be used within TestCarousel"
    );
  });

  it("throws with the correct component name in error message", () => {
    expect(() => {
      renderToString(createElement(TestConsumer, { componentName: "LinearCarousel" }));
    }).toThrow(
      "LinearCarousel compound components must be used within LinearCarousel"
    );

    expect(() => {
      renderToString(createElement(TestConsumer, { componentName: "CircularCarousel" }));
    }).toThrow(
      "CircularCarousel compound components must be used within CircularCarousel"
    );
  });

  it("returns context value when used within a provider", () => {
    const mockContextValue: CarouselContextValue = {
      activeIndex: 2,
      count: 5,
      next: vi.fn(),
      prev: vi.fn(),
      goTo: vi.fn(),
    };

    const result = renderToString(
      createElement(
        CarouselContext.Provider,
        { value: mockContextValue },
        createElement(TestConsumer, { componentName: "TestCarousel" })
      )
    );

    expect(result).toContain('data-index="2"');
  });

  it("provides all context properties to consumers", () => {
    const next = vi.fn();
    const prev = vi.fn();
    const goTo = vi.fn();

    const mockContextValue: CarouselContextValue = {
      activeIndex: 1,
      count: 4,
      next,
      prev,
      goTo,
    };

    // Test component that validates context and renders data attributes
    function ContextValidator({ componentName }: { componentName: string }) {
      const ctx = useCarouselContext(componentName);
      // Call functions to verify they're the same references
      ctx.next();
      ctx.prev();
      ctx.goTo(5);
      return createElement("div", {
        "data-index": ctx.activeIndex,
        "data-count": ctx.count,
      });
    }

    const result = renderToString(
      createElement(
        CarouselContext.Provider,
        { value: mockContextValue },
        createElement(ContextValidator, { componentName: "TestCarousel" })
      )
    );

    expect(result).toContain('data-index="1"');
    expect(result).toContain('data-count="4"');
    expect(next).toHaveBeenCalledTimes(1);
    expect(prev).toHaveBeenCalledTimes(1);
    expect(goTo).toHaveBeenCalledWith(5);
  });
});

describe("CarouselContext", () => {
  it("has null as default value and throws when accessed", () => {
    expect(() => {
      renderToString(
        createElement(
          CarouselContext.Provider,
          { value: null },
          createElement(TestConsumer, { componentName: "TestCarousel" })
        )
      );
    }).toThrow();
  });
});
