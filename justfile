# Long Range Shooting Calculator - Task Runner
# https://github.com/casey/just

# Default recipe: show available commands
default:
    @just --list

# Run the ES to MR simulation (generates js/es-mr-data.js)
simulate:
    uv run scripts/simulate_es_mr.py

# Open index.html in default browser (Windows)
[windows]
open:
    start index.html

# Open index.html in default browser (Unix/Mac)
[unix]
open:
    open index.html 2>/dev/null || xdg-open index.html

# Serve the calculator locally with Python's HTTP server
serve port="8000":
    python -m http.server {{port}}

# Clean generated files
clean:
    rm -f js/es-mr-data.js
