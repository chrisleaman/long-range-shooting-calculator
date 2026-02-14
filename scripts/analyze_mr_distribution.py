#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "numpy",
#     "matplotlib",
#     "scipy",
# ]
# ///
"""
Analyze the distribution of Mean Radius (MR) from simulated shot groups.

This script simulates shot groups and analyzes whether the Mean Radius
follows a Normal or Rayleigh distribution. It produces:
- Histograms with fitted Normal and Rayleigh overlays
- Q-Q plots for both distributions
- Goodness-of-fit statistics (Kolmogorov-Smirnov test)

Output: PNG files for each group size analyzed.
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from typing import Tuple


def simulate_groups(
    n_shots: int,
    n_simulations: int = 1_000_000,
    seed: int = 42,
    batch_size: int = 50_000,
) -> np.ndarray:
    """
    Simulate n_simulations groups of n_shots each.

    Uses bivariate normal distribution with σ=1 for both x and y coordinates.

    Returns:
        Array of mean radii, length n_simulations
    """
    rng = np.random.default_rng(seed + n_shots)

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

    return np.concatenate(all_mr)


def normalize_data(data: np.ndarray) -> np.ndarray:
    """Standardize data to have mean=0 and std=1."""
    return (data - data.mean()) / data.std()


def fit_distributions(data: np.ndarray) -> Tuple[dict, dict]:
    """
    Fit Normal and Rayleigh distributions to the data.

    Returns:
        Tuple of (normal_params, rayleigh_params) dictionaries
    """
    # Fit Normal distribution
    norm_loc, norm_scale = stats.norm.fit(data)
    normal_params = {"loc": norm_loc, "scale": norm_scale}

    # Fit Rayleigh distribution
    # Rayleigh has loc and scale parameters
    ray_loc, ray_scale = stats.rayleigh.fit(data)
    rayleigh_params = {"loc": ray_loc, "scale": ray_scale}

    return normal_params, rayleigh_params


def compute_goodness_of_fit(
    data: np.ndarray, normal_params: dict, rayleigh_params: dict
) -> dict:
    """
    Compute goodness-of-fit statistics for both distributions.

    Returns:
        Dictionary with KS test results for both distributions
    """
    # Kolmogorov-Smirnov test for Normal
    ks_norm = stats.kstest(
        data, "norm", args=(normal_params["loc"], normal_params["scale"])
    )

    # Kolmogorov-Smirnov test for Rayleigh
    ks_ray = stats.kstest(
        data, "rayleigh", args=(rayleigh_params["loc"], rayleigh_params["scale"])
    )

    return {
        "normal": {"statistic": ks_norm.statistic, "pvalue": ks_norm.pvalue},
        "rayleigh": {"statistic": ks_ray.statistic, "pvalue": ks_ray.pvalue},
    }


def create_analysis_plot(
    data: np.ndarray,
    n_shots: int,
    normal_params: dict,
    rayleigh_params: dict,
    gof_stats: dict,
    output_path: str,
) -> None:
    """
    Create a comprehensive analysis plot with histogram, Q-Q plots, and statistics.
    """
    fig, axes = plt.subplots(2, 2, figsize=(14, 12))
    fig.suptitle(
        f"Mean Radius Distribution Analysis (n={n_shots} shots, 1M simulations)",
        fontsize=14,
        fontweight="bold",
    )

    # Color scheme
    hist_color = "#4C72B0"
    normal_color = "#DD8452"
    rayleigh_color = "#55A868"

    # === Top Left: Histogram with fitted distributions ===
    ax1 = axes[0, 0]

    # Create histogram
    counts, bins, _ = ax1.hist(
        data,
        bins=100,
        density=True,
        alpha=0.7,
        color=hist_color,
        edgecolor="white",
        linewidth=0.5,
        label="Simulated MR",
    )

    # Overlay fitted distributions
    x = np.linspace(data.min(), data.max(), 500)

    # Normal PDF
    normal_pdf = stats.norm.pdf(x, normal_params["loc"], normal_params["scale"])
    ax1.plot(x, normal_pdf, color=normal_color, linewidth=2.5, label="Fitted Normal")

    # Rayleigh PDF
    rayleigh_pdf = stats.rayleigh.pdf(
        x, rayleigh_params["loc"], rayleigh_params["scale"]
    )
    ax1.plot(x, rayleigh_pdf, color=rayleigh_color, linewidth=2.5, label="Fitted Rayleigh")

    ax1.set_xlabel("Normalized Mean Radius", fontsize=11)
    ax1.set_ylabel("Probability Density", fontsize=11)
    ax1.set_title("Histogram with Fitted Distributions", fontsize=12)
    ax1.legend(loc="upper right", fontsize=10)
    ax1.grid(True, alpha=0.3)

    # === Top Right: Goodness-of-fit statistics ===
    ax2 = axes[0, 1]
    ax2.axis("off")

    stats_text = f"""
    Goodness-of-Fit Analysis
    ========================

    Sample Statistics:
    ------------------
    Mean:     {data.mean():.6f}
    Std Dev:  {data.std():.6f}
    Skewness: {stats.skew(data):.6f}
    Kurtosis: {stats.kurtosis(data):.6f}

    Fitted Normal Parameters:
    -------------------------
    μ (loc):   {normal_params['loc']:.6f}
    σ (scale): {normal_params['scale']:.6f}

    Fitted Rayleigh Parameters:
    ---------------------------
    loc:   {rayleigh_params['loc']:.6f}
    scale: {rayleigh_params['scale']:.6f}

    Kolmogorov-Smirnov Test Results:
    --------------------------------
    Normal:
      Statistic: {gof_stats['normal']['statistic']:.6f}
      P-value:   {gof_stats['normal']['pvalue']:.2e}

    Rayleigh:
      Statistic: {gof_stats['rayleigh']['statistic']:.6f}
      P-value:   {gof_stats['rayleigh']['pvalue']:.2e}

    Interpretation:
    ---------------
    Lower KS statistic = better fit
    Higher p-value = better fit (p > 0.05 suggests good fit)

    Winner: {'Normal' if gof_stats['normal']['statistic'] < gof_stats['rayleigh']['statistic'] else 'Rayleigh'}
    (based on KS statistic)
    """

    ax2.text(
        0.05,
        0.95,
        stats_text,
        transform=ax2.transAxes,
        fontsize=10,
        verticalalignment="top",
        fontfamily="monospace",
        bbox=dict(boxstyle="round", facecolor="wheat", alpha=0.5),
    )

    # === Bottom Left: Q-Q Plot for Normal ===
    ax3 = axes[1, 0]

    # Calculate theoretical quantiles for Normal
    sorted_data = np.sort(data)
    n = len(sorted_data)
    theoretical_quantiles = stats.norm.ppf(
        (np.arange(1, n + 1) - 0.5) / n, normal_params["loc"], normal_params["scale"]
    )

    # Subsample for plotting (1M points is too many)
    subsample_idx = np.linspace(0, n - 1, 1000, dtype=int)

    ax3.scatter(
        theoretical_quantiles[subsample_idx],
        sorted_data[subsample_idx],
        alpha=0.5,
        s=10,
        color=normal_color,
        label="Data vs Normal",
    )

    # Add reference line
    min_val = min(theoretical_quantiles[subsample_idx].min(), sorted_data[subsample_idx].min())
    max_val = max(theoretical_quantiles[subsample_idx].max(), sorted_data[subsample_idx].max())
    ax3.plot([min_val, max_val], [min_val, max_val], "k--", linewidth=1.5, label="Perfect fit")

    ax3.set_xlabel("Theoretical Quantiles (Normal)", fontsize=11)
    ax3.set_ylabel("Sample Quantiles", fontsize=11)
    ax3.set_title("Q-Q Plot: Normal Distribution", fontsize=12)
    ax3.legend(loc="lower right", fontsize=10)
    ax3.grid(True, alpha=0.3)

    # === Bottom Right: Q-Q Plot for Rayleigh ===
    ax4 = axes[1, 1]

    # Calculate theoretical quantiles for Rayleigh
    theoretical_quantiles_ray = stats.rayleigh.ppf(
        (np.arange(1, n + 1) - 0.5) / n,
        rayleigh_params["loc"],
        rayleigh_params["scale"],
    )

    ax4.scatter(
        theoretical_quantiles_ray[subsample_idx],
        sorted_data[subsample_idx],
        alpha=0.5,
        s=10,
        color=rayleigh_color,
        label="Data vs Rayleigh",
    )

    # Add reference line
    min_val_ray = min(theoretical_quantiles_ray[subsample_idx].min(), sorted_data[subsample_idx].min())
    max_val_ray = max(theoretical_quantiles_ray[subsample_idx].max(), sorted_data[subsample_idx].max())
    ax4.plot(
        [min_val_ray, max_val_ray],
        [min_val_ray, max_val_ray],
        "k--",
        linewidth=1.5,
        label="Perfect fit",
    )

    ax4.set_xlabel("Theoretical Quantiles (Rayleigh)", fontsize=11)
    ax4.set_ylabel("Sample Quantiles", fontsize=11)
    ax4.set_title("Q-Q Plot: Rayleigh Distribution", fontsize=12)
    ax4.legend(loc="lower right", fontsize=10)
    ax4.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close()

    print(f"  Saved: {output_path}")


def main():
    # Configuration
    group_sizes = [3, 5, 10, 20]
    n_simulations = 1_000_000

    print("=" * 70)
    print("Mean Radius Distribution Analysis")
    print("=" * 70)
    print(f"Group sizes:  {group_sizes}")
    print(f"Simulations:  {n_simulations:,} per group size")
    print("=" * 70)
    print()

    for n_shots in group_sizes:
        print(f"Analyzing n={n_shots} shots...")
        print(f"  Simulating {n_simulations:,} groups...", end="", flush=True)

        # Simulate
        mean_radii = simulate_groups(n_shots, n_simulations)
        print(" done")

        # Normalize
        print("  Normalizing data...", end="", flush=True)
        normalized_mr = normalize_data(mean_radii)
        print(" done")

        # Fit distributions
        print("  Fitting distributions...", end="", flush=True)
        normal_params, rayleigh_params = fit_distributions(normalized_mr)
        print(" done")

        # Compute goodness-of-fit
        print("  Computing goodness-of-fit statistics...", end="", flush=True)
        gof_stats = compute_goodness_of_fit(normalized_mr, normal_params, rayleigh_params)
        print(" done")

        # Create plot
        print("  Creating analysis plot...", end="", flush=True)
        output_path = f"mr_distribution_n{n_shots}.png"
        create_analysis_plot(
            normalized_mr,
            n_shots,
            normal_params,
            rayleigh_params,
            gof_stats,
            output_path,
        )

        # Print summary
        ks_norm = gof_stats["normal"]["statistic"]
        ks_ray = gof_stats["rayleigh"]["statistic"]
        winner = "Normal" if ks_norm < ks_ray else "Rayleigh"
        print(f"  KS Statistics - Normal: {ks_norm:.6f}, Rayleigh: {ks_ray:.6f}")
        print(f"  Better fit: {winner}")
        print()

    print("=" * 70)
    print("Analysis complete!")
    print("=" * 70)
    print()
    print("Output files:")
    for n in group_sizes:
        print(f"  - mr_distribution_n{n}.png")


if __name__ == "__main__":
    main()
