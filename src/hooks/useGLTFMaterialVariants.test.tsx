import { describe, it, expect, vi } from "vitest";
import { createElement, Suspense } from "react";
import { renderToString } from "react-dom/server";
import type { GLTFWithVariants } from "./useGLTFMaterialVariants";
import {
  getVariantsExtension,
  useGLTFMaterialVariants,
} from "./useGLTFMaterialVariants";

function createMockGltf(variants: Array<{ name: string }>): GLTFWithVariants {
  return {
    scene: { traverse: vi.fn() } as unknown as GLTFWithVariants["scene"],
    parser: {
      getDependency: vi.fn().mockResolvedValue({}),
      assignFinalMaterial: vi.fn(),
    },
    userData: {
      gltfExtensions: variants.length
        ? { KHR_materials_variants: { variants } }
        : {},
    },
  };
}

function TestConsumer({
  gltf,
  options,
  onResult,
}: {
  gltf: GLTFWithVariants;
  options?: Parameters<typeof useGLTFMaterialVariants>[1];
  onResult: (result: ReturnType<typeof useGLTFMaterialVariants>) => void;
}) {
  const result = useGLTFMaterialVariants(gltf, options);
  onResult(result);
  return createElement("div", {
    "data-testid": "consumer",
    "data-variants": result.variants.join(","),
    "data-active": result.activeVariant ?? "",
  });
}

/** Thenable that resolves synchronously so use() does not suspend. */
function syncResolve<T>(value: T): Promise<T> {
  return {
    then: (onFulfilled?: (v: T) => unknown) =>
      onFulfilled ? Promise.resolve(onFulfilled(value)) : (syncResolve(value) as Promise<T>),
  } as Promise<T>;
}

describe("getVariantsExtension", () => {
  it("returns null when glTF has no KHR_materials_variants", () => {
    const gltf = createMockGltf([]);
    expect(getVariantsExtension(gltf)).toBeNull();
  });

  it("returns extension with variant names when present", () => {
    const gltf = createMockGltf([
      { name: "midnight" },
      { name: "beach" },
    ]);
    const ext = getVariantsExtension(gltf);
    expect(ext).not.toBeNull();
    expect(ext!.variants.map((v) => v.name)).toEqual(["midnight", "beach"]);
  });
});

describe("useGLTFMaterialVariants", () => {
  it("parses variant names from glTF metadata and applies first variant by default", () => {
    const gltf = createMockGltf([
      { name: "midnight" },
      { name: "beach" },
      { name: "street" },
    ]);
    const getVariantPromise = vi.fn((_gltf: GLTFWithVariants, variantName: string) =>
      syncResolve({ variantName })
    );
    let result: ReturnType<typeof useGLTFMaterialVariants> | null = null;

    renderToString(
      createElement(
        Suspense,
        { fallback: createElement("div", { "data-testid": "fallback" }) },
        createElement(TestConsumer, {
          gltf,
          options: { getVariantPromise },
          onResult: (r) => {
            result = r;
          },
        })
      )
    );

    expect(result).not.toBeNull();
    expect(result!.variants).toEqual(["midnight", "beach", "street"]);
    expect(result!.activeVariant).toBe("midnight");
    expect(getVariantPromise).toHaveBeenCalledWith(gltf, "midnight");
  });

  it("applies options.variant as initial variant when provided", () => {
    const gltf = createMockGltf([
      { name: "midnight" },
      { name: "beach" },
      { name: "street" },
    ]);
    const getVariantPromise = vi.fn((_gltf: GLTFWithVariants, variantName: string) =>
      syncResolve({ variantName })
    );
    let result: ReturnType<typeof useGLTFMaterialVariants> | null = null;

    renderToString(
      createElement(
        Suspense,
        { fallback: createElement("div", { "data-testid": "fallback" }) },
        createElement(TestConsumer, {
          gltf,
          options: { variant: "beach", getVariantPromise },
          onResult: (r) => {
            result = r;
          },
        })
      )
    );

    expect(result).not.toBeNull();
    expect(result!.activeVariant).toBe("beach");
    expect(getVariantPromise).toHaveBeenCalledWith(gltf, "beach");
  });
});
