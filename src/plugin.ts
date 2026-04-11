import { CameraCorePlugin } from "@gwenjs/camera-core";
import { definePlugin } from "@gwenjs/kit/plugin";

export const Camera2DPlugin = definePlugin(() => ({
  name: "@gwenjs/camera2d",
  async setup(engine) {
    await engine.use(CameraCorePlugin());
  },
}));
