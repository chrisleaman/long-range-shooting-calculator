// ============================================
// Extreme Spread to Mean Radius Analysis tab functions
// ============================================

// Track previous ES unit for conversions
let previousESUnit = 'moa';

function onESUnitChange() {
    const unit = document.getElementById('es-unit').value;
    const distanceGroup = document.getElementById('es-distance-group');
    const distanceUnitGroup = document.getElementById('es-distance-unit-group');
    const esInput = document.getElementById('es-value');
    const esValue = parseFloat(esInput.value) || 0;

    // Show distance inputs only for linear units (inches, mm)
    if (unit === 'inches' || unit === 'mm') {
        distanceGroup.classList.add('visible');
        distanceUnitGroup.classList.add('visible');
    } else {
        distanceGroup.classList.remove('visible');
        distanceUnitGroup.classList.remove('visible');
    }

    // Convert value when switching between inches and mm
    if (previousESUnit === 'inches' && unit === 'mm') {
        esInput.value = (esValue * MM_PER_INCH).toFixed(2);
        esInput.step = '0.01';
    } else if (previousESUnit === 'mm' && unit === 'inches') {
        esInput.value = (esValue / MM_PER_INCH).toFixed(3);
        esInput.step = '0.001';
    } else if (unit === 'mm') {
        esInput.step = '0.01';
    } else if (unit === 'inches') {
        esInput.step = '0.001';
    } else {
        esInput.step = 'any';
    }

    previousESUnit = unit;
    calculateEStoMR();
}

function calculateEStoMR() {
    const esValue = parseFloat(document.getElementById('es-value').value) || 0;
    const esUnit = document.getElementById('es-unit').value;
    const nShots = document.getElementById('es-shots').value;
    const warning = document.getElementById('es-warning');

    // Convert ES to MOA
    let esMOA = esValue;

    if (esUnit === 'mil') {
        esMOA = esValue * MOA_PER_MIL;
    } else if (esUnit === 'inches' || esUnit === 'mm') {
        const distance = parseFloat(document.getElementById('es-distance').value) || 100;
        const distUnit = document.getElementById('es-distance-unit').value;

        // Convert to inches if mm
        let inches = esValue;
        if (esUnit === 'mm') {
            inches = esValue / MM_PER_INCH;
        }

        // Convert distance to yards
        let distanceYards = distance;
        if (distUnit === 'metres') {
            distanceYards = distance / METRES_PER_YARD;
        }

        // Convert to MOA
        if (distanceYards > 0) {
            esMOA = inches / (INCHES_PER_MOA_AT_100YD * (distanceYards / 100));
        } else {
            esMOA = 0;
        }
    }

    // Validate ES is in range
    if (esMOA < 0.1 || esMOA > 2.0 || esValue <= 0) {
        warning.classList.add('visible');
        document.getElementById('mr-p5-value').textContent = '\u2014';
        document.getElementById('mr-p50-value').textContent = '\u2014';
        document.getElementById('mr-p95-value').textContent = '\u2014';
        document.getElementById('mr-typical-moa').textContent = '\u2014';
        document.getElementById('mr-typical-secondary').textContent = '\u2014';
        document.getElementById('mr-range').textContent = '\u2014';
        document.getElementById('mr-range-secondary').textContent = '\u2014';
        updateBPCTable(null, null, null);
        return;
    }

    warning.classList.remove('visible');

    // Round ES to nearest 0.1 for table lookup
    const esKey = (Math.round(esMOA * 10) / 10).toFixed(1);

    // Clamp to valid range
    const clampedKey = Math.max(0.1, Math.min(2.0, parseFloat(esKey))).toFixed(1);

    // Lookup MR values
    const mrValues = ES_TO_MR_TABLE[clampedKey]?.[nShots];

    if (!mrValues) {
        warning.classList.add('visible');
        document.getElementById('mr-p5-value').textContent = '\u2014';
        document.getElementById('mr-p50-value').textContent = '\u2014';
        document.getElementById('mr-p95-value').textContent = '\u2014';
        document.getElementById('mr-typical-moa').textContent = '\u2014';
        document.getElementById('mr-typical-secondary').textContent = '\u2014';
        document.getElementById('mr-range').textContent = '\u2014';
        document.getElementById('mr-range-secondary').textContent = '\u2014';
        updateBPCTable(null, null, null);
        return;
    }

    const [mrP5, mrP50, mrP95] = mrValues;

    // Update bell curve labels
    document.getElementById('mr-p5-value').textContent = mrP5.toFixed(3) + ' MOA';
    document.getElementById('mr-p50-value').textContent = mrP50.toFixed(3) + ' MOA';
    document.getElementById('mr-p95-value').textContent = mrP95.toFixed(3) + ' MOA';

    // Update result boxes
    const mrP50MIL = mrP50 / MOA_PER_MIL;
    const mrP50Inches = mrP50 * INCHES_PER_MOA_AT_100YD;

    document.getElementById('mr-typical-moa').textContent = mrP50.toFixed(3) + ' MOA';
    document.getElementById('mr-typical-secondary').textContent =
        mrP50MIL.toFixed(3) + ' MIL / ' + mrP50Inches.toFixed(3) + ' in @ 100 yd';

    const mrP5Inches = mrP5 * INCHES_PER_MOA_AT_100YD;
    const mrP95Inches = mrP95 * INCHES_PER_MOA_AT_100YD;

    document.getElementById('mr-range').textContent =
        mrP5.toFixed(3) + ' \u2013 ' + mrP95.toFixed(3) + ' MOA';
    document.getElementById('mr-range-secondary').textContent =
        mrP5Inches.toFixed(3) + ' \u2013 ' + mrP95Inches.toFixed(3) + ' in @ 100 yd';

    // Update bell curve visualization
    updateBellCurve(mrP5, mrP50, mrP95);

    // Update BPC comparison table
    updateBPCTable(mrP5, mrP50, mrP95);
}

