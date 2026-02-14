// ============================================
// TOP Gun Precision tab functions
// ============================================
function calculateTOPGun() {
    let energy = parseFloat(document.getElementById('bullet-energy').value) || 0;
    const energyUnit = document.getElementById('energy-unit').value;
    let weight = parseFloat(document.getElementById('rifle-weight').value) || 0;
    const weightUnit = document.getElementById('rifle-weight-unit').value;

    // Convert energy to ft·lbf if in Joules
    let energyFtLbf = energy;
    if (energyUnit === 'joules') {
        energyFtLbf = energy * FTLBF_PER_JOULE;
    }

    // Convert weight to lbs if in kg
    let weightLbs = weight;
    if (weightUnit === 'kg') {
        weightLbs = weight * LBS_PER_KG;
    }

    // Avoid division by zero
    if (weightLbs === 0) {
        document.getElementById('precision-moa').textContent = '\u2014';
        document.getElementById('precision-mil').textContent = '\u2014';
        document.getElementById('mean-radius-in').textContent = '\u2014';
        document.getElementById('mean-radius-mm').textContent = '\u2014';
        return;
    }

    // Calculate precision (MOA) using TOP Gun formula
    const precisionMOA = energyFtLbf / TOP_GUN_CONSTANT / weightLbs;
    const precisionMIL = precisionMOA / MOA_PER_MIL;

    // Calculate mean radius
    const meanRadiusInches = precisionMOA * MEAN_RADIUS_COEFFICIENT;
    const meanRadiusMM = meanRadiusInches * MM_PER_INCH;

    // Update display
    document.getElementById('precision-moa').textContent = precisionMOA.toFixed(3) + ' MOA';
    document.getElementById('precision-mil').textContent = precisionMIL.toFixed(3) + ' MIL';
    document.getElementById('mean-radius-in').textContent = meanRadiusInches.toFixed(3) + ' inches';
    document.getElementById('mean-radius-mm').textContent = meanRadiusMM.toFixed(2) + ' mm';
}

// Initialise
calculateTOPGun();
