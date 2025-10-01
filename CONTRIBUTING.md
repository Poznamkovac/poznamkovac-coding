# Contributing to Poznámkovač Coding

Technical documentation for developers working on the platform.

## Architecture Overview

### Tech Stack

- **Vue 3** (Options API)
- **Pinia** for global state
- **Vue Router**
- **TypeScript** with strict mode
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing (shared instance pattern)
- **IndexedDB** (via `idb`) for local persistence
- **Pyodide 0.28.3** for Python execution in browser

### Project Structure

```plaintext
src/
├── components/       # Vue components (Options API)
├── layouts/          # Layout wrappers (Default, Embed)
├── pages/            # Route components
├── router/           # Route configuration
├── services/         # Business logic (singleton pattern)
├── stores/           # Pinia stores (i18n only)
├── types/            # TypeScript definitions
└── utils/            # Pure utility functions

public/
├── {lang}/data/      # Course content by language
│   ├── {course}/
│   │   └── {id}/
│   │       ├── assignment.json
│   │       ├── *.py, *.html, etc.
│   │       └── test.py (optional)
│   └── course.json (optional metadata)
├── locales/          # UI translations
└── index.json        # Auto-generated course index
```

## Key Technical Decisions

### 1. Course Discovery (Filesystem-based)

**No `categories.json` required.** The build script (`scripts/generate-course-index.js`) scans the filesystem:

- Folders with numeric subdirectories (1, 2, 3...) = courses with challenges
- Other folders = course categories (can be nested)
- `course.json` is optional (provides title/description overrides)
- Generates `public/index.json` at build time

**Challenge detection logic:**

```javascript
// Numeric folder + assignment.json = challenge
/^\d+$/.test(folderName) && fs.existsSync('assignment.json')
```

### 2. Monaco Editor Singleton Pattern

**Problem:** Creating new Monaco instances is expensive (300ms+)

**Solution:** Shared editor instance per challenge

```typescript
// Global shared instance
let sharedEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let currentChallengeKey: string | null = null;

// Reuse editor when switching files in same challenge
// Dispose and recreate when switching challenges
if (sharedEditor && currentChallengeKey !== this.challengeKey) {
  sharedEditor.dispose();
  sharedEditor = null;
}
```

**Key insight:** Only one editor exists at a time. Switching files just changes the model, not the editor instance.

### 3. Virtual File System with IndexedDB

**Custom event-based synchronization:**

```typescript
window.dispatchEvent(new CustomEvent<FileSystemEvent>("vfs-event", {
  detail: { type: "file-change", filename, content, autoreload }
}))
```

**Autoreload optimization:** Only reloads when editor loses focus (not on every keystroke)

```typescript
if (this.editorHasFocus) {
  this.pendingAutoReload = true; // Defer until blur
} else {
  this.runCode();
}
```

**Cache-busting on reset:**

```typescript
const cacheBuster = `?t=${Date.now()}`;
fetch(`${url}${cacheBuster}`, { cache: 'no-store' })
```

### 4. Code Runners (Registry Pattern)

**Singleton registry with lazy initialization:**

```typescript
class CodeRunnerRegistry {
  async getOrInitializeRunner(language: string) {
    const runner = this.runners.get(language);
    if (runner && !runner.isInitialized()) {
      await runner.initialize(); // Pyodide loads here (slow)
    }
    return runner;
  }
}
```

**Python Runner (Pyodide 0.28.3):**

- Uses `webagg` backend for matplotlib (not `matplotlib-pyodide`)
- Minimal cleanup: just `plt.close('all')` between runs
- Keeps heavy packages loaded (numpy, matplotlib, pandas) to avoid reload warnings
- Suppresses all matplotlib warnings with `warnings.filterwarnings('ignore')`

**Web Runner:**

- Inlines relative CSS/JS files into HTML
- Executes in sandboxed iframe with `srcdoc`

### 5. I18n Strategy

**Language resolution priority:**

1. URL param: `?lang=sk`
2. localStorage: `language`
3. Browser: `navigator.language` (first 2 chars)
4. Default: `"en"`

**Content loading:**

```plaintext
/{lang}/data/{coursePath}/{challengeId}/{filename}
```

**Translation keys:**

- UI: `/public/locales/{lang}.json`
- Challenges: per-file in `/public/{lang}/data/`

### 6. IndexedDB Schema

**Database:** `coding-challenges-db`

**Stores:**

- `challenge-scores` - Score tracking per challenge
- `editor-code` - File content persistence
- `file-system-structure` - Custom file list (user-added files)

**Key patterns:**

```typescript
// Score
`challenge_${lang}_${coursePath}_${challengeId}_score`

// File content
`challenge_${lang}_${coursePath}_${challengeId}_${filename}`

// File structure
`challenge_${lang}_${coursePath}_${challengeId}_structure`
```

## Challenge System

### Assignment JSON Format

```json
{
  "type": "code" | "quiz",
  "title": "Challenge title",
  "assignment": "Instructions (markdown supported)",
  "maxScore": 10,
  "mainFile": "main.py",
  "files": [
    {
      "filename": "main.py",
      "readonly": false,
      "hidden": false,
      "autoreload": false,
      "removable": true
    }
  ],
  "answer": { /* quiz only */ }
}
```

### Quiz Answer Types

**Radio (single choice):**

