# Challenges Directory

This directory contains all course content. Each folder represents a course, and courses can be nested.

## Structure

```
challenges/
├── Python/
│   ├── Basics/
│   │   ├── 1/
│   │   │   ├── assignment.json
│   │   │   ├── files/
│   │   │   ├── solution/
│   │   │   └── tests.js
│   │   └── 2/
│   └── Advanced/
├── Web Development/
└── SQLite/
```

## Folder Naming

- Course folders: Use natural names (e.g., "Python", "Web Development")
- The folder name becomes the course title in the UI
- URL slug is automatically generated from the folder name
- Course color is derived from the sluggified name (consistent across sessions)

## Challenge Structure

Each challenge folder (numbered) must contain:
- `assignment.json` - Challenge metadata and configuration
- `files/` - Initial code files
- `solution/` (optional) - Solution files
- `tests.js` - Test suite

See old/data/ for examples of existing challenge structures.
