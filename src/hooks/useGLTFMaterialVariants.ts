import { use, useCallback, useState } from "react";
import type { Group, Material, Mesh } from "three";

/** KHR_materials_variants extension on the root glTF result. */
type VariantsExtension = {
  variants: Array<{ name: string }>;
};

/** Mesh primitive variant mapping (on mesh.userData.gltfExtensions). */
type MeshVariantDef = {
  mappings: Array<{ material: number; variants: number[] }>;
};

/**
 * glTF result from useGLTF (Drei), useLoader(GLTFLoader, url), or GLTFLoader.loadAsync.
 * Must include parser and userData.gltfExtensions for KHR_materials_variants.
 */
export type GLTFWithVariants = {
  scene: Group;
  parser: {
    getDependency: (type: string, index: number) => Promise<unknown>;
    assignFinalMaterial: (mesh: Mesh) => void;
  };
  userData: {
    gltfExtensions?: Record<string, VariantsExtension>;
  };
};

/** Options for useGLTFMaterialVariants. */
export type UseGLTFMaterialVariantsOptions = {
  /**
   * Initial variant to apply on first load. Prevents flashing the first variant
   * before switching. Defaults to the first variant in the model if omitted.
   */
  variant?: string;
  /**
   * Override for getVariantPromise (testing only). When provided, used instead
   * of the default implementation so tests can avoid suspending.
   */
  getVariantPromise?: (
    gltf: GLTFWithVariants,
    variantName: string
  ) => Promise<{ variantName: string }>;
};

/** Return value of useGLTFMaterialVariants. */
export type UseGLTFMaterialVariantsResult = {
  /** Variant names from the extension, or empty if no extension. */
  variants: string[];
  /** Currently active variant name, or null if no variants. */
  activeVariant: string | null;
  /** Switch to a variant by name. Suspends until the variant is applied. */
  setVariant: (variantName: string) => void;
};

/** Used internally and for testing. */
export function getVariantsExtension(
  gltf: GLTFWithVariants
): VariantsExtension | null {
  return gltf.userData?.gltfExtensions?.["KHR_materials_variants"] ?? null;
}

function applyVariant(
  scene: Group,
  parser: GLTFWithVariants["parser"],
  extension: VariantsExtension,
  variantName: string
): Promise<void> {
  const variantIndex = extension.variants.findIndex(
    (v) => v.name === variantName || v.name.includes(variantName)
  );
  if (variantIndex === -1) return Promise.resolve();

  const pending: Promise<void>[] = [];

  scene.traverse((object) => {
    if (
      !("isMesh" in object) ||
      !object.isMesh ||
      !object.userData?.gltfExtensions
    ) {
      return;
    }
    const mesh = object as Mesh;
    const meshVariantDef = object.userData.gltfExtensions[
      "KHR_materials_variants"
    ] as MeshVariantDef | undefined;
    if (!meshVariantDef) return;

    if (!object.userData.originalMaterial) {
      object.userData.originalMaterial = mesh.material;
    }

    const mapping = meshVariantDef.mappings.find((m) =>
      m.variants.includes(variantIndex)
    );

    if (mapping) {
      pending.push(
        (parser.getDependency("material", mapping.material) as Promise<Material>).then(
          (material) => {
            mesh.material = material;
            parser.assignFinalMaterial(mesh);
          }
        )
      );
    } else {
      mesh.material = object.userData.originalMaterial;
    }
  });

  return Promise.all(pending).then(() => undefined);
}

function getVariantPromise(
  gltf: GLTFWithVariants,
  variantName: string
): Promise<{ variantName: string }> {
  const extension = getVariantsExtension(gltf);
  if (!extension) {
    return Promise.resolve({ variantName });
  }

  return applyVariant(
    gltf.scene,
    gltf.parser,
    extension,
    variantName
  ).then(() => ({ variantName }));
}

/**
 * Parse and assign KHR_materials_variants on an already-loaded glTF.
 * Load the model with useGLTF (Drei), useLoader(GLTFLoader, url), or your own
 * loader; then pass the result here. Pass options.variant for the initial
 * variant to avoid flashing. Call setVariant(name) to switch—both initial
 * apply and setVariant suspend until the variant is applied. Wrap in a React
 * Suspense boundary.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants
 * @param gltf - Loaded glTF (from useGLTF, useLoader(GLTFLoader, url), etc.)
 * @param options - Optional initial variant (prevents flash on load)
 * @returns variants, activeVariant, and setVariant (render gltf.scene yourself)
 */
export function useGLTFMaterialVariants(
  gltf: GLTFWithVariants,
  options?: UseGLTFMaterialVariantsOptions
): UseGLTFMaterialVariantsResult {
  const extension = getVariantsExtension(gltf);
  const variantNames = extension
    ? extension.variants.map((v) => v.name)
    : [];
  const initialVariant =
    options?.variant ?? (variantNames[0] ?? null);

  const getPromise = options?.getVariantPromise ?? getVariantPromise;

  const [variantPromise, setVariantPromiseState] = useState<
    Promise<{ variantName: string | null }>
  >(() =>
    initialVariant && variantNames.length > 0
      ? getPromise(gltf, initialVariant)
      : Promise.resolve({ variantName: null })
  );

  const resolved = use(variantPromise);
  const activeVariant = resolved.variantName;

  const setVariant = useCallback(
    (variantName: string) => {
      setVariantPromiseState(getPromise(gltf, variantName));
    },
    [gltf, getPromise]
  );

  return {
    variants: variantNames,
    activeVariant: variantNames.length > 0 ? activeVariant : null,
    setVariant,
  };
}
