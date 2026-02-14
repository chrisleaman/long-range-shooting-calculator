// ============================================
// Shared constants
// ============================================
const MOA_PER_MIL = 3.4377;
const INCHES_PER_MOA_AT_100YD = 1.047;
const INCHES_PER_MIL_AT_100YD = 3.6;
const MM_PER_INCH = 25.4;
const METRES_PER_YARD = 0.9144;
const FTLBF_PER_JOULE = 0.737562;
const JOULES_PER_FTLBF = 1.355818;
const LBS_PER_KG = 2.20462;
const GRAINS_PER_GRAM = 15.4324;
const FPS_PER_MPS = 3.28084;
const ENERGY_CONSTANT = 450436.686; // 2 * 7000 grains/lb * 32.174 ft/s²
const MEAN_RADIUS_COEFFICIENT = 0.428;
const TOP_GUN_CONSTANT = 200;

// MR to sigma conversion: σ = MR / √(π/2) ≈ MR / 1.2533
const MR_TO_SIGMA = 1 / Math.sqrt(Math.PI / 2); // ≈ 0.7979

// Ballistic Precision Classification (BPC) data
// Reference: http://ballistipedia.com/index.php?title=Ballistic_Precision_Classification
const BPC_CLASSES = [
    { class: 1, sigma: 0.1, median5ES: 0.3, examples: 'Rail guns' },
    { class: 2, sigma: 0.2, median5ES: 0.6, examples: 'Benchrest guns' },
    { class: 3, sigma: 0.3, median5ES: 0.9, examples: 'Mil-spec for PSR' },
    { class: 4, sigma: 0.4, median5ES: 1.2, examples: 'Competitive auto-loaders' },
    { class: 5, sigma: 0.5, median5ES: 1.5, examples: 'Mil-spec for M110 and M24' },
    { class: 6, sigma: 0.6, median5ES: 1.8, examples: 'Mil-spec for infantry rifles' }
];

// Base values in inches for the sample size reference table
const SAMPLE_SIZE_COL_VALUES_INCHES = [0.100, 0.125, 0.150, 0.175, 0.200, 0.225, 0.250, 0.275, 0.300, 0.325, 0.350, 0.375, 0.400, 0.425, 0.450, 0.475];
const SAMPLE_SIZE_ROW_VALUES_INCHES = [0.125, 0.150, 0.175, 0.200, 0.225, 0.250, 0.275, 0.300, 0.325, 0.350, 0.375, 0.400, 0.425, 0.450, 0.475, 0.500];

// ============================================
// Shared utility functions
// ============================================
function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-AU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}
