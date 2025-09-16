# Debugging Proxy Configuration Issue

## Problem
All API calls are being made to `http://localhost:4200/api/*` instead of being proxied to `http://localhost:3000/*`.

Examples of failing calls:
- `http://localhost:4200/api/dashboard/metrics` → Should proxy to `http://localhost:3000/dashboard/metrics`
- `http://localhost:4200/api/dashboard/recent-activity` → Should proxy to `http://localhost:3000/dashboard/recent-activity`  
- `http://localhost:4200/api/products` → Should proxy to `http://localhost:3000/products`

## Current Configuration

### Environment Configuration (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  name: 'local',
  apiUrl: '', // Empty string for relative paths
  useProxy: true
};
```

### API Configuration (`src/app/api/api-configuration.ts`)
```typescript
@Injectable()
export class ApiConfiguration {
  rootUrl: string = ''; // Empty string
}
```

### Proxy Configuration (`proxy.conf.json`)
```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/api": ""
    }
  }
}
```

### Server Configuration (`project.json`)
```json
"serve": {
  "configurations": {
    "development": {
      "buildTarget": "orbyt:build:development",
      "proxyConfig": "proxy.conf.json"
    }
  }
}
```

## Root Cause Analysis

The issue is that despite having:
- Empty `rootUrl` in ApiConfiguration
- Correct proxy configuration
- Running with `npm run serve:local` (development configuration)

The HTTP requests are still being constructed as absolute URLs (`http://localhost:4200/api/*`) instead of relative URLs (`/api/*`) that would trigger the proxy.

## Console Logs Observed
```
ApiConfiguration constructor - rootUrl: 
API Config - rootUrl:  environment.apiUrl: 
BaseService rootUrl:  config.rootUrl:  _rootUrl: undefined
```

This shows the rootUrl is correctly empty, but something is still constructing absolute URLs.

## CONFIRMED ISSUE

**The proxy is NOT working at all!**

Test result:
```bash
curl http://localhost:4200/api/auth/login -X POST
# Returns: "Cannot POST /api/auth/login" (from Angular dev server)
# Should return: {"message":"Unauthorized","statusCode":401} (from backend)
```

This confirms the Angular dev server is not applying the proxy configuration from `proxy.conf.json`.

## Next Steps to Investigate

1. **Check if Angular's HttpClient is resolving URLs**
   - The HttpClient might be automatically resolving relative URLs to absolute ones
   - Need to verify if this is happening in the RequestBuilder or HttpClient

2. **Verify proxy is actually being applied**
   - Check if the dev server is actually using the proxy configuration
   - Look for proxy debug logs in the console

3. **Check for interceptors or other middleware**
   - Verify no interceptors are modifying URLs
   - Check if any services are overriding the base URL

4. **Browser behavior**
   - Browsers may be resolving `/api/*` to the current origin automatically
   - This might be expected behavior, but proxy should still intercept

## Commands to Debug

1. Restart server with verbose logging:
   ```bash
   npm run serve:local -- --verbose
   ```

2. Check for proxy debug logs in terminal output

3. Inspect network tab to see if proxy is intercepting (should show 404 from localhost:3000, not 4200)