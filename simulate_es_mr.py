#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "numpy",
# ]
# ///
"""
Simulate the relationship between Extreme Spread (ES) and Mean Radius (MR)
for shot groups of varying sizes.

Statistical Background (from Ballistipedia/ShotStat):
- Shots follow a bivariate normal distribution with σ in x and y directions
- Radial distance from center follows a Rayleigh distribution with parameter σ
- Extreme Spread (ES) = max distance between any two shots in a group
- Mean Radius (MR) = average distance from group center to each shot

Key Insight:
Both ES and MR scale linearly with σ, so the ratio MR/ES is scale-invariant.
This means we simulate once per group size (n_shots) with σ=1, compute the
MR/ES ratio distribution, then scale for any target ES value.

For a target ES=X:
  MR_percentile = X * (MR/ES)_percentile

This is mathematically equivalent to running Monte Carlo for each (ES, n) cell
but far more efficient.

Output: JavaScript object for copy-paste into index.html
"""

import json
import sys
from typing import Dict, Tuple

import numpy as np


def simulate_groups(
    n_shots: int,
    n_simulations: int = 1_000_000,
    seed: int = 42,
    batch_size: int = 50_000,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Simulate n_simulations groups of n_shots each.

    Uses bivariate normal distribution with σ=1 for both x and y coordinates.

    Returns:
        Tuple of (extreme_spreads, mean_radii) arrays, each of length n_simulations
    """
    # Use different seed per n_shots for variety across sample sizes
    rng = np.random.default_rng(seed + n_shots)

    all_es = []
    all_mr = []

    n_batches = (n_simulations + batch_size - 1) // batch_size

    for batch_idx in range(n_batches):
        batch_start = batch_idx * batch_size
        batch_end = min(batch_start + batch_size, n_simulations)
        batch_n = batch_end - batch_start

        # Generate shots: shape (batch_n, n_shots, 2) for x,y coordinates
        shots = rng.standard_normal((batch_n, n_shots, 2))

        # Calculate center of impact (COI) for each group
        centers = shots.mean(axis=1, keepdims=True)  # shape (batch_n, 1, 2)

        # Distance from center for each shot
        distances_from_center = np.sqrt(
            ((shots - centers) ** 2).sum(axis=2)
        )  # (batch_n, n_shots)

        # Mean radius = average distance from center
        mean_radii = distances_from_center.mean(axis=1)  # (batch_n,)
        all_mr.append(mean_radii)

        # Extreme spread = max pairwise distance between any two shots
        # Vectorized computation of all pairwise distances within each group
        shots_i = shots[:, :, np.newaxis, :]  # (batch_n, n_shots, 1, 2)
        shots_j = shots[:, np.newaxis, :, :]  # (batch_n, 1, n_shots, 2)
        diff = shots_i - shots_j  # (batch_n, n_shots, n_shots, 2)
        pairwise_dist = np.sqrt((diff**2).sum(axis=3))  # (batch_n, n_shots, n_shots)
        extreme_spreads = pairwise_dist.max(axis=(1, 2))  # (batch_n,)
        all_es.append(extreme_spreads)

    return np.concatenate(all_es), np.concatenate(all_mr)


def compute_ratio_percentiles(
    n_shots: int, n_simulations: int = 1_000_000
) -> Tuple[float, float, float]:
    """
    Compute the 5th, 50th, and 95th percentiles of the MR/ES ratio
    for groups of n_shots.

    Returns:
        Tuple of (p5, p50, p95) ratio values
    """
    es, mr = simulate_groups(n_shots, n_simulations)
    ratios = mr / es

    p5 = float(np.percentile(ratios, 5))
    p50 = float(np.percentile(ratios, 50))
    p95 = float(np.percentile(ratios, 95))

    return p5, p50, p95


def generate_table(
    es_values: list[float],  # ES values in MOA
    n_shots_range: range,  # Range of shot counts
    n_simulations: int = 1_000_000,
) -> Dict:
    """
    Generate the complete lookup table.

    Returns a dict structure organized for HTML table rendering:
    {
        "0.1": { "3": [p5, p50, p95], "4": [p5, p50, p95], ... },
        "0.2": { "3": [p5, p50, p95], "4": [p5, p50, p95], ... },
        ...
    }
    Where p5, p50, p95 are the 5th, 50th, 95th percentiles of Mean Radius in MOA.
    """
    # First, compute ratio percentiles for each n_shots value
    print("Computing MR/ES ratio distributions...")
    ratio_percentiles = {}
    total_n = len(n_shots_range)

    for idx, n in enumerate(n_shots_range):
        print(
            f"  [{idx + 1}/{total_n}] Simulating n={n} shots ({n_simulations:,} groups)...",
            end="",
            flush=True,
        )
        ratio_percentiles[n] = compute_ratio_percentiles(n, n_simulations)
        p5, p50, p95 = ratio_percentiles[n]
        print(f" ratios: p5={p5:.4f}, p50={p50:.4f}, p95={p95:.4f}")

    # Build the table by scaling ratios for each ES value
    # Structure: table[es_str][n_str] = [mr_p5, mr_p50, mr_p95]
    print("\nBuilding lookup table...")
    table = {}

    for es in es_values:
        es_str = f"{es:.1f}"
        table[es_str] = {}

        for n in n_shots_range:
            p5_ratio, p50_ratio, p95_ratio = ratio_percentiles[n]

            # MR = ES * ratio
            mr_p5 = round(es * p5_ratio, 4)
            mr_p50 = round(es * p50_ratio, 4)
            mr_p95 = round(es * p95_ratio, 4)

            table[es_str][str(n)] = [mr_p5, mr_p50, mr_p95]

    return table


def format_as_javascript(table: Dict) -> str:
    """Format the table as a JavaScript const declaration."""
    lines = [
        "// Extreme Spread to Mean Radius lookup table",
        "// Generated by Monte Carlo simulation (1,000,000 groups per sample size)",
        "//",
        "// Structure: ES_TO_MR_TABLE[es_moa][n_shots] = [p5, p50, p95]",
        "//   - es_moa: Extreme spread in MOA (string key, e.g., '0.1', '1.0', '2.0')",
        "//   - n_shots: Number of shots in group (string key, e.g., '3', '10', '25')",
        "//   - p5: 5th percentile of mean radius (MOA) - optimistic estimate",
        "//   - p50: 50th percentile (median) of mean radius (MOA) - typical estimate",
        "//   - p95: 95th percentile of mean radius (MOA) - conservative estimate",
        "//",
        "// Statistical basis: Bivariate normal shot distribution, MR/ES ratio is scale-invariant",
        "// Reference: http://ballistipedia.com/index.php?title=Precision_Models",
        "",
    ]

    # Format as JavaScript object (not JSON) for cleaner output
    js_obj = json.dumps(table, indent=2)
    lines.append(f"const ES_TO_MR_TABLE = {js_obj};")

    return "\n".join(lines)


def main():
    # Define parameters
    es_values = [round(0.1 * i, 1) for i in range(1, 21)]  # 0.1 to 2.0 MOA
    n_shots_range = range(3, 26)  # 3 to 25 shots
    n_simulations = 1_000_000

    print("=" * 70)
    print("Extreme Spread to Mean Radius Monte Carlo Simulation")
    print("=" * 70)
    print(f"ES values:    {es_values[0]} to {es_values[-1]} MOA ({len(es_values)} rows)")
    print(
        f"Shot counts:  {n_shots_range.start} to {n_shots_range.stop - 1} ({len(n_shots_range)} columns)"
    )
    print(f"Simulations:  {n_simulations:,} groups per sample size")
    print(f"Total cells:  {len(es_values) * len(n_shots_range):,}")
    print("=" * 70)
    print()

    # Generate the table
    table = generate_table(es_values, n_shots_range, n_simulations)

    # Output as JavaScript
    js_output = format_as_javascript(table)

    # Save to file
    output_file = "es_to_mr_table.js"
    with open(output_file, "w") as f:
        f.write(js_output)

    print()
    print("=" * 70)
    print(f"Output saved to: {output_file}")
    print("=" * 70)
    print()
    print("Sample results:")
    print()
    print("  n=5 shots, ES=1.0 MOA:")
    vals = table["1.0"]["5"]
    print(f"    MR 5th percentile:  {vals[0]:.4f} MOA (optimistic)")
    print(f"    MR 50th percentile: {vals[1]:.4f} MOA (typical)")
    print(f"    MR 95th percentile: {vals[2]:.4f} MOA (conservative)")
    print()
    print("  n=10 shots, ES=0.5 MOA:")
    vals = table["0.5"]["10"]
    print(f"    MR 5th percentile:  {vals[0]:.4f} MOA")
    print(f"    MR 50th percentile: {vals[1]:.4f} MOA")
    print(f"    MR 95th percentile: {vals[2]:.4f} MOA")
    print()
    print("Copy the contents of es_to_mr_table.js into your index.html")


if __name__ == "__main__":
    main()