```json
{
  "type": "radio",
  "options": [
    { "id": "a", "text": "Option A", "correct": true }
  ]
}
```

**Checkbox (multiple choice):**

```json
{
  "type": "checkbox",
  "options": [
    { "id": "a", "text": "Option A", "correct": true },
    { "id": "b", "text": "Option B", "correct": true }
  ]
}
```

**Input (text answer):**

```json
{
  "type": "input",
  "correctAnswer": "42",
  "caseSensitive": false,
  "diacriticSensitive": false,
  "placeholder": "Enter answer"
}
```

### Test Runner

**Python tests:**

- File must be named `test.py`
- Uses Python's `unittest` framework
- Captures stdout/stderr and test results
- Score calculated from passed/total tests

**Web tests:**

- Not yet implemented (old React version had custom test framework)

## Component Patterns

### Options API Structure

```vue
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ComponentName",

  props: {
    propName: { type: String, required: true }
  },

  emits: ["event-name"],

  data() {
    return {
      localState: ""
    };
  },

  computed: {
    derivedValue(): string {
      return this.propName.toUpperCase();
    }
  },

  watch: {
    propName(newVal) {
      // React to prop changes
    }
  },

  async mounted() {
    // Lifecycle hook
  },

  methods: {
    handleClick() {
      this.$emit("event-name", data);
    }
  }
});
</script>
```

### TypeScript Gotchas

**Problem:** `this` context in Options API

```typescript
// ❌ Wrong - 'this' is not bound
const handler = () => this.someMethod();

// ✅ Correct - use method shorthand
methods: {
  handler() {
    this.someMethod();
  }
}
```

**Problem:** Type inference with `ref`

```typescript
// ❌ Type widening
const fileSystem = ref(null); // ref<null>

// ✅ Explicit type
const fileSystem = ref<VirtualFileSystem | null>(null);
```

## Development Workflow

### Running Locally

```bash
npm install
npm run dev  # Runs generate-course-index + vite
```

### Building for Production

```bash
npm run build    # generate-course-index + tsc + vite build
npm run preview  # Test production build
```

### Code Quality

```bash
npm run lint     # ESLint
npm run format   # Prettier (via bun)
```

### Adding a New Challenge

1. Create folder: `public/{lang}/data/{course}/{id}/`
2. Add `assignment.json`
3. Add challenge files (`main.py`, `test.py`, etc.)
4. Run `npm run generate-course-index`
5. Test in dev server

### Adding a New Language

1. Create `public/{lang}/data/` folder structure
2. Add `public/locales/{lang}.json` for UI translations
3. Update `languages` array in `generate-course-index.js`
4. Rebuild course index

## Performance Optimizations

### 1. Lazy Pyodide Initialization

- Only loads when first Python challenge is executed
- 20MB+ download, avoided until needed

### 2. Monaco Editor Reuse

- Shared instance across files in same challenge
- Avoids 300ms+ recreation overhead

### 3. IndexedDB for Offline Support

- All user code persisted locally
- Works without internet after first load

### 4. Module Caching in Pyodide

- Heavy packages (numpy, matplotlib) stay loaded between runs
- Avoids "module reloaded" warnings

### 5. Split View with Resizable Panels

- Prevents unnecessary re-renders
- Debounced resize handler (50ms)

## Known Issues & Workarounds

### Matplotlib Plot Re-rendering

**Problem:** Plots don't render on second run
**Solution:** Just call `plt.close('all')` in cleanup (webagg handles the rest)

### Monaco Editor Focus State

**Problem:** Can't detect editor blur/focus natively
**Solution:** Use `onDidFocusEditorText()` / `onDidBlurEditorText()` events

### Pyodide Font Warnings

**Problem:** Matplotlib shows font cache warnings
**Solution:** Suppress with `warnings.filterwarnings('ignore')`

### Cache-Busting for Reset

**Problem:** Browser caches old file versions
**Solution:** Append `?t=${Date.now()}` + `cache: 'no-store'`

## Future Improvements

### Planned Features

- [ ] Embed mode for external sites (partially implemented)
- [ ] Custom challenge creator UI
- [ ] More language runners (SQL, C++, Rust)
- [ ] Collaborative editing (WebRTC)
- [ ] Achievement system

### Refactoring Opportunities

- [ ] Extract matplotlib styling to separate file
- [ ] Create unified test runner interface
- [ ] Add WebWorker for Pyodide (avoid blocking UI)
- [ ] Implement virtual file system as Pinia store
- [ ] Add challenge progress tracking

## Debugging Tips

### Vue Devtools

- Install Vue Devtools browser extension
- Inspect component state, events, Pinia stores

### Monaco Editor

```javascript
// Access global editor instance in console
window.sharedEditor = sharedEditor; // Add during dev
```

### Pyodide

```javascript
// Expose Pyodide instance
window.pyodide = this.pyodide; // In pythonRunner.ts
```

### Virtual File System Events

```javascript
// Listen to all VFS events
window.addEventListener('vfs-event', (e) => console.log(e.detail));
```

## Migration from Old React Version

Key differences from `/old` directory:

- Options API instead of Composition API
- No `categories.json` (filesystem-based discovery)
- Simplified test runner (no custom test framework yet)
- Monaco singleton pattern (new optimization)
- Pyodide 0.28.3 with webagg backend (was matplotlib-pyodide)
