// ============================================
// Tab switching
// ============================================
function switchTab(tabName, btn) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');

    // Scroll active tab into view on mobile
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

// Handle scroll fade indicator for mobile tabs
(function() {
    const tabButtons = document.querySelector('.tab-buttons');
    const tabContainer = document.querySelector('.tab-container');
    if (!tabButtons || !tabContainer) return;

    function updateScrollFade() {
        const atEnd = tabButtons.scrollLeft + tabButtons.clientWidth >= tabButtons.scrollWidth - 2;
        tabContainer.classList.toggle('scrolled-end', atEnd);
    }

    tabButtons.addEventListener('scroll', updateScrollFade, { passive: true });
    window.addEventListener('resize', updateScrollFade);
    updateScrollFade();
})();

// ============================================
// Collapsible sections
// ============================================
function toggleCollapsible(header) {
    header.classList.toggle('open');
    const content = header.nextElementSibling;
    content.classList.toggle('open');
}
