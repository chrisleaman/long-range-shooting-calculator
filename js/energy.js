// ============================================
// Bullet Kinetic Energy tab functions
// ============================================
function calculateEnergy() {
    let weight = parseFloat(document.getElementById('bullet-weight').value) || 0;
    const weightUnit = document.getElementById('weight-unit-energy').value;
    let velocity = parseFloat(document.getElementById('muzzle-velocity').value) || 0;
    const velocityUnit = document.getElementById('velocity-unit').value;

    // Convert weight to grains if in grams
    let weightGrains = weight;
    if (weightUnit === 'grams') {
        weightGrains = weight * GRAINS_PER_GRAM;
    }

    // Convert velocity to fps if in m/s
    let velocityFps = velocity;
    if (velocityUnit === 'mps') {
        velocityFps = velocity * FPS_PER_MPS;
    }

    // Calculate energy in ft·lbf: E = (m * v²) / 450,436.686
    const energyFtLbf = (weightGrains * velocityFps * velocityFps) / ENERGY_CONSTANT;
    const energyJoules = energyFtLbf * JOULES_PER_FTLBF;

    // Update display
    document.getElementById('energy-ftlbf').textContent = formatNumber(energyFtLbf, 0) + ' ft\u00b7lbf';
    document.getElementById('energy-joules').textContent = formatNumber(energyJoules, 0) + ' J';
}

// Initialise
calculateEnergy();
