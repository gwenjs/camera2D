import {
  Camera,
  CameraBounds,
  CameraEmptyPathError,
  CameraPath,
  CameraShake,
  CameraViewportNotFoundError,
  FollowTarget,
  cameraPathStore,
  cameraViewportMap,
} from "@gwenjs/camera-core";
import type { CameraWaypoint, PathOpts } from "@gwenjs/camera-core";
import type { EntityId, GwenEngine, GwenLogger } from "@gwenjs/core";
import type { Camera2DHandle, Rect } from "./types";

type Camera2DHandleLog = Pick<GwenLogger, "error">;
type ViewportManagerLike = {
  has?: (viewportId: string) => boolean;
  get?: (viewportId: string) => unknown;
};

const DEFAULT_FOLLOW_LERP = 0.1;
const DEFAULT_SHAKE_DECAY = 1;
const DEFAULT_SHAKE_MAX_OFFSET = 1;

function clearCameraMotion(engine: GwenEngine, id: EntityId) {
  engine.removeComponent(id, FollowTarget);
  engine.removeComponent(id, CameraPath);
  cameraPathStore.delete(id);
}

function logAndThrow(
  log: Camera2DHandleLog,
  error: Error & { code?: string; hint?: string; docsUrl?: string },
): never {
  log.error(error.message, {
    code: error.code,
    hint: error.hint,
    docsUrl: error.docsUrl,
  });
  throw error;
}

function hasViewport(viewportManager: ViewportManagerLike, viewportId: string) {
  if (typeof viewportManager.has === "function") {
    return viewportManager.has(viewportId);
  }

  if (typeof viewportManager.get === "function") {
    return viewportManager.get(viewportId) !== undefined;
  }

  return false;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function createCamera2DHandle(
  id: EntityId,
  engine: GwenEngine,
  log: Camera2DHandleLog,
): Camera2DHandle {
  return {
    follow(targetId, opts) {
      engine.removeComponent(id, CameraPath);
      cameraPathStore.delete(id);
      engine.addComponent(id, FollowTarget, {
        entityId: targetId,
        lerp: opts?.lerp ?? DEFAULT_FOLLOW_LERP,
        offsetX: opts?.offset?.x ?? 0,
        offsetY: opts?.offset?.y ?? 0,
        offsetZ: 0,
      });
    },

    setPosition(x, y) {
      clearCameraMotion(engine, id);
      engine.addComponent(id, Camera, { x, y });
    },

    playPath(waypoints: CameraWaypoint[], opts?: PathOpts) {
      if (waypoints.length === 0) {
        logAndThrow(log, new CameraEmptyPathError());
      }

      engine.removeComponent(id, FollowTarget);
      cameraPathStore.set(id, {
        waypoints,
        opts: opts ?? {},
        elapsed: 0,
      });
      engine.addComponent(id, CameraPath, { index: 0, progress: 0 });
    },

    setZoom(zoom) {
      engine.addComponent(id, Camera, { zoom });
    },

    setBounds(rect: Rect | null) {
      if (rect === null) {
        engine.removeComponent(id, CameraBounds);
        return;
      }

      engine.addComponent(id, CameraBounds, {
        minX: rect.x,
        minY: rect.y,
        minZ: 0,
        maxX: rect.x + rect.width,
        maxY: rect.y + rect.height,
        maxZ: 0,
      });
    },

    setViewport(viewportId: string) {
      const viewportManager = engine.inject("viewportManager" as never) as ViewportManagerLike;

      if (!hasViewport(viewportManager, viewportId)) {
        logAndThrow(log, new CameraViewportNotFoundError(viewportId));
      }

      cameraViewportMap.set(id, viewportId);
    },

    shake(intensity) {
      const current = engine.getComponent(id, CameraShake);
      const trauma = clamp((current?.trauma ?? 0) + intensity, 0, 1);

      engine.addComponent(id, CameraShake, {
        trauma,
        decay: current?.decay ?? DEFAULT_SHAKE_DECAY,
        maxX: current?.maxX ?? DEFAULT_SHAKE_MAX_OFFSET,
        maxY: current?.maxY ?? DEFAULT_SHAKE_MAX_OFFSET,
      });
    },

    activate() {
      engine.addComponent(id, Camera, { active: 1 });
    },

    deactivate() {
      engine.addComponent(id, Camera, { active: 0 });
    },
  };
}