function updateBellCurve(p5, p50, p95) {
    // SVG dimensions
    const svgWidth = 400;
    const svgHeight = 180;
    const margin = { left: 40, right: 40, top: 20, bottom: 40 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Calculate x positions for percentiles
    // Map the range [p5 - padding, p95 + padding] to [margin.left, svgWidth - margin.right]
    const padding = (p95 - p5) * 0.3;
    const minVal = p5 - padding;
    const maxVal = p95 + padding;
    const range = maxVal - minVal;

    function xScale(val) {
        return margin.left + ((val - minVal) / range) * width;
    }

    const xP5 = xScale(p5);
    const xP50 = xScale(p50);
    const xP95 = xScale(p95);

    // Update marker positions
    document.getElementById('marker-p5').setAttribute('x1', xP5);
    document.getElementById('marker-p5').setAttribute('x2', xP5);
    document.getElementById('marker-p50').setAttribute('x1', xP50);
    document.getElementById('marker-p50').setAttribute('x2', xP50);
    document.getElementById('marker-p95').setAttribute('x1', xP95);
    document.getElementById('marker-p95').setAttribute('x2', xP95);

    // Update label positions
    document.getElementById('label-p5').setAttribute('x', xP5);
    document.getElementById('label-p50').setAttribute('x', xP50);
    document.getElementById('label-p95').setAttribute('x', xP95);

    // Generate bell curve path
    // Approximate normal distribution centered at p50
    const sigma = (p95 - p5) / 3.29; // 90% of data between p5 and p95
    const mu = p50;

    function normalPDF(x) {
        const z = (x - mu) / sigma;
        return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
    }

    // Find max PDF for scaling
    const maxPDF = normalPDF(mu);

    // Generate path points
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const val = minVal + (range * i / steps);
        const x = xScale(val);
        const y = margin.top + height - (normalPDF(val) / maxPDF) * height * 0.9;
        points.push({ x, y });
    }

    // Create path data
    let pathD = `M ${margin.left} ${margin.top + height}`;
    points.forEach(p => {
        pathD += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    });
    pathD += ` L ${svgWidth - margin.right} ${margin.top + height} Z`;

    document.getElementById('bell-curve-path').setAttribute('d', pathD);
}

