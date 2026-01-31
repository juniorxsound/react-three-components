import type { Preview } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import React from "react";

const preview: Preview = {
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "400px" }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: true }}
        >
          <Story />
        </Canvas>
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
