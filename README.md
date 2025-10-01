# Poznámkovač Coding

A browser-based interactive learning platform for coding challenges with built-in code execution, testing, and visualization support.

## Features

- ✅ **Multi-language support** - Course content in Slovak and English
- ✅ **Code challenges** - Python and Web (HTML/CSS/JS) with in-browser execution
- ✅ **Quiz challenges** - Multiple choice, checkboxes, and text input questions
- ✅ **Live code execution** - Python via Pyodide (WebAssembly), Web via sandboxed iframes
- ✅ **Matplotlib visualization** - Interactive plots rendered directly in browser
- ✅ **Persistent progress** - Scores and code saved locally with IndexedDB
- ✅ **Monaco editor** - Professional code editing experience (VS Code engine)
- ✅ **Auto-reload** - Smart code re-execution on blur (not every keystroke)
- ✅ **Virtual file system** - Multi-file editing with add/remove/rename support
- ✅ **Nested course structure** - Courses, subcourses, and challenges auto-discovered from filesystem

## Supported Challenge Types

### Code Challenges

**Python:**

- Executes in browser via Pyodide 0.28.3 (no server required)
- Full matplotlib support with interactive plots (webagg backend)
- Packages: numpy, pandas, matplotlib, seaborn
- Unit testing with Python's unittest framework

**Web (HTML/CSS/JS):**

- Live preview in sandboxed iframe
- Relative file imports automatically inlined
- CSS and JavaScript resources bundled from virtual filesystem

### Quiz Challenges

- **Radio** - Single choice questions
- **Checkbox** - Multiple choice questions
- **Input** - Text answers with case/diacritic sensitivity options

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` to see the platform.

## Project Structure

```
public/{lang}/data/     # Course content (lang: sk, en)
├── python/
│   └── beginner/
│       ├── 1/
│       │   ├── assignment.json
│       │   ├── main.py
│       │   └── test.py
│       └── course.json (optional)
├── web-basics/
└── quiz-examples/

src/
├── components/         # Vue components (CodeEditor, CodeChallenge, etc.)
├── services/           # Business logic (code runners, storage, VFS)
├── pages/              # Route pages
└── stores/             # Pinia state (i18n)

scripts/
└── generate-course-index.js  # Auto-generates course catalog
```

## How It Works

### Course Discovery

No manual `categories.json` needed. The build script scans the filesystem:

```
public/{lang}/data/
├── python/              # Course category
│   ├── beginner/        # Subcourse (has numeric folders 1, 2, 3...)
│   │   ├── 1/           # Challenge (has assignment.json)
│   │   ├── 2/
│   │   └── course.json  # Optional: override title/description
│   └── advanced/
└── web-basics/          # Direct course (no subcourses)
    ├── 1/
    └── 2/
```

**Detection logic:**

- Numeric folder (1, 2, 3...) + `assignment.json` = challenge
- Folder with numeric subfolders = course with challenges
- Folder with other subfolders = course category

**Result:** Auto-generated `public/index.json` catalog on every build.

### Code Execution

**Python (Pyodide):**

1. Lazy-load Pyodide (20MB+) on first Python challenge
2. Parse `requirements.txt` and install packages
3. Execute code in isolated environment
4. Capture stdout/stderr and matplotlib plots
5. Minimal cleanup between runs (just `plt.close('all')`)

**Web (Sandboxed Iframe):**

1. Inline all relative CSS/JS files from virtual filesystem
2. Generate complete HTML document
3. Execute in `<iframe sandbox="allow-scripts">` for security

### Virtual File System

Event-driven architecture with IndexedDB persistence:

```typescript
// File change triggers autoreload
window.dispatchEvent(new CustomEvent("vfs-event", {
  detail: { type: "file-change", filename, content, autoreload }
}))

