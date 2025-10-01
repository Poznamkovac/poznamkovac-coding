# Poznámkovač Coding Challenges

A Vue 3-based e-learning platform for interactive coding courses.

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

- `src/` - Application source code
- `challenges/` - Course content (folder-based structure)
- `public/data/` - Translations and preview templates
- `old/` - Previous React implementation (for reference)

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed architecture documentation.

## Features

- 📚 Nested course structure (no categories.json required)
- 🎨 Deterministic course colors from folder names
- 🌍 Multi-language support (SK/EN)
- 💾 IndexedDB persistence for progress
- 🎯 Monaco editor integration (planned)
- 🧪 Custom test framework for challenges
- 🖼️ Live preview system (Python/Web/SQL/UML)

## Development

This is a rewrite from React to Vue 3. The skeleton template is complete. Next steps:

1. Implement course discovery from `challenges/` folder
2. Port Monaco editor integration
3. Implement virtual file system
4. Port challenge test runner
5. Create challenge definition markup language

See the todos in [CONTRIBUTING.md](CONTRIBUTING.md) for implementation priorities.
