let currentCaptableData = [];
let totalShares = 0;
let perShareValue = 0;
let trancheResults = [];
let currentTab = 0;

function formatCurrency(input) {
    let value = input.value.replace(/[^\d]/g, '');
    if (value) {
        value = parseInt(value).toLocaleString('en-IN');
        input.value = value;
    }
}

function parseCurrency(value) {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
}

function formatNumber(num) {
    return num.toLocaleString('en-IN');
}

function parseCaptable() {
    const input = document.getElementById('currentCaptable').value;
    const lines = input.split('\n').filter(line => line.trim());
    
    currentCaptableData = [];
    totalShares = 0;
    
    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
            const entity = parts[0];
            const shares = parseInt(parts[parts.length - 1].replace(/[^\d]/g, ''));
            
            if (!isNaN(shares) && entity.toUpperCase() !== 'TOTAL') {
                currentCaptableData.push({
                    entity: entity,
                    shares: shares
                });
                totalShares += shares;
            } else if (entity.toUpperCase() === 'TOTAL') {
                totalShares = shares;
            }
        }
    });
    
    displayParsedData();
    calculatePerShare();
}

function displayParsedData() {
    const table = document.getElementById('currentTable');
    const totalSharesSpan = document.getElementById('totalShares');
    
    let html = `
        <thead>
            <tr>
                <th>Entity</th>
                <th>Shares</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    currentCaptableData.forEach(item => {
        const percentage = ((item.shares / totalShares) * 100).toFixed(2);
        html += `
            <tr>
                <td>${item.entity}</td>
                <td>${formatNumber(item.shares)}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });
    
    html += `
        <tr style="font-weight: bold; background-color: rgba(0, 0, 128, 0.1);">
            <td>TOTAL</td>
            <td>${formatNumber(totalShares)}</td>
            <td>100.00%</td>
        </tr>
    </tbody>`;
    
    table.innerHTML = html;
    totalSharesSpan.textContent = formatNumber(totalShares);
    
    document.getElementById('parsedData').style.display = 'block';
}

function calculatePerShare() {
    const preMoneyInput = document.getElementById('preMoneyValuation');
    const preMoneyValue = parseCurrency(preMoneyInput.value);
    
    if (preMoneyValue > 0 && totalShares > 0) {
        perShareValue = preMoneyValue / totalShares;
        
        document.getElementById('perShareValue').textContent = `₹${perShareValue.toFixed(2)}`;
        document.getElementById('perShareCalculation').style.display = 'block';
        
        calculateNewShares();
    }
}

function updateTranches() {
    const trancheCount = parseInt(document.getElementById('trancheCount').value);
    const container = document.getElementById('tranchesContainer');
    
    // Clear existing tranches
    container.innerHTML = '';
    
    // Create new tranches
    for (let i = 1; i <= trancheCount; i++) {
        const trancheDiv = document.createElement('div');
        trancheDiv.className = 'tranche-container';
        trancheDiv.setAttribute('data-tranche', i);
        
        trancheDiv.innerHTML = `
            <div class="tranche-header">
                <h3 class="tranche-title">Tranche ${i}</h3>
            </div>
            <div class="form-group">
                <label>Tranche Amount:</label>
                <div class="currency-input">
                    <input type="text" class="tranche-amount" placeholder="Investment amount for this tranche" oninput="formatCurrency(this); updateRemainingTranches()">
                </div>
            </div>
            <div class="investors-section">
                <h4>Investors for this Tranche:</h4>
                <div class="investors-container">
                    <div class="investor-row">
                        <input type="text" placeholder="Investor Name" class="investor-name">
                        <div class="currency-input">
                            <input type="text" placeholder="Investment Amount" class="investor-amount" oninput="formatCurrency(this); calculateNewShares()">
                        </div>
                        <div class="checkbox-container" style="margin: 0;">
                            <input type="checkbox" class="auto-fill-checkbox" onchange="toggleAutoFill(this)">
                            <label>Use remaining amount</label>
                        </div>
                        <button class="btn btn-danger remove-investor" onclick="removeInvestor(this)" style="display: none;">Remove</button>
                    </div>
                </div>
                <button class="btn btn-secondary" onclick="addInvestor(this)">Add Investor</button>
            </div>
        `;
        
        container.appendChild(trancheDiv);
    }
}

