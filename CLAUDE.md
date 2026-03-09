# CLAUDE.md — Raporix (Raptor) Mobile App

This file provides guidance for AI assistants working on this codebase.

## Project Overview

**Raporix** is a React Native mobile application (registered as `Raptor`) for field inspection and work order management. It supports two user roles — **admin** and **employee** — with role-based navigation. The app communicates with a REST backend to manage companies, work orders, equipment, certificates, and inspection reports.

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React Native 0.80.0 |
| Language | TypeScript 5.0.4 |
| Navigation | React Navigation 7 (Stack + Bottom Tabs) |
| State | React Context API + AsyncStorage |
| Internationalization | i18next + react-i18next |
| Icons | react-native-vector-icons (Ionicons), lucide-react |
| Date Picker | @react-native-community/datetimepicker, react-native-date-picker |
| File Handling | @react-native-documents/picker, react-native-image-picker |
| PDF | react-native-pdf, react-native-blob-util |
| Crypto | crypto-js |
| Testing | Jest 29, react-test-renderer |
| Linting | ESLint (@react-native config), Prettier |
| Build (Android) | Gradle, Android SDK API 36 |
| Build (iOS) | Xcode, CocoaPods |
| CI/CD | GitHub Actions (.github/workflows/build-apk.yml) |

## Directory Structure

```
Raporix/
├── App.tsx                    # Root component: wraps ThemeProvider + AppNavigator
├── index.js                   # App entry point (AppRegistry.registerComponent)
├── src/
│   ├── api/                   # One file per API resource (13 modules)
│   │   ├── client.ts          # Base HTTP client (fetch wrapper, auth, timeout)
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── companies.ts
│   │   ├── workOrders.ts
│   │   ├── equipment.ts
│   │   ├── certificates.ts
│   │   ├── reports.ts
│   │   ├── forms.ts
│   │   ├── panolar.ts
│   │   ├── reportHeaderTemplate.ts
│   │   ├── uploads.ts
│   │   └── feedback.ts
│   ├── components/            # Reusable UI components
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Main navigator — auth check, role routing
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── SimpleRegisterScreen.tsx
│   │   ├── EmailVerification.tsx
│   │   ├── AdminTabNavigator.tsx
│   │   ├── EmployeeTabNavigator.tsx
│   │   ├── profile/           # EditProfile, ChangePassword, Theme, etc.
│   │   ├── company/           # WorkOrders, Equipment, Certificates, PDF, etc.
│   │   └── work_order/        # Work order forms and control sections
│   │       └── control_sections/
│   ├── theme/
│   │   └── ThemeContext.tsx   # ThemeProvider, useTheme hook, light/dark palettes
│   ├── types/                 # Shared TypeScript interfaces
│   └── utils/
│       ├── StorageService.ts  # AsyncStorage wrapper (get/set/remove)
│       └── AuthEventEmitter.ts# Event emitter for global logout on token expiry
├── android/                   # Android native build files
├── __tests__/App.test.tsx     # Basic render test
├── .github/workflows/build-apk.yml
├── package.json
├── tsconfig.json
├── metro.config.js            # Adds PDF to asset extensions
├── babel.config.js
├── jest.config.js
└── .eslintrc.js / .prettierrc.js
```

## Development Commands

```bash
# Start Metro bundler (iOS/Android development)
npm start

# Run on Android emulator/device
npm run android

# Run linter
npm run lint

# Run tests
npm test
```

## Building the Android APK

```bash
# Bundle JS assets
react-native bundle --platform android --dev false --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Build debug APK
cd android && ./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

GitHub Actions builds the APK on every push to `master` and on manual trigger (`.github/workflows/build-apk.yml`).

## API Client

**File:** `src/api/client.ts`

- **Base URL:** `http://192.168.1.103:8000` (local dev). A production URL `https://api.raptortr.com` is commented out.
- All requests include `Authorization: Bearer <token>` header (read from AsyncStorage).
- 30-second timeout via `AbortController`.
- On **401** (excluding `/auth/*` endpoints), the client clears storage and emits a logout event via `authEventEmitter`.

**API object methods:**

```typescript
api.get<T>(path)
api.post<T>(path, body)
api.patch<T>(path, body)
api.del<T>(path)
api.upload<T>(path, { uri, name, type })   // multipart/form-data
```

> **Important:** When changing the backend URL for production, update `BASE_URL` in `src/api/client.ts`.

