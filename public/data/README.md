# Data Directory

This directory contains localized content for the application.

## Structure

```
data/
├── sk.json          # Slovak translations
├── en.json          # English translations
└── previewTemplates/
    ├── python.js    # Python execution template (Pyodide)
    ├── sqlite.js    # SQLite execution template
    ├── web.js       # HTML/CSS/JS preview template
    └── uml.js       # UML/Mermaid diagram template
```

## Preview Templates

Preview templates are JavaScript files that generate the content for challenge preview iframes.
They handle:
- Code execution environments (Python via Pyodide, SQL via sqlite)
- Live preview rendering (HTML/CSS/JS)
- Diagram rendering (Mermaid for UML)

The templates from old/data/previewTemplates/ can be copied here and reused as-is.