function addInvestor(button) {
    const trancheContainer = button.closest('.tranche-container');
    const investorsContainer = trancheContainer.querySelector('.investors-container');
    
    const newRow = document.createElement('div');
    newRow.className = 'investor-row';
    
    newRow.innerHTML = `
        <input type="text" placeholder="Investor Name" class="investor-name">
        <div class="currency-input">
            <input type="text" placeholder="Investment Amount" class="investor-amount" oninput="formatCurrency(this); calculateNewShares()">
        </div>
        <div class="checkbox-container" style="margin: 0;">
            <input type="checkbox" class="auto-fill-checkbox" onchange="toggleAutoFill(this)">
            <label>Use remaining amount</label>
        </div>
        <button class="btn btn-danger remove-investor" onclick="removeInvestor(this)">Remove</button>
    `;
    
    investorsContainer.appendChild(newRow);
    
    // Show remove buttons for all rows in this tranche
    const removeButtons = investorsContainer.querySelectorAll('.remove-investor');
    removeButtons.forEach(btn => btn.style.display = 'inline-block');
}

function removeInvestor(button) {
    const investorsContainer = button.closest('.investors-container');
    button.parentElement.remove();
    
    const rows = investorsContainer.querySelectorAll('.investor-row');
    if (rows.length === 1) {
        rows[0].querySelector('.remove-investor').style.display = 'none';
    }
    
    calculateNewShares();
}

function toggleAutoFill(checkbox) {
    const investorRow = checkbox.closest('.investor-row');
    const amountInput = investorRow.querySelector('.investor-amount');
    
    if (checkbox.checked) {
        const trancheContainer = checkbox.closest('.tranche-container');
        const trancheAmountInput = trancheContainer.querySelector('.tranche-amount');
        const trancheAmount = parseCurrency(trancheAmountInput.value);
        
        if (trancheAmount > 0) {
            // Calculate remaining amount for this tranche
            const allInvestorRows = trancheContainer.querySelectorAll('.investor-row');
            let totalAllocated = 0;
            
            allInvestorRows.forEach(row => {
                if (row !== investorRow) {
                    const amount = parseCurrency(row.querySelector('.investor-amount').value);
                    totalAllocated += amount;
                }
            });
            
            const remaining = trancheAmount - totalAllocated;
            if (remaining > 0) {
                amountInput.value = formatNumber(remaining);
                formatCurrency(amountInput);
            }
        }
    }
}

function updateRemainingTranches() {
    const trancheContainers = document.querySelectorAll('.tranche-container');
    if (trancheContainers.length !== 2) return; // Only works for 2 tranches
    
    const firstInput = trancheContainers[0].querySelector('.tranche-amount');
    const secondInput = trancheContainers[1].querySelector('.tranche-amount');
    
    const firstAmount = parseCurrency(firstInput.value);
    const secondAmount = parseCurrency(secondInput.value);
    
    // If first tranche has amount but second is empty, try to get total from pre-money context
    if (firstAmount > 0 && secondAmount === 0) {
        // For now, just allow manual entry. Can be enhanced later with total round size input
        return;
    }
}

function calculateRemainingTranches() {
    // This function is kept for backward compatibility
    updateRemainingTranches();
}

function calculateNewShares() {
    if (perShareValue === 0) return;
    calculateRemainingTranches();
}

function toggleEsopInput() {
    const checkbox = document.getElementById('createEsop');
    const esopInput = document.getElementById('esopInput');
    
    esopInput.style.display = checkbox.checked ? 'block' : 'none';
}

