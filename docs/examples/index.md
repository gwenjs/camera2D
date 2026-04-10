# Examples

## Basic Usage

```typescript
import { useCamera2d } from '@gwenjs/camera2d'

// Inside a GWEN system or composable
const camera2d = useCamera2d()
```

## With Custom Config

```typescript
// gwen.config.ts
export default defineConfig({
  modules: [
    ['@gwenjs/camera2d', {
      // your options
    }],
  ],
})
```
