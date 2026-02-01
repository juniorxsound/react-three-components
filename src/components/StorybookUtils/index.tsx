import type React from "react";
import { Box, Cone, Float, Sphere, Plane } from "@react-three/drei";
import { MeshNormalMaterial } from "three";

/**
 * A floating 3D shape for use in carousel stories.
 * Pass `isActive` to control the float animation.
 */
export function FloatingShape({
  type,
  isActive,
}: {
  type: "box" | "sphere" | "cone" | "plane";
  isActive: boolean;
}): React.ReactNode {
  const normalMaterial = new MeshNormalMaterial();
  const shapes = {
    box: (
      <Box rotation={[Math.PI / 4, Math.PI / 4, 0]} material={normalMaterial} />
    ),
    sphere: <Sphere material={normalMaterial} />,
    cone: (
      <Cone
        rotation={[-Math.PI / 4, Math.PI / 4, 0]}
        material={normalMaterial}
      />
    ),
    plane: <Plane material={normalMaterial} />,
  };

  const shape = shapes[type];
  if (!shape) return null;

  return (
    <Float enabled={isActive} speed={5}>
      {shape}
    </Float>
  );
}