function calculateNewCaptable() {
    if (currentCaptableData.length === 0) {
        alert('Please parse the current captable first.');
        return;
    }
    
    if (perShareValue === 0) {
        alert('Please enter pre-money valuation.');
        return;
    }
    
    const trancheCount = parseInt(document.getElementById('trancheCount').value);
    const trancheContainers = document.querySelectorAll('.tranche-container');
    
    trancheResults = [];
    let runningCaptable = [...currentCaptableData];
    let runningTotalShares = totalShares;
    let cumulativeInvestment = 0;
    let allInvestorsGrouped = {}; // For UI display (grouped)
    let trancheInvestors = []; // For CSV (separate by tranche)
    
    // Process each tranche separately
    for (let i = 0; i < trancheCount; i++) {
        const container = trancheContainers[i];
        const investorRows = container.querySelectorAll('.investor-row');
        const trancheInvestorList = [];
        let trancheInvestment = 0;
        
        // Get investors for this specific tranche
        investorRows.forEach(row => {
            const name = row.querySelector('.investor-name').value.trim();
            const amountValue = parseCurrency(row.querySelector('.investor-amount').value);
            
            if (name && amountValue > 0) {
                const shares = Math.floor(amountValue / perShareValue);
                
                // For CSV - keep separate tranche records
                trancheInvestorList.push({
                    name: name,
                    investment: amountValue,
                    shares: shares,
                    tranche: i + 1
                });
                
                // For UI - group by name
                if (!allInvestorsGrouped[name]) {
                    allInvestorsGrouped[name] = {
                        name: name,
                        investment: 0,
                        shares: 0,
                        tranches: []
                    };
                }
                
                allInvestorsGrouped[name].investment += amountValue;
                allInvestorsGrouped[name].shares += shares;
                allInvestorsGrouped[name].tranches.push(i + 1);
                
                trancheInvestment += amountValue;
            }
        });
        
        trancheInvestors.push(...trancheInvestorList);
        cumulativeInvestment += trancheInvestment;
        
        // Add investors from this tranche to running captable (but don't duplicate)
        trancheInvestorList.forEach(investor => {
            const existingIndex = runningCaptable.findIndex(item => item.entity === investor.name);
            if (existingIndex >= 0) {
                // Update existing investor - add shares and investment
                runningCaptable[existingIndex].shares += investor.shares;
                runningCaptable[existingIndex].investment = (runningCaptable[existingIndex].investment || 0) + investor.investment;
                runningTotalShares += investor.shares;
            } else {
                // Add new investor only if not already exists
                runningTotalShares += investor.shares;
                runningCaptable.push({
                    entity: investor.name,
                    shares: investor.shares,
                    isNew: true,
                    investment: investor.investment
                });
            }
        });
        
        // Handle ESOP for the first tranche only
        let esopShares = 0;
        if (i === 0) {
            const createEsop = document.getElementById('createEsop').checked;
            if (createEsop) {
                const esopPercentage = parseFloat(document.getElementById('esopPercentage').value) || 0;
                if (esopPercentage > 0) {
                    esopShares = Math.floor((runningTotalShares * esopPercentage) / (100 - esopPercentage));
                    runningTotalShares += esopShares;
                    
                    const existingEsopIndex = runningCaptable.findIndex(item => 
                        item.entity.toUpperCase().includes('ESOP')
                    );
                    
                    if (existingEsopIndex >= 0) {
                        runningCaptable[existingEsopIndex].shares += esopShares;
                    } else {
                        runningCaptable.push({
                            entity: 'ESOP (New)',
                            shares: esopShares,
                            isNew: true
                        });
                    }
                }
            }
        }
        
        // Create clean captable copy without duplicates
        const cleanCaptable = [];
        const seenEntities = new Set();
        
        runningCaptable.forEach(item => {
            if (!seenEntities.has(item.entity)) {
                seenEntities.add(item.entity);
                cleanCaptable.push({...item});
            }
        });
        
        // Store result for this tranche
        trancheResults.push({
            trancheNumber: i + 1,
            investors: trancheInvestorList,
            captable: cleanCaptable,
            totalShares: runningTotalShares,
            trancheInvestment: trancheInvestment,
            cumulativeInvestment: cumulativeInvestment,
            esopShares: i === 0 ? esopShares : 0
        });
    }
    
    // Store separate investors list for CSV
    trancheResults.allTrancheInvestors = trancheInvestors;
    trancheResults.groupedInvestors = Object.values(allInvestorsGrouped);
    
    displayResults();
}

function displayResults() {
    const resultsDiv = document.getElementById('newCaptableResults');
    const tabsContainer = document.getElementById('resultTabs');
    const tabContent = document.getElementById('tabContent');
    
    // Create tabs for each tranche
    let tabsHtml = '';
    trancheResults.forEach((result, index) => {
        const isActive = index === trancheResults.length - 1; // Make last tab active
        tabsHtml += `<button class="tab ${isActive ? 'active' : ''}" onclick="switchTab(${index})">After Tranche ${result.trancheNumber}</button>`;
    });
    tabsContainer.innerHTML = tabsHtml;
    
    // Display last tab content by default
    switchTab(trancheResults.length - 1);
    
    resultsDiv.style.display = 'block';
}

