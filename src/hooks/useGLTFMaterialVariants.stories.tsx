import type { Meta, StoryObj } from "@storybook/react";
import { startTransition, Suspense, useEffect } from "react";
import { Box, CameraControls, Environment, useGLTF } from "@react-three/drei";
import { useGLTFMaterialVariants } from "./useGLTFMaterialVariants";

const MATERIALS_VARIANTS_SHOE_URL =
  "https://raw.githubusercontent.com/pushmatrix/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF/MaterialsVariantsShoe.gltf";

const meta: Meta<{ variant: string }> = {
  title: "Hooks/useGLTFMaterialVariants",
  parameters: {
    docs: {
      description: {
        component:
          "Parse and assign KHR_materials_variants on an already-loaded glTF. Load with useGLTF (Drei), useLoader(GLTFLoader, url), or your own loader; then pass the result. Returns variants, activeVariant, and setVariant. Suspends until the first variant is applied—wrap in a Suspense boundary.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["midnight", "beach", "street"],
      description: "Switch variant via setVariant (the returned API).",
    },
  },
  args: {
    variant: "midnight",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function ShoeWithVariants({ variant }: { variant: string }) {
  const gltf = useGLTF(MATERIALS_VARIANTS_SHOE_URL);
  const { setVariant } = useGLTFMaterialVariants(gltf, { variant });

  useEffect(() => {
    // startTransition is used here because setVariants suspends until the variant is applied (if you want to avoid Suspense fallback while the variant is applying wrap it in startTransition)
    startTransition(() => {
      setVariant(variant);
    });
  }, [variant, setVariant]);

  return (
    <group scale={25} position-y={-1}>
      <primitive object={gltf.scene} />
    </group>
  );
}

export const MaterialsVariantsShoe: Story = {
  render: (args) => (
    <>
      <CameraControls makeDefault />
      <Environment preset="studio" />
      <Suspense fallback={null}>
        <ShoeWithVariants variant={args.variant} />
      </Suspense>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Materials Variants Shoe (Shopify) with three variants: midnight, beach, street. Use the Controls panel to switch variant (calls setVariant).",
      },
    },
  },
};