// Smart autoreload: only on blur, not every keystroke
if (editorHasFocus) {
  pendingAutoReload = true;  // Defer
} else {
  runCode();
}
```

**Storage keys:**

```
challenge_{lang}_{coursePath}_{challengeId}_score
challenge_{lang}_{coursePath}_{challengeId}_{filename}
```

### Monaco Editor Optimization

**Problem:** Creating new Monaco instances takes 300ms+

**Solution:** Singleton pattern - reuse editor across files in same challenge

```typescript
// Global shared instance
let sharedEditor: monaco.editor.IStandaloneCodeEditor | null = null;

// Switching files: just change the model (fast)
monaco.editor.setModelLanguage(model, newLanguage);

// Switching challenges: dispose and recreate (only when needed)
```

## Creating Challenges

### 1. Code Challenge (Python)

Create `public/sk/data/python/beginner/5/`:

**assignment.json:**

```json
{
  "type": "code",
  "title": "Fibonacci Numbers",
  "assignment": "Write a function that returns the nth Fibonacci number.",
  "maxScore": 10,
  "mainFile": "main.py",
  "files": [
    { "filename": "main.py", "readonly": false, "hidden": false },
    { "filename": "test.py", "readonly": true, "hidden": false },
    { "filename": "requirements.txt", "readonly": true, "hidden": true }
  ]
}
```

**main.py:**

```python
def fibonacci(n):
    # Your code here
    pass
```

**test.py:**

```python
import unittest
from main import fibonacci

class TestFibonacci(unittest.TestCase):
    def test_base_cases(self):
        self.assertEqual(fibonacci(0), 0)
        self.assertEqual(fibonacci(1), 1)

    def test_recursive_case(self):
        self.assertEqual(fibonacci(10), 55)
```

**requirements.txt:**

```
# No external packages needed
```

### 2. Quiz Challenge

Create `public/sk/data/quiz-examples/5/`:

**assignment.json:**

```json
{
  "type": "quiz",
  "title": "Python Basics",
  "assignment": "What is the output of `print(2 ** 3)`?",
  "maxScore": 10,
  "answer": {
    "type": "input",
    "correctAnswer": "8",
    "caseSensitive": false,
    "placeholder": "Enter number"
  }
}
```

### 3. Rebuild Course Index

```bash
npm run generate-course-index
```

This scans all `public/{lang}/data/` folders and updates `public/index.json`.

## Development

### Adding a Language

1. Create folder structure:

   ```
   public/cs/data/
   public/locales/cs.json
   ```

2. Update `scripts/generate-course-index.js`:

   ```javascript
   const languages = ['sk', 'en', 'cs'];
   ```

3. Rebuild:

   ```bash
   npm run generate-course-index
   ```

### Technical Highlights

**Why Pyodide 0.28.3?**

- Ships with webagg backend for matplotlib (not matplotlib-pyodide)
- Just works™ - no complex backend configuration needed
- Minimal cleanup: `plt.close('all')` is sufficient

**Why Options API (not Composition API)?**

- Better TypeScript inference for `this` context
- Clearer separation of concerns (data, computed, methods)
- Easier to migrate from class components

**Why IndexedDB (not localStorage)?**

- No 5MB storage limit
- Async API (non-blocking)
- Can store binary data (future: images, PDFs)

**Why hash router (not history mode)?**

- Works on any static host (GitHub Pages, S3, etc.)
- No server-side configuration needed
- Simpler deployment

## Performance

- **First load:** ~2s (Vite dev server)
- **Python initialization:** ~3s (Pyodide download, only once)
- **Editor switch:** <50ms (model swap, not recreation)
- **Code execution:** <500ms (Python), <100ms (Web)
- **Offline after first visit:** Full functionality via IndexedDB cache

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 15.4+ ✅ (requires SharedArrayBuffer for Pyodide)
- Edge 90+ ✅

**Note:** Safari requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers for Pyodide. Use a proper web server in production, not `file://`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed architecture documentation, including:

- Virtual file system internals
- Code runner registry pattern
- Monaco editor singleton implementation
- Pyodide optimization strategies
- IndexedDB schema design

## License

MIT

## Credits

Built with modern web technologies:

- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [Pyodide](https://pyodide.org/) - Python in WebAssembly
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor engine
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
