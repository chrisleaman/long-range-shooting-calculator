// ============================================
// Conversions tab functions
// ============================================
function convertAngular() {
    const value = parseFloat(document.getElementById('angular-value').value) || 0;
    const from = document.getElementById('angular-from').value;
    const to = document.getElementById('angular-to').value;

    let result;
    let fromLabel = from.toUpperCase();
    let toLabel = to.toUpperCase();

    if (from === to) {
        result = value;
    } else if (from === 'moa' && to === 'mil') {
        result = value / MOA_PER_MIL;
    } else {
        result = value * MOA_PER_MIL;
    }

    document.getElementById('angular-result').innerHTML =
        `${value} ${fromLabel} = <strong>${result.toFixed(4)} ${toLabel}</strong>`;
}

function swapAngular() {
    const from = document.getElementById('angular-from');
    const to = document.getElementById('angular-to');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
    convertAngular();
}

function convertAngularToLinear() {
    const value = parseFloat(document.getElementById('ang-lin-value').value) || 0;
    const unit = document.getElementById('ang-lin-unit').value;
    const distance = parseFloat(document.getElementById('ang-lin-distance').value) || 0;
    const distUnit = document.getElementById('ang-lin-dist-unit').value;

    // Convert distance to yards for calculation
    let distanceYards = distance;
    if (distUnit === 'metres') {
        distanceYards = distance / METRES_PER_YARD;
    }

    // Calculate inches
    let inches;
    if (unit === 'moa') {
        inches = value * INCHES_PER_MOA_AT_100YD * (distanceYards / 100);
    } else {
        inches = value * INCHES_PER_MIL_AT_100YD * (distanceYards / 100);
    }

    const mm = inches * MM_PER_INCH;
    const unitLabel = unit.toUpperCase();
    const distLabel = distUnit === 'yards' ? 'yards' : 'metres';

    document.getElementById('ang-lin-result').innerHTML =
        `${value} ${unitLabel} at ${distance} ${distLabel} = <strong>${inches.toFixed(3)} inches</strong> / <strong>${mm.toFixed(2)} mm</strong>`;
}

function convertLinearToAngular() {
    const value = parseFloat(document.getElementById('lin-ang-value').value) || 0;
    const unit = document.getElementById('lin-ang-unit').value;
    const distance = parseFloat(document.getElementById('lin-ang-distance').value) || 0;
    const distUnit = document.getElementById('lin-ang-dist-unit').value;

    // Convert to inches if needed
    let inches = value;
    if (unit === 'mm') {
        inches = value / MM_PER_INCH;
    }

    // Convert distance to yards for calculation
    let distanceYards = distance;
    if (distUnit === 'metres') {
        distanceYards = distance / METRES_PER_YARD;
    }

    // Avoid division by zero
    if (distanceYards === 0) {
        document.getElementById('lin-ang-result').innerHTML = 'Enter a distance greater than zero';
        return;
    }

    // Calculate MOA and MIL
    const moa = inches / (INCHES_PER_MOA_AT_100YD * (distanceYards / 100));
    const mil = inches / (INCHES_PER_MIL_AT_100YD * (distanceYards / 100));

    const unitLabel = unit === 'inches' ? 'inch' : 'mm';
    const valueLabel = value === 1 ? unitLabel : (unit === 'inches' ? 'inches' : 'mm');
    const distLabel = distUnit === 'yards' ? 'yards' : 'metres';

    document.getElementById('lin-ang-result').innerHTML =
        `${value} ${valueLabel} at ${distance} ${distLabel} = <strong>${moa.toFixed(3)} MOA</strong> / <strong>${mil.toFixed(3)} MIL</strong>`;
}

// Initialise
convertAngular();
convertAngularToLinear();
convertLinearToAngular();