## Authentication & Navigation Flow

1. App starts → `AppNavigator` reads `userToken` from AsyncStorage.
2. If token exists → load `currentUser.role` → route to `AdminTabNavigator` or `EmployeeTabNavigator`.
3. If no token → route to auth stack (Login, Register, SimpleRegister, EmailVerification).
4. On any non-auth 401 → `authEventEmitter.emitLogout()` → `AppNavigator` resets to login.

**AsyncStorage keys:**
- `userToken` — JWT access token
- `currentUser` — `{ id, email, full_name, role }` object
- `userEmail` — user's email address
- `themeMode` — `'light' | 'dark' | 'auto'`

## Theme System

**File:** `src/theme/ThemeContext.tsx`

- Provides `ThemeProvider` and `useTheme()` hook.
- Theme persists to AsyncStorage (`themeMode`).
- Modes: `'light'` | `'dark'` | `'auto'` (follows system preference).
- Always access colors via `useTheme().theme.colors` — never hardcode color values.

## Naming Conventions

| Item | Convention |
|---|---|
| React components | PascalCase (`WorkOrdersScreen`) |
| Screen files | `{Name}Screen.tsx` |
| API modules | camelCase file name (`workOrders.ts`) |
| API response types | `{Entity}Out` (e.g., `WorkOrderOut`) |
| API request types | `{Entity}Create` / `{Entity}Update` |
| Utilities/services | PascalCase class/object name, camelCase file |
| Constants | UPPER_SNAKE_CASE |

## TypeScript Conventions

- Strict mode enabled — avoid `any` where possible.
- Use `React.FC<Props>` for functional components with props.
- Type all API response shapes in `src/types/`.
- Generic API calls: `api.get<WorkOrderOut[]>('/work_orders/')`.

## Code Style

Enforced by ESLint + Prettier:
- Single quotes
- Trailing commas on all multi-line structures
- Arrow functions without parens for single params
- Extends `@react-native` ESLint config

Run `npm run lint` before committing. The CI build does **not** currently enforce lint.

## Adding a New Screen

1. Create the file in the appropriate `src/screens/` subdirectory (e.g., `src/screens/company/NewFeatureScreen.tsx`).
2. Import and add a `<Stack.Screen>` entry in `src/navigation/AppNavigator.tsx`.
3. If tab-level, also update `AdminTabNavigator.tsx` or `EmployeeTabNavigator.tsx`.
4. Add a TypeScript type for the new route params in the navigator's param list type.

## Adding a New API Module

1. Create `src/api/{resource}.ts` using `api.get/post/patch/del` from `client.ts`.
2. Define input/output types in `src/types/` or inline.
3. Export a default object with named methods.
4. Import and use in screen components.

## Testing

- **Framework:** Jest 29 with `react-native` preset.
- **Location:** `__tests__/` at project root.
- **Current coverage:** Minimal — only `App.test.tsx` (smoke render test).
- When adding features, add corresponding tests in `__tests__/`.

```bash
npm test
```

## CI/CD

**File:** `.github/workflows/build-apk.yml`

- Triggers: push to `master`, manual `workflow_dispatch`.
- Steps: Node 18 → Java 17 (Temurin) → npm install → Android SDK → JS bundle → Gradle build.
- Artifact: `raptor-debug` (the debug APK).

## Known Configuration Notes

- **API Base URL is hardcoded** in `src/api/client.ts`. For production, consider environment-variable injection via `react-native-config` or a build-time constant.
- **App is registered as `Raptor`** (not `Raporix`) in `index.js` and `app.json`.
- **Metro config** adds `pdf` to asset extensions to support PDF bundling.
- **Some comments and variable names are in Turkish** — this is intentional; maintain Turkish for existing patterns unless the team changes the policy.
- **Android compileSdk** is 36 (most recent update per git history).

## Role-Based Feature Matrix

| Feature | Admin | Employee |
|---|---|---|
| View/manage company info | ✓ | — |
| Manage employees | ✓ | — |
| Manage equipment | ✓ | — |
| Manage certificates | ✓ | — |
| Create/edit work orders | ✓ | — |
| View assigned work orders | ✓ | ✓ |
| Fill inspection forms | ✓ | ✓ |
| View/generate reports | ✓ | ✓ |
| Edit profile / change password | ✓ | ✓ |
| Submit feedback | ✓ | ✓ |