function switchTab(tabIndex) {
    currentTab = tabIndex;
    const result = trancheResults[tabIndex];
    const tabContent = document.getElementById('tabContent');
    
    // Update tab appearance
    document.querySelectorAll('.tab').forEach((tab, index) => {
        tab.classList.toggle('active', index === tabIndex);
    });
    
    // Calculate valuations
    const preMoneyValue = parseCurrency(document.getElementById('preMoneyValuation').value);
    const postMoneyValue = preMoneyValue + result.cumulativeInvestment;
    
    let html = `
        <div class="calculations">
            <strong>Pre-Money Valuation:</strong> ₹${formatNumber(preMoneyValue)}<br>
            <strong>Total Investment:</strong> ₹${formatNumber(result.trancheInvestment)}<br>
            <strong>Post-Money Valuation:</strong> ₹${formatNumber(postMoneyValue)}<br>
            <strong>Total Shares:</strong> ${formatNumber(result.totalShares)}
        </div>
        <table class="result-table">
            <thead>
                <tr>
                    <th>Entity</th>
                    <th>Shares</th>
                    <th>Percentage</th>
                    <th>Change</th>
                    <th>Investment (₹)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    result.captable.forEach(item => {
        const percentage = ((item.shares / result.totalShares) * 100).toFixed(2);
        
        // Use the investment amount directly from the captable item (it's already properly grouped)
        const investmentDisplay = item.investment ? `₹${formatNumber(item.investment)}` : '-';
        
        // Calculate percentage change
        const originalItem = currentCaptableData.find(orig => orig.entity === item.entity);
        let changeDisplay = '-';
        if (originalItem) {
            const originalPercentage = ((originalItem.shares / totalShares) * 100);
            const newPercentage = parseFloat(percentage);
            const change = newPercentage - originalPercentage;
            const changeIcon = change > 0 ? '↗' : change < 0 ? '↘' : '→';
            const changeColor = change > 0 ? 'color: green;' : change < 0 ? 'color: red;' : 'color: #666;';
            changeDisplay = `<span style="${changeColor}">${changeIcon} ${Math.abs(change).toFixed(1)}%</span>`;
        } else if (item.isNew) {
            changeDisplay = '<span style="color: blue;">↗ New</span>';
        }
        
        const rowClass = item.isNew ? 'style="background-color: #f0f9ff;"' : '';
        
        html += `
            <tr ${rowClass}>
                <td>${item.entity}</td>
                <td>${formatNumber(item.shares)}</td>
                <td>${percentage}%</td>
                <td>${changeDisplay}</td>
                <td>${investmentDisplay}</td>
            </tr>
        `;
    });
    
    html += `
        <tr style="font-weight: bold; background-color: rgba(0, 0, 128, 0.1);">
            <td>TOTAL</td>
            <td>${formatNumber(result.totalShares)}</td>
            <td>100.00%</td>
            <td>-</td>
            <td>₹${formatNumber(result.cumulativeInvestment)}</td>
        </tr>
    </tbody></table>`;
    
    tabContent.innerHTML = html;
}

function downloadCSV() {
    const companyName = document.getElementById('companyName').value.trim() || 'Company';
    const preMoneyVal = parseCurrency(document.getElementById('preMoneyValuation').value);
    const totalInvestment = trancheResults.allTrancheInvestors.reduce((sum, inv) => sum + inv.investment, 0);
    const postMoneyVal = preMoneyVal + totalInvestment;
    
    // Start building CSV in the exact format of the reference file
    let csv = ',,,,,,\n';
    csv += ',,,,,,\n';
    csv += ',,,,,,\n';
    csv += 'Particulars,Amount (In Rs. ),,,,,\n';
    csv += `Pre-money Valuation,${preMoneyVal},,,,,\n`;
    csv += `Outstanding Shares (Fully diluted basis),${totalShares},,,,,\n`;
    csv += `Share Price ,${Math.round(perShareValue)},,,,,\n`;
    csv += ',,,,,,\n';
    
    // Round Details section - show each tranche investment separately
    csv += 'Round Details,,,,,,\n';
    csv += 'Particulars,Amount (In Rs. ),No of shares,Investment amount,,,\n';
    
    let totalRoundShares = 0;
    let totalRoundAmount = 0;
    
    // Show each investor in each tranche separately
    trancheResults.allTrancheInvestors.forEach(investor => {
        const investorLabel = trancheResults.allTrancheInvestors.filter(inv => inv.name === investor.name).length > 1 
            ? `${investor.name} Tranche ${investor.tranche}` 
            : investor.name;
        csv += `${investorLabel},${investor.investment},${investor.shares},${investor.investment},,,\n`;
        totalRoundShares += investor.shares;
        totalRoundAmount += investor.investment;
    });
    
    csv += `Total,${totalRoundAmount},${totalRoundShares},${totalRoundAmount},,,\n`;
    csv += ',,,,,,\n';
    csv += ',,,,,,\n';
    csv += ',,,,,,\n';
    csv += ',,,,,,\n';
    
    // Add multiple shareholding patterns - one for each tranche
    trancheResults.forEach((trancheResult, index) => {
        csv += `Shareholding Pattern - After Tranche ${trancheResult.trancheNumber},,,,,,\n`;
        csv += 'Particulars, Current Holding ,,Post Funding,,,\n';
        
        if (index === 0) {
            csv += ',No. of Shares,Holding,No. of Shares- Tranche 1,,No. of Shares Tranche 2,% Post tranche 2\n';
        } else {
            csv += `,No. of Shares,Holding,No. of Shares- Tranche ${trancheResult.trancheNumber},,% Post tranche ${trancheResult.trancheNumber},\n`;
        }
        
        // Sort captable: original shareholders first, then new investors, then ESOP
        const originalShareholders = trancheResult.captable.filter(item => !item.isNew);
        const newShareholders = trancheResult.captable.filter(item => item.isNew && !item.entity.toUpperCase().includes('ESOP'));
        const esopEntries = trancheResult.captable.filter(item => item.entity.toUpperCase().includes('ESOP'));
        
        const sortedCaptable = [...originalShareholders, ...newShareholders, ...esopEntries];
        
        sortedCaptable.forEach(item => {
            const currentShares = currentCaptableData.find(orig => orig.entity === item.entity)?.shares || 0;
            const currentPercentage = currentShares > 0 ? ((currentShares / totalShares) * 100).toFixed(1) : '0.0';
            const postPercentage = ((item.shares / trancheResult.totalShares) * 100).toFixed(1);
            
            // For existing ESOP, show current shares; for new ESOP, show 0 for current
            const displayCurrentShares = item.entity.toUpperCase().includes('ESOP') && item.isNew ? '' : (currentShares || '');
            const displayCurrentPercentage = item.entity.toUpperCase().includes('ESOP') && item.isNew ? '0.0' : currentPercentage;
            
            csv += ` ${item.entity} ,${displayCurrentShares}, ${displayCurrentPercentage}% ,${item.shares}, ${postPercentage}% ,,\n`;
        });
        
        csv += ` TOTAL ,${totalShares}, 100.0% ,${trancheResult.totalShares}, 100% ,,\n`;
        csv += ',,,,,,\n';
        csv += ',,,,,,\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_updated_captable.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function exportToGoogleSheets() {
    const result = trancheResults[currentTab];
    const companyName = document.getElementById('companyName').value.trim() || 'Company';
    
    // Create Google Sheets compatible URL
    let sheetsData = 'Entity,Shares,Percentage,Investment (INR),Tranche\n';
    
    result.captable.forEach(item => {
        const percentage = ((item.shares / result.totalShares) * 100).toFixed(2);
        const investment = result.investors.find(inv => inv.name === item.entity)?.investment || '';
        const tranche = item.tranche ? item.tranche : (item.isNew ? 'New' : 'Original');
        
        sheetsData += `${item.entity},${item.shares},${percentage}%,${investment},${tranche}\n`;
    });
    
    // Open Google Sheets with data
    const sheetsUrl = `https://docs.google.com/spreadsheets/create?title=${encodeURIComponent(companyName + ' Captable Tranche ' + result.trancheNumber)}`;
    window.open(sheetsUrl, '_blank');
    
    // Show instructions
    alert('Google Sheets will open in a new tab. You can then paste the CSV data manually or use the "File > Import" option.');
}