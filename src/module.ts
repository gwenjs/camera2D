import { defineGwenModule } from "@gwenjs/kit/module";
import { Camera2DPlugin } from "./plugin";

export default defineGwenModule({
  meta: { name: "@gwenjs/camera2d" },
  async setup(_options, kit) {
    kit.addPlugin(Camera2DPlugin());
    kit.addAutoImports([
      { name: "use2DCamera", from: "@gwenjs/camera2d" },
      { name: "useParallax", from: "@gwenjs/camera2d" },
      { name: "usePixelPerfect", from: "@gwenjs/camera2d" },
    ]);
  },
});
