document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsContainer = document.getElementById('results-container');
    const totalFootprintEl = document.getElementById('total-footprint');
    const resultsBreakdownEl = document.getElementById('results-breakdown');
    const resetBtn = document.getElementById('reset-btn');
    const form = document.getElementById('calculator-form');

    // --- Emission Factors (kg CO₂e per unit) ---
    // Note: These are simplified, illustrative values.
    const factors = {
        cement: 0.9,      // per kg
        steel: 1.85,      // per kg
        bricks: 0.2,      // per kg
        glass: 0.9,       // per kg
        wood: 0.03,       // per kg
        area: 150,        // kg CO2e per m^2 (embodied carbon estimate for general construction)
        wiring: {
            copper: 0.05, // kg CO2e per meter (estimated)
            aluminium: 0.15 // kg CO2e per meter (estimated)
        },
        plumbing: {
            copper: 0.8,  // kg CO2e per meter (estimated)
            pvc: 0.5      // kg CO2e per meter (estimated)
        },
        diesel: 2.68,     // per liter
        electricity: 0.82 // per kWh (global average, varies greatly by region)
    };

    // --- Event Listener for Calculation ---
    calculateBtn.addEventListener('click', () => {
        // 1. Get all input values, defaulting to 0 if empty
        const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

        const inputs = {
            cement: getVal('cement'),
            steel: getVal('steel'),
            bricks: getVal('bricks'),
            glass: getVal('glass'),
            wood: getVal('wood'),
            area: getVal('area'),
            wire_type: document.getElementById('wire_type').value,
            wire_length: getVal('wire_length'),
            pipe_type: document.getElementById('pipe_type').value,
            pipe_length: getVal('pipe_length'),
            diesel: getVal('diesel'),
            electricity: getVal('electricity')
        };

        // 2. Calculate footprint for each item
        const results = {
            cement: inputs.cement * factors.cement,
            steel: inputs.steel * factors.steel,
            bricks: inputs.bricks * factors.bricks,
            glass: inputs.glass * factors.glass,
            wood: inputs.wood * factors.wood,
            area: inputs.area * factors.area,
            wiring: inputs.wire_length * factors.wiring[inputs.wire_type],
            plumbing: inputs.pipe_length * factors.plumbing[inputs.pipe_type],
            diesel: inputs.diesel * factors.diesel,
            electricity: inputs.electricity * factors.electricity
        };

        // 3. Calculate total footprint
        const totalFootprint = Object.values(results).reduce((sum, val) => sum + val, 0);

        // 4. Update the UI with results
        updateResultsUI(results, totalFootprint);
    });

    // --- Event Listener for Reset ---
    resetBtn.addEventListener('click', () => {
        // Hide results smoothly
        resultsContainer.style.maxHeight = '0';
        // Reset form fields
        form.reset();
        // Scroll back to the top of the form for a better user experience
        form.scrollIntoView({ behavior: 'smooth' });
    });

    // --- Function to Update the Results UI ---
    function updateResultsUI(results, total) {
        // Update total footprint display
        totalFootprintEl.textContent = `${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg CO₂e`;

        // Clear previous breakdown
        resultsBreakdownEl.innerHTML = '';

        const breakdownData = [
            { label: 'Cement', value: results.cement },
            { label: 'Steel', value: results.steel },
            { label: 'Bricks', value: results.bricks },
            { label: 'Glass', value: results.glass },
            { label: 'Wood', value: results.wood },
            { label: 'Building Area', value: results.area },
            { label: 'Wiring', value: results.wiring },
            { label: 'Plumbing', value: results.plumbing },
            { label: 'Diesel Fuel', value: results.diesel },
            { label: 'Electricity', value: results.electricity },
        ];

        // Sort by value descending to show biggest contributors first
        breakdownData.sort((a, b) => b.value - a.value);

        // Generate and append breakdown bars
        breakdownData.forEach(item => {
            if (item.value > 0) {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const barHtml = `
                            <div class="w-full">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-sm font-medium text-slate-700">${item.label}</span>
                                    <span class="text-sm font-semibold text-slate-800">${item.value.toFixed(2)} kg</span>
                                </div>
                                <div class="w-full bg-slate-200 rounded-full h-2.5">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                        `;
                resultsBreakdownEl.insertAdjacentHTML('beforeend', barHtml);
            }
        });

        // Show the results container with a smooth animation
        resultsContainer.style.maxHeight = resultsContainer.scrollHeight + 'px';
        // Scroll to the results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});
