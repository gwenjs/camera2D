import * as core from "@gwenjs/core";
import * as rendererCore from "@gwenjs/renderer-core";
import type { ParallaxLayer } from "./types.js";

type CameraStateLike = {
  active: boolean;
  worldTransform: {
    position: {
      x: number;
      y: number;
    };
  };
};

type CameraManagerLike = {
  get: (viewportId: string) => CameraStateLike | undefined;
};

type RendererServiceLike = {
  getLayerElement: (layerName: string) => HTMLElement;
};

type RendererCoreWithParallaxRuntime = typeof rendererCore & {
  useCameraManager: () => CameraManagerLike;
  useService: (rendererName: string) => RendererServiceLike;
};

type CoreWithAfterUpdate = typeof core & {
  onAfterUpdate: (callback: (deltaMs: number) => void) => void;
};

export function useParallax(layers: ParallaxLayer[], viewportId = "main"): void {
  const runtime = rendererCore as RendererCoreWithParallaxRuntime;
  const cameraManager = runtime.useCameraManager();
  const resolvedLayers = layers.map((layer) => ({
    ...layer,
    renderer: runtime.useService(layer.rendererName),
  }));

  (core as CoreWithAfterUpdate).onAfterUpdate(() => {
    const state = cameraManager.get(viewportId);

    if (!state || !state.active) {
      return;
    }

    const { x, y } = state.worldTransform.position;

    for (const layer of resolvedLayers) {
      const element = layer.renderer.getLayerElement(layer.layerName);
      element.style.transform = `translate(${-x * layer.factor}px, ${-y * layer.factor}px)`;
    }
  });
}