function updateBPCTable(mrP5, mrP50, mrP95) {
    const tbody = document.getElementById('bpc-table-body');

    // If no valid data, show placeholder
    if (mrP5 === null || mrP50 === null || mrP95 === null) {
        let html = '';
        for (const bpc of BPC_CLASSES) {
            html += `<tr>
                <td>Class ${bpc.class}</td>
                <td>&lt; ${bpc.sigma.toFixed(1)} MOA</td>
                <td>${bpc.median5ES.toFixed(1)} MOA</td>
                <td class="example-col">${bpc.examples}</td>
                <td class="bpc-unknown">\u2014</td>
            </tr>`;
        }
        tbody.innerHTML = html;
        return;
    }

    // Convert MR to sigma estimates
    // σ = MR / √(π/2) ≈ MR * 0.7979
    const sigmaOptimistic = mrP5 * MR_TO_SIGMA;   // Lower bound (from p5 MR)
    const sigmaTypical = mrP50 * MR_TO_SIGMA;     // Typical estimate (from p50 MR)
    const sigmaConservative = mrP95 * MR_TO_SIGMA; // Upper bound (from p95 MR)

    // Calculate equivalent median 5-shot ES from sigma estimates
    // Median 5-shot ES ≈ 3 × σ
    const es5Optimistic = sigmaOptimistic * 3;
    const es5Typical = sigmaTypical * 3;
    const es5Conservative = sigmaConservative * 3;

    let html = '';
    for (const bpc of BPC_CLASSES) {
        // Determine comparison result
        // "Yes" (green): user's conservative sigma < class threshold (better than class with 95% confidence)
        // "No" (red): user's optimistic sigma >= class threshold (worse than class even with 5% confidence)
        // "Plausible" (yellow): user's results overlap with class threshold
        let resultClass, resultText;

        if (sigmaConservative < bpc.sigma) {
            // Even worst-case estimate is better than this class
            resultClass = 'bpc-yes';
            resultText = 'Yes';
        } else if (sigmaOptimistic >= bpc.sigma) {
            // Even best-case estimate is worse than this class
            resultClass = 'bpc-no';
            resultText = 'No';
        } else {
            // Results overlap with class boundary
            resultClass = 'bpc-plausible';
            resultText = 'Plausible';
        }

        html += `<tr>
            <td>Class ${bpc.class}</td>
            <td>&lt; ${bpc.sigma.toFixed(1)} MOA</td>
            <td>${bpc.median5ES.toFixed(1)} MOA</td>
            <td class="example-col">${bpc.examples}</td>
            <td class="${resultClass}">${resultText}</td>
        </tr>`;
    }

    tbody.innerHTML = html;
}

function generateEStoMRTable() {
    const table = document.getElementById('es-mr-table');
    const percentileIndex = parseInt(document.querySelector('input[name="es-percentile"]:checked').value);

    const esValues = ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0',
                      '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0'];
    const shotCounts = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
                        '16', '17', '18', '19', '20', '21', '22', '23', '24', '25'];

    let html = '<thead><tr>';
    html += '<th class="corner-header">ES (MOA) \\ Shots</th>';
    for (const n of shotCounts) {
        html += `<th>${n}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (const es of esValues) {
        html += `<tr><td class="row-header">${es}</td>`;
        for (const n of shotCounts) {
            const values = ES_TO_MR_TABLE[es]?.[n];
            if (values) {
                const mr = values[percentileIndex];
                html += `<td>${mr.toFixed(3)}</td>`;
            } else {
                html += '<td>\u2014</td>';
            }
        }
        html += '</tr>';
    }
    html += '</tbody>';

    table.innerHTML = html;
}

// Initialise
calculateEStoMR();
generateEStoMRTable();
