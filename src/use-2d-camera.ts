import {
  Camera,
  CameraBounds,
  CameraViewportNotFoundError,
  FollowTarget,
  cameraViewportMap,
} from "@gwenjs/camera-core";
import { onCleanup, useEngine } from "@gwenjs/core";
import type { GwenLogger } from "@gwenjs/core";
import * as rendererCore from "@gwenjs/renderer-core";
import { createCamera2DHandle } from "./camera2d-handle";
import type { Camera2DHandle, Use2DCameraOpts } from "./types";

type Camera2DLog = Pick<GwenLogger, "error">;
type ViewportManagerLike = {
  has?: (viewportId: string) => boolean;
  get?: (viewportId: string) => unknown;
};
type RendererCoreWithViewportManager = typeof rendererCore & {
  useViewportManager: () => ViewportManagerLike;
};

const DEFAULT_VIEWPORT = "main";
const DEFAULT_FOLLOW_LERP = 0.1;

function hasViewport(viewportManager: ViewportManagerLike, viewportId: string) {
  if (typeof viewportManager.has === "function") {
    return viewportManager.has(viewportId);
  }

  if (typeof viewportManager.get === "function") {
    return viewportManager.get(viewportId) !== undefined;
  }

  return false;
}

function logAndThrow(
  log: Camera2DLog,
  error: Error & { code?: string; hint?: string; docsUrl?: string },
): never {
  log.error(error.message, {
    code: error.code,
    hint: error.hint,
    docsUrl: error.docsUrl,
  });
  throw error;
}

export function use2DCamera(opts: Use2DCameraOpts = {}): Camera2DHandle {
  const engine = useEngine();
  const viewportManager = (rendererCore as RendererCoreWithViewportManager).useViewportManager();
  const log = engine.logger.child("camera2d:handle");
  const viewportId = opts.viewport ?? DEFAULT_VIEWPORT;

  if (!hasViewport(viewportManager, viewportId)) {
    logAndThrow(log, new CameraViewportNotFoundError(viewportId));
  }

  const id = engine.createEntity();

  engine.addComponent(id, Camera, {
    active: 1,
    priority: opts.priority ?? 0,
    projectionType: 0,
    x: opts.position?.x ?? 0,
    y: opts.position?.y ?? 0,
    z: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    zoom: opts.zoom ?? 1,
    fov: 1,
    near: -1,
    far: 1,
  });
  cameraViewportMap.set(id, viewportId);

  if (opts.follow !== undefined) {
    engine.addComponent(id, FollowTarget, {
      entityId: opts.follow,
      lerp: opts.lerp ?? DEFAULT_FOLLOW_LERP,
      offsetX: opts.offset?.x ?? 0,
      offsetY: opts.offset?.y ?? 0,
      offsetZ: 0,
    });
  }

  if (opts.bounds) {
    engine.addComponent(id, CameraBounds, {
      minX: opts.bounds.x,
      minY: opts.bounds.y,
      minZ: 0,
      maxX: opts.bounds.x + opts.bounds.width,
      maxY: opts.bounds.y + opts.bounds.height,
      maxZ: 0,
    });
  }

  onCleanup(() => {
    cameraViewportMap.delete(id);
    engine.destroyEntity(id);
  });

  return createCamera2DHandle(id, engine, log);
}
