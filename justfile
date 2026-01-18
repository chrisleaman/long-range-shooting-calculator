# Long Range Shooting Calculator - Task Runner
# https://github.com/casey/just

# Default recipe: show available commands
default:
    @just --list

# Run the ES to MR simulation (generates es_to_mr_table.js)
simulate:
    uv run simulate_es_mr.py

# Run simulation with custom number of simulations (e.g., just simulate-custom 100000)
simulate-custom n_sims:
    uv run simulate_es_mr.py --simulations {{n_sims}}

# Quick test run with fewer simulations (for development)
simulate-quick:
    @echo "Running quick simulation with 10,000 groups per sample size..."
    @python -c "import simulate_es_mr; simulate_es_mr.n_simulations = 10000; simulate_es_mr.main()" 2>/dev/null || uv run python -c "exec(open('simulate_es_mr.py').read().replace('1_000_000', '10_000'))"

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
    rm -f es_to_mr_table.js
