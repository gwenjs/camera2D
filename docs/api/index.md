# API Reference

## `useCamera2d()`

Returns the `Camera2dService` instance registered by `Camera2dPlugin`.

```typescript
import { useCamera2d } from '@gwenjs/camera2d'

const camera2d = useCamera2d()
```

**Throws** `GwenPluginNotFoundError` if `Camera2dPlugin` is not registered.

## `Camera2dConfig`

Configuration options passed to the plugin.

```typescript
interface Camera2dConfig {
  // Add your options here
}
```

## `Camera2dService`

Runtime service provided by the plugin.

```typescript
interface Camera2dService {
  // Add your methods here
}
```
