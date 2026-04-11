import * as core from "@gwenjs/core";
import * as rendererCore from "@gwenjs/renderer-core";
import type { CameraState } from "@gwenjs/renderer-core";

type CoreWithAfterUpdate = typeof core & {
  onAfterUpdate: (callback: (deltaMs: number) => void) => void;
};

export function snapCameraToPixels(state: CameraState): CameraState {
  return {
    ...state,
    worldTransform: {
      ...state.worldTransform,
      position: {
        ...state.worldTransform.position,
        x: Math.round(state.worldTransform.position.x),
        y: Math.round(state.worldTransform.position.y),
      },
    },
  };
}

export function usePixelPerfect(viewportId = "main"): void {
  const cameraManager = rendererCore.useCameraManager();

  (core as CoreWithAfterUpdate).onAfterUpdate(() => {
    const state = cameraManager.get(viewportId);

    if (!state || !state.active) {
      return;
    }

    cameraManager.set(viewportId, snapCameraToPixels(state));
  });
}
