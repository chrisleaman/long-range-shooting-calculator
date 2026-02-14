// ============================================
// Sample Size tab functions
// ============================================

function calculateMinSampleSize(r1, r2) {
    // Ensure r2 > r1 for the formula
    const rSmall = Math.min(r1, r2);
    const rLarge = Math.max(r1, r2);

    if (rSmall === rLarge || rSmall <= 0 || rLarge <= 0) {
        return null; // Invalid or identical radii
    }

    const ratio = (rLarge + rSmall) / (rLarge - rSmall);
    const nMin = Math.ceil(Math.pow(0.730 * ratio, 2));

    // Minimum of 10 shots required
    return Math.max(nMin, 10);
}

function calculateSampleSize() {
    const r1 = parseFloat(document.getElementById('load1-radius').value) || 0;
    const r2 = parseFloat(document.getElementById('load2-radius').value) || 0;

    if (r1 <= 0 || r2 <= 0) {
        document.getElementById('min-shots').textContent = '\u2014';
        document.getElementById('sample-size-note').textContent = 'Enter positive values for both radii';
        return;
    }

    if (r1 === r2) {
        document.getElementById('min-shots').textContent = '\u2014';
        document.getElementById('sample-size-note').textContent = 'Radii must be different to compare loads';
        return;
    }

    // The formula is unit-agnostic (ratio-based), so no conversion needed
    document.getElementById('min-shots').textContent = calculateMinSampleSize(r1, r2);
    document.getElementById('sample-size-note').textContent = 'in EACH group to have >95% confidence the loads are different';
}

function onRadiusUnitChange() {
    const unit = document.getElementById('radius-unit').value;
    const r1Input = document.getElementById('load1-radius');
    const r2Input = document.getElementById('load2-radius');
    const r1 = parseFloat(r1Input.value) || 0;
    const r2 = parseFloat(r2Input.value) || 0;

    if (unit === 'mm') {
        // Convert inches to mm
        r1Input.value = (r1 * MM_PER_INCH).toFixed(2);
        r2Input.value = (r2 * MM_PER_INCH).toFixed(2);
        r1Input.step = '0.01';
        r2Input.step = '0.01';
    } else {
        // Convert mm to inches
        r1Input.value = (r1 / MM_PER_INCH).toFixed(3);
        r2Input.value = (r2 / MM_PER_INCH).toFixed(3);
        r1Input.step = '0.001';
        r2Input.step = '0.001';
    }

    // Regenerate the table with new unit
    generateSampleSizeTable();
    calculateSampleSize();
}

function generateSampleSizeTable() {
    const table = document.getElementById('sample-size-table');
    const unit = document.getElementById('radius-unit').value;
    const isMetric = unit === 'mm';

    // Convert base values if using mm
    const colValues = isMetric
        ? SAMPLE_SIZE_COL_VALUES_INCHES.map(v => v * MM_PER_INCH)
        : SAMPLE_SIZE_COL_VALUES_INCHES;
    const rowValues = isMetric
        ? SAMPLE_SIZE_ROW_VALUES_INCHES.map(v => v * MM_PER_INCH)
        : SAMPLE_SIZE_ROW_VALUES_INCHES;

    const decimals = isMetric ? 1 : 3;
    const unitLabel = isMetric ? 'mm' : 'in';

    let html = '<thead><tr>';
    html += `<th class="corner-header">#2 (${unitLabel}) \\ #1</th>`;
    for (const col of colValues) {
        html += `<th>${col.toFixed(decimals)}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < rowValues.length; i++) {
        const row = rowValues[i];
        const rowInches = SAMPLE_SIZE_ROW_VALUES_INCHES[i];
        html += `<tr><td class="row-header">${row.toFixed(decimals)}</td>`;

        for (let j = 0; j < colValues.length; j++) {
            const colInches = SAMPLE_SIZE_COL_VALUES_INCHES[j];
            // Use inch values for comparison to avoid floating point issues
            if (Math.abs(rowInches - colInches) < 0.0001) {
                html += '<td class="diagonal">-</td>';
            } else {
                // Formula is ratio-based, so same result regardless of units
                const nMin = calculateMinSampleSize(rowInches, colInches);
                let cellClass = '';
                if (nMin <= 20) {
                    cellClass = 'low';
                } else if (nMin <= 100) {
                    cellClass = 'medium';
                } else {
                    cellClass = 'high';
                }
                html += `<td class="${cellClass}">${nMin}</td>`;
            }
        }
        html += '</tr>';
    }
    html += '</tbody>';

    table.innerHTML = html;
}

// Initialise
calculateSampleSize();
generateSampleSizeTable();
