# Contributing to Poznámkovač Coding

This document outlines the architecture and design decisions for the Vue-based e-learning platform.

## Architecture Overview

### Tech Stack
- **Vue 3** with Composition API (`<script setup>`)
- **Pinia** for state management
- **Vue Router** (hash mode) for routing
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **IndexedDB** (via idb) for local persistence

### Project Structure
```
src/
├── components/       # Reusable UI components
├── composables/      # Vue composables (like React hooks)
├── layouts/          # Page layout wrappers
├── pages/            # Route components
├── router/           # Router configuration
├── services/         # Business logic (storage, API)
├── stores/           # Pinia stores
├── types/            # TypeScript type definitions
└── utils/            # Pure utility functions
```

## Key Design Decisions

### Course Discovery (No categories.json)
- Courses are discovered by scanning the `challenges/` folder structure
- Folder names = course titles (e.g., "Python", "Web Development")
- URLs use slugified versions (e.g., `/challenges/web-development`)
- Course colors derived from slug hash (deterministic, same slug = same color)

### Routing Strategy
Uses intelligent route parsing:
- `/challenges/python` → CoursePage (list of subcourses/challenges)
- `/challenges/python/1` → ChallengePage (numeric = challenge)
- `/challenges/python/basics/1` → nested course structure

Implemented in `parseUrlPath()` utility.

### State Management
**Pinia Stores:**
- `i18n` - Language selection, translations, localized URLs

**Why Pinia over events?**
- Cleaner than window events for reactive data
- Better TypeScript support
- Easier to test and debug

**Services (not stores):**
- `storage.ts` - IndexedDB operations (pure async functions)
- Singleton pattern for shared instances

### Internationalization (i18n)
**Priority chain:**
1. URL parameter (`?lang=sk`)
2. localStorage (`language`)
3. Browser language (navigator.language)
4. Default: "auto" → resolves to browser lang

**Translation files:** `/public/data/{lang}.json`

**URL localization:** Challenge files fetched from `/public/data/{lang}/challenges/...`

### Data Persistence
**IndexedDB storage keys:**
```
challenge_{lang}_{coursePath}_{challengeId}_score
challenge_{lang}_{coursePath}_{challengeId}_{filename}
```

**Note:** Changed from old `uloha_` prefix to `challenge_` prefix.

## Coding Style

### Component Structure
```vue
<script setup lang="ts">
// Imports
// Composables
// Reactive state
// Computed properties
// Functions
// Lifecycle hooks
</script>

<template>
  <!-- Template here -->
</template>
```

### Naming Conventions
- **Components:** PascalCase (e.g., `CourseCard.vue`)
- **Composables:** camelCase with `use` prefix (e.g., `useI18n.ts`)
- **Functions:** camelCase
- **Types/Interfaces:** PascalCase
- **CSS classes:** Tailwind utilities (lowercase with hyphens)

### TypeScript Usage
- **Strict mode enabled**
- Define props: `defineProps<{ course: Course }>()`
- Define emits: `defineEmits<{ submit: [value: string] }>()`
- Explicit return types on complex functions
- Use `type` for unions, `interface` for object shapes

### Reactivity Patterns
```typescript
// Reactive primitives
const count = ref(0)
const user = ref<User | null>(null)

// Reactive objects (prefer ref for better TypeScript)
const state = ref({ name: '', age: 0 })

// Computed
const doubled = computed(() => count.value * 2)

// Watch
watch(() => route.params.id, (newId) => {
  loadData(newId)
})
```

## Challenge System

### Assignment Files
Each challenge folder contains:
- `assignment.json` - Metadata, file list, preview settings
- `files/` - Initial code files shown to user
- `solution/` - Solution code (shown after failures)
- `tests.js` - ES module exporting test class

### Test File Structure
```javascript
export default class Tester {
  constructor() {}
  
  setPreviewWindow(window) {
    this.previewWindow = window;
  }
  
  async test_someName() {
    // Test logic
    return { 
      score: 10,
      details_ok: "Success message",
      details_wrong: "Error message"
    };
  }
}
```

**Test method naming:** Must start with `test_`

### Preview Templates
Located in `/public/data/previewTemplates/{category}.js`

**Purpose:** Generate iframe content for challenge previews

**Examples:**
- `python.js` - Pyodide integration
- `web.js` - HTML/CSS/JS live preview
- `sqlite.js` - SQL execution
- `uml.js` - Mermaid diagram rendering

**Communication:** Uses `window.postMessage()` to signal readiness

## Future Improvements

### Challenge Definition Language
Consider creating a simplified markup for defining challenges that supports:
- Multiple question types (coding, quiz, checkbox, radio)
- Inline vs file-based code snippets
- Rich text formatting for assignments
- Auto-generated test scaffolding

### Virtual File System
Port the old `virtualFileSystemService.ts` to work with Vue reactivity for:
- In-memory file management
- Active file tracking
- Auto-save to IndexedDB
- Change notifications

### Monaco Editor Integration
Will need:
- Language detection from file extension
- Emmet support for HTML/CSS
- Read-only file support
- Tab management for multiple files

## Development Workflow

### Running locally
```bash
npm install
npm run dev
```

### Building for production
```bash
npm run build
npm run preview
```

### Code quality
```bash
npm run lint        # ESLint
npm run format      # Prettier
```

## Migration from React

### Component Mapping
| React | Vue |
|-------|-----|
| `useState` | `ref` |
| `useEffect` | `watch`, `onMounted`, etc. |
| `useMemo` | `computed` |
| `useCallback` | Not needed (functions are stable) |
| `useRef` | `ref` (template refs use `ref` attribute) |
| `useContext` | `inject` or Pinia store |
| Custom hooks | Composables |

### Key Differences
- Vue is **reactive by default** (no manual dependency arrays)
- Template syntax instead of JSX
- `v-if`, `v-for`, `v-bind`, `v-on` directives
- **Two-way binding** with `v-model`
- **Scoped slots** for flexible component composition
