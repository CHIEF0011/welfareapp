// Move LOCAL_STORAGE_KEYS and other constant declarations to the top
const LOCAL_STORAGE_KEYS = {
    MEMBERS: 'kanamWelfareMembersV2',
    CONTRIBUTIONS: 'kanamWelfareContributionsV2', 
    EXPENDITURES: 'kanamWelfareExpendituresV2',
    SETTINGS: 'kanamWelfareSettingsV2',
    LIVE_MEMBERS: 'kanamWelfareLiveMembersV2',
    APPROVED_MEMBERS: 'kanamWelfareApprovedMembersV2',
    ADMIN_USERS: 'kanamWelfareAdminUsers',
    BENEFICIARY_REFERENCE: 'beneficiaryReferenceData_v1'
};

// Add these at the top with other constants
const ADMIN_STORAGE_KEY = 'kanamWelfareAdminUser';
let currentAdminUser = null;

// Add this function to check admin status
function isAdminLoggedIn() {
    const adminUser = localStorage.getItem(ADMIN_STORAGE_KEY);
    return adminUser !== null;
}

// Add this function to handle admin login
function handleAdminLogin(username, password) {
    if (username === 'admin' && password === 'admin123') {
        currentAdminUser = { username };
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(currentAdminUser));
        
        // Update UI
        document.getElementById('adminLoginContainer').classList.add('d-none');
        document.getElementById('adminLogoutContainer').classList.remove('d-none');
        
        updateAdminUI();
        return true;
    }
    return false;
}

// Add this function to handle admin logout
function handleAdminLogout() {
    currentAdminUser = null;
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    
    // Update UI
    document.getElementById('adminLoginContainer').classList.remove('d-none');
    document.getElementById('adminLogoutContainer').classList.add('d-none');
    
    updateAdminUI();
}

// Add this function to update UI based on admin status
function updateAdminUI() {
    const isAdmin = isAdminLoggedIn();
    
    // Update all admin-restricted buttons
    document.querySelectorAll('.admin-restricted').forEach(button => {
        button.disabled = !isAdmin;
    });
    
    // Update edit/delete buttons in tables
    document.querySelectorAll('.edit-btn, .delete-btn, .approve-btn').forEach(button => {
        button.disabled = !isAdmin;
    });
}

// Add these functions near the top of app.js after the constants
let pendingAdminAction = null;

function showAdminLogin() {
    const adminLoginModal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    adminLoginModal.show();
}

function requireAdminAuth(action) {
    if (isAdminLoggedIn()) {
        action();
        return;
    }
    
    pendingAdminAction = action;
    const adminPromptModal = new bootstrap.Modal(document.getElementById('adminPromptModal'));
    adminPromptModal.show();
}

// Move chart variables to the top of the file to ensure they are declared before use
let contributionTypeChart = null;
let subLocationMembersChart = null;
let clanChart = null;
let beneficiaryPerformanceChart = null;
let beneficiaryTypeChart = null;
let monthlyTrendsChart = null;

// Add this near the top of the file, after other global variable declarations
function safeQuerySelector(selector, context = document) {
    try {
        if (typeof selector !== 'string') {
            console.warn('[SafeSelector] Invalid selector:', selector);
            return null;
        }
        const element = context.querySelector(selector);
        if (!element) {
            console.warn('[SafeSelector] Element not found:', selector);
        }
        return element;
    } catch (error) {
        console.error('[SafeSelector] Error selecting ' + selector + ':', error);
        return null;
    }
}

// Enhanced error handling wrapper
function safeExecute(fn, errorMessage = 'An error occurred') {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            console.error(errorMessage, error);
            alert(errorMessage);
        }
    };
}

// Initialize settings from localStorage or use defaults
const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS)) || {
    organization: {
        name: 'Kanam Welfare Association',
        address: '',
        logo: null
    },
    appearance: {
        theme: 'light',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d'
    },
    contribution: {
        minAmount: 200,
        maxAmount: 10000,
        requiredConsecutive: 3
    },
    notifications: {
        email: {
            newMember: true,
            contribution: true,
            memberStatus: true
        },
        sms: {
            newMember: false,
            contribution: false
        }
    }
};

// Modify the saveSettings function to update UI elements
function saveSettings() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        applyOrganizationSettings();
        showToast('Settings saved successfully');
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings. Please try again.');
    }
}

// Add new function to apply organization settings
function applyOrganizationSettings() {
    try {
        // Update organization name in the navbar
        const navbarBrand = document.querySelector('.navbar-brand');
        if (navbarBrand) {
            navbarBrand.textContent = settings.organization.name;
        }

        // Update document title
        document.title = settings.organization.name;

        // Update organization name in all modals and headers
        document.querySelectorAll('.modal-title, h1, h2').forEach(element => {
            if (element.textContent.includes('Kanam Welfare')) {
                element.textContent = element.textContent.replace('Kanam Welfare Association', settings.organization.name);
            }
        });

        // Update logo if exists
        const logoPreview = document.querySelector('#logoPreview');
        if (logoPreview && settings.organization.logo) {
            logoPreview.innerHTML = `<img src="${settings.organization.logo}" style="width: 100%; height: 100%; object-fit: contain;">`;
        }

        // Update print headers
        window.printTable = function(tableId) {
            try {
                const originalContents = document.body.innerHTML;
                const printContents = document.getElementById(tableId).outerHTML;
                const printHeader = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2>${settings.organization.name}</h2>
                        ${settings.organization.address ? `<p>${settings.organization.address}</p>` : ''}
                        <p>Community Report - ${tableId.replace('Table', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                `;

                document.body.innerHTML = printHeader + printContents;
                window.print();
                document.body.innerHTML = originalContents;
                location.reload();
            } catch (error) {
                console.error('Print error:', error);
                alert('Error printing table');
            }
        };
    } catch (error) {
        console.error('Error applying organization settings:', error);
    }
}

// Modify the loadSettings function to properly load and apply all settings
function loadSettings() {
    try {
        // Load organization settings
        const orgNameInput = document.querySelector('#orgName');
        const orgAddressInput = document.querySelector('#orgAddress');
        if (orgNameInput) orgNameInput.value = settings.organization.name;
        if (orgAddressInput) orgAddressInput.value = settings.organization.address;

        // Load logo
        const logoPreview = document.querySelector('#logoPreview');
        if (logoPreview && settings.organization.logo) {
            logoPreview.innerHTML = `<img src="${settings.organization.logo}" style="width: 100%; height: 100%; object-fit: contain;">`;
        }

        // Load appearance settings
        const themeSelect = document.querySelector('#themeSelect');
        const primaryColorInput = document.querySelector('#primaryColor');
        const secondaryColorInput = document.querySelector('#secondaryColor');
        if (themeSelect) themeSelect.value = settings.appearance.theme;
        if (primaryColorInput) primaryColorInput.value = settings.appearance.primaryColor;
        if (secondaryColorInput) secondaryColorInput.value = settings.appearance.secondaryColor;

        // Load contribution settings
        const minContribution = document.querySelector('#minContribution');
        const maxContribution = document.querySelector('#maxContribution');
        const requiredContributions = document.querySelector('#requiredContributions');
        if (minContribution) minContribution.value = settings.contribution.minAmount;
        if (maxContribution) maxContribution.value = settings.contribution.maxAmount;
        if (requiredContributions) requiredContributions.value = settings.contribution.requiredConsecutive;

        // Load notification settings
        const notificationElements = {
            email: {
                newMember: document.querySelector('#newMemberNotif'),
                contribution: document.querySelector('#contributionNotif'),
                memberStatus: document.querySelector('#memberStatusNotif')
            },
            sms: {
                newMember: document.querySelector('#smsNewMember'),
                contribution: document.querySelector('#smsContribution')
            }
        };

        Object.entries(notificationElements).forEach(([type, elements]) => {
            Object.entries(elements).forEach(([key, element]) => {
                if (element) {
                    element.checked = settings.notifications[type][key];
                }
            });
        });

        // Apply all settings
        applyTheme();
        applyOrganizationSettings();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Modify the orgSettingsForm event listener
const orgSettingsForm = document.querySelector('#organizationSettingsForm');
if (orgSettingsForm) {
    orgSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        settings.organization.name = document.querySelector('#orgName').value;
        settings.organization.address = document.querySelector('#orgAddress').value;
        saveSettings();
    });

    // Handle logo upload
    const logoUpload = document.querySelector('#logoUpload');
    if (logoUpload) {
        logoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    settings.organization.logo = e.target.result;
                    document.querySelector('#logoPreview').innerHTML = `
                        <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">
                    `;
                    saveSettings();
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Initialize all data variables from localStorage
const DATA_STORE = {
    members: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MEMBERS)) || [],
    approvedMembers: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.APPROVED_MEMBERS)) || [],
    liveMembers: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.LIVE_MEMBERS)) || [],
    contributions: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CONTRIBUTIONS)) || {
        saving: [],
        benevolence: [],
        education: [], 
        health: []
    },
    expenditures: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENDITURES)) || {
        official: [],
        general: []
    },
    beneficiaryReference: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.BENEFICIARY_REFERENCE)) || {}
};

// Function to update all beneficiary-related data
function updateAllBeneficiaryData() {
    try {
        updateBeneficiaryReferenceData();
        updateBeneficiaryMetrics();
        if (beneficiaryPerformanceChart) {
            updateBeneficiaryPerformanceChart(calculateBenevolencePerformance());
        }
    } catch (error) {
        console.error('Error updating beneficiary data:', error);
    }
}

function updateBeneficiaryReferenceData() {
    try {
        const beneficiaryData = {};
        
        // Process all contribution types including saving
        ['saving', 'benevolence', 'education', 'health'].forEach(contributionType => {
            const contributions = DATA_STORE.contributions[contributionType] || [];
            
            contributions.forEach(contribution => {
                if (!contribution.beneficiary) return;
                
                if (!beneficiaryData[contribution.beneficiary]) {
                    beneficiaryData[contribution.beneficiary] = {
                        totalAmount: 0,
                        contributors: new Set(),
                        lastContribution: null,
                        contributions: [],
                        byType: {
                            saving: 0,
                            benevolence: 0,
                            education: 0,
                            health: 0
                        }
                    };
                }
                
                const bData = beneficiaryData[contribution.beneficiary];
                bData.totalAmount += contribution.amount;
                bData.contributors.add(contribution.fullName);
                bData.lastContribution = contribution.date;
                bData.byType[contributionType] += contribution.amount;
                bData.contributions.push({
                    contributor: contribution.fullName,
                    amount: contribution.amount,
                    date: contribution.date,
                    type: contributionType,
                    status: contribution.status || 'Completed'
                });
            });
        });

        // Store beneficiary data in DATA_STORE and localStorage
        DATA_STORE.beneficiaryReference = beneficiaryData;
        localStorage.setItem(LOCAL_STORAGE_KEYS.BENEFICIARY_REFERENCE, JSON.stringify(beneficiaryData));

        // Update the table
        const tbody = document.getElementById('beneficiariesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        let totalAmount = 0;

        Object.entries(beneficiaryData).forEach(([beneficiary, data]) => {
            totalAmount += data.totalAmount;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${beneficiary}</td>
                <td>Ksh ${data.totalAmount.toLocaleString()}</td>
                <td>${data.contributors.size}</td>
                <td>${new Date(data.lastContribution).toLocaleDateString()}</td>
                <td>
                    <div class="contribution-breakdown">
                        ${Object.entries(data.byType)
                            .filter(([_, amount]) => amount > 0)
                            .map(([type, amount]) => 
                                `<span class="badge bg-info">${type}: Ksh ${amount.toLocaleString()}</span>`
                            ).join(' ')}
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-info view-details-btn">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-sm btn-success print-details-btn">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            `;

            // Add event listeners for details and print buttons
            row.querySelector('.view-details-btn').addEventListener('click', () => {
                showBeneficiaryDetails(beneficiary, data);
            });

            row.querySelector('.print-details-btn').addEventListener('click', () => {
                printBeneficiaryDetails(beneficiary);
            });

            tbody.appendChild(row);
        });

        // Update total amount in footer
        const totalElement = document.getElementById('totalBeneficiaryAmount');
        if (totalElement) {
            totalElement.textContent = `Ksh ${totalAmount.toLocaleString()}`;
        }

        // Update metrics
        updateBeneficiaryMetrics();

        // Update charts
        updateBeneficiaryTypeDistributionChart();
        updateMonthlyContributionTrendsChart();

    } catch (error) {
        console.error('Error updating beneficiary reference data:', error);
    }
}

function updateBeneficiaryMetrics() {
    try {
        const beneficiaryData = DATA_STORE.beneficiaryReference || {};
        
        // Calculate metrics
        const totalBeneficiaries = Object.keys(beneficiaryData).length;
        let totalDistributed = 0;
        let totalContributions = 0;

        Object.values(beneficiaryData).forEach(data => {
            totalDistributed += data.totalAmount;
            totalContributions += data.contributions.length;
        });

        const averageContribution = totalContributions > 0 ? 
            Math.round(totalDistributed / totalContributions) : 0;

        // Update UI elements
        document.getElementById('totalBeneficiariesCount').textContent = totalBeneficiaries;
        document.getElementById('totalAmountDistributed').textContent = 
            `Ksh ${totalDistributed.toLocaleString()}`;
        document.getElementById('averageContribution').textContent = 
            `Ksh ${averageContribution.toLocaleString()}`;

    } catch (error) {
        console.error('Error updating beneficiary metrics:', error);
    }
}

// Update the showBeneficiaryDetails function with scrollable table
function showBeneficiaryDetails(beneficiary, data) {
    const modalHtml = `
        <div class="modal fade" id="beneficiaryDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Beneficiary Details - ${beneficiary}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4" id="beneficiaryDetailsPrint">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">Summary</h6>
                                        <p><strong>Total Amount Received:</strong> Ksh ${data.totalAmount.toLocaleString()}</p>
                                        <p><strong>Number of Contributors:</strong> ${data.contributors.size}</p>
                                        <p><strong>Last Contribution:</strong> ${new Date(data.lastContribution).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">Contribution Breakdown</h6>
                                        ${Object.entries(data.byType)
                                            .filter(([_, amount]) => amount > 0)
                                            .map(([type, amount]) => `
                                                <div class="d-flex justify-content-between mb-2">
                                                    <span>${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                                                    <span>Ksh ${amount.toLocaleString()}</span>
                                                </div>
                                            `).join('')}
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 mt-4">
                                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                    <table class="table table-striped">
                                        <thead class="sticky-top bg-white">
                                            <tr>
                                                <th>Contributor</th>
                                                <th>Amount</th>
                                                <th>Type</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${data.contributions
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map(cont => `
                                                    <tr>
                                                        <td>${cont.contributor}</td>
                                                        <td>Ksh ${cont.amount.toLocaleString()}</td>
                                                        <td>${cont.type}</td>
                                                        <td>${new Date(cont.date).toLocaleDateString()}</td>
                                                        <td><span class="badge bg-success">${cont.status}</span></td>
                                                        <td>
                                                            <button class="btn btn-sm btn-info view-contribution-btn" 
                                                                    data-contributor="${cont.contributor}"
                                                                    data-amount="${cont.amount}"
                                                                    data-date="${cont.date}"
                                                                    data-type="${cont.type}">
                                                                <i class="fas fa-eye"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-success print-contribution-btn"
                                                                    data-contributor="${cont.contributor}"
                                                                    data-amount="${cont.amount}"
                                                                    data-date="${cont.date}"
                                                                    data-type="${cont.type}">
                                                                <i class="fas fa-print"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="printBeneficiaryDetails('${beneficiary}')">
                            <i class="fas fa-print me-1"></i> Print Details
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('beneficiaryDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('beneficiaryDetailsModal'));
    modal.show();

    // Add event listeners for action buttons
    document.querySelectorAll('.view-contribution-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const contData = this.dataset;
            alert(`Contribution Details:\n\nContributor: ${contData.contributor}\nAmount: Ksh ${parseInt(contData.amount).toLocaleString()}\nType: ${contData.type}\nDate: ${new Date(contData.date).toLocaleDateString()}`);
        });
    });

    document.querySelectorAll('.print-contribution-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const contData = this.dataset;
            const printContent = `
                <div style="padding: 20px;">
                    <h3 style="text-align: center;">Contribution Receipt</h3>
                    <hr>
                    <p><strong>Contributor:</strong> ${contData.contributor}</p>
                    <p><strong>Amount:</strong> Ksh ${parseInt(contData.amount).toLocaleString()}</p>
                    <p><strong>Type:</strong> ${contData.type}</p>
                    <p><strong>Date:</strong> ${new Date(contData.date).toLocaleDateString()}</p>
                </div>
            `;
            const printWindow = window.open('', '', 'height=500,width=800');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        });
    });
}

function printBeneficiaryDetails(beneficiary) {
    try {
        const data = DATA_STORE.beneficiaryReference[beneficiary];
        if (!data) return;

        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Beneficiary Details - ${beneficiary}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        .no-print { display: none; }
                        .card { border: 1px solid #ddd; }
                        .table { width: 100%; border-collapse: collapse; }
                        .table th, .table td { border: 1px solid #ddd; padding: 8px; }
                        .badge { padding: 5px 10px; border-radius: 4px; }
                        .bg-success { background-color: #28a745 !important; color: white; }
                    }
                    body { padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${settings.organization.name || 'Kanam Welfare Association'}</h2>
                    <h4>Beneficiary Details Report</h4>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>

                <div class="container">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h5>Beneficiary Information</h5>
                                    <p><strong>Name:</strong> ${beneficiary}</p>
                                    <p><strong>Total Amount Received:</strong> Ksh ${data.totalAmount.toLocaleString()}</p>
                                    <p><strong>Number of Contributors:</strong> ${data.contributors.size}</p>
                                    <p><strong>Last Contribution:</strong> ${new Date(data.lastContribution).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h5>Contribution Breakdown by Type</h5>
                                    ${Object.entries(data.byType)
                                        .filter(([_, amount]) => amount > 0)
                                        .map(([type, amount]) => `
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                                                <span>Ksh ${amount.toLocaleString()}</span>
                                            </div>
                                        `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12">
                            <h5>Contribution History</h5>
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Contributor</th>
                                        <th>Amount</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.contributions
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map(cont => `
                                            <tr>
                                                <td>${cont.contributor}</td>
                                                <td>Ksh ${cont.amount.toLocaleString()}</td>
                                                <td>${cont.type}</td>
                                                <td>${new Date(cont.date).toLocaleDateString()}</td>
                                                <td><span class="badge bg-success">${cont.status}</span></td>
                                            </tr>
                                        `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="footer">
                        <p>This is a computer-generated document. No signature is required.</p>
                        <p>${settings.organization.name || 'Kanam Welfare Association'} - Supporting Community Development</p>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

    } catch (error) {
        console.error('Error printing beneficiary details:', error);
        alert('Error printing beneficiary details. Please try again.');
    }
}

function updateBeneficiaryTypeDistributionChart() {
    const ctx = document.getElementById('beneficiaryTypeDistributionChart');
    if (!ctx) return;

    const beneficiaryData = DATA_STORE.beneficiaryReference || {};
    const typeData = {
        saving: 0,
        benevolence: 0,
        education: 0,
        health: 0
    };

    Object.values(beneficiaryData).forEach(data => {
        Object.entries(data.byType).forEach(([type, amount]) => {
            typeData[type] += amount;
        });
    });

    if (beneficiaryTypeChart) {
        beneficiaryTypeChart.destroy();
    }

    beneficiaryTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(typeData),
            datasets: [{
                data: Object.values(typeData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Contribution Distribution by Type'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Add this function to handle sidebar navigation
function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Hide all sections first
            document.querySelectorAll('#content-container > div').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the selected section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(`${targetId}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            
            // Close the sidebar on mobile
            const sidebar = document.querySelector('.sidebar');
            const sidebarOverlay = document.querySelector('.sidebar-overlay');
            if (sidebar && sidebarOverlay) {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
            }
        });
    });
}

function initializeBootstrapComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Initialize dropdowns without jQuery
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    dropdownElementList.map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });

    // Initialize collapsible elements
    const collapseElementList = [].slice.call(document.querySelectorAll('.collapse'));
    collapseElementList.map(function (collapseEl) {
        return new bootstrap.Collapse(collapseEl, {
            toggle: false
        });
    });

    // Initialize modals
    const modalElementList = [].slice.call(document.querySelectorAll('.modal'));
    modalElementList.map(function (modalEl) {
        return new bootstrap.Modal(modalEl);
    });

    // Initialize tabs
    const tabElementList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tab"]'));
    tabElementList.map(function (tabEl) {
        return new bootstrap.Tab(tabEl);
    });
}

function addTableSearchBar(tableBodySelector) {
    const tableBody = document.querySelector(tableBodySelector);
    if (!tableBody) return;

    const tableContainer = tableBody.closest('.card-body') || tableBody.closest('.table-responsive');
    if (!tableContainer) return;

    // Remove any existing search bar
    const existingSearchBar = tableContainer.querySelector('.table-search-bar');
    if (existingSearchBar) {
        existingSearchBar.remove();
    }

    // Create search bar
    const searchBar = document.createElement('div');
    searchBar.classList.add('table-search-bar', 'mb-3');
    searchBar.innerHTML = `
        <input type="text" class="form-control" placeholder="Search table">
    `;

    // Insert search bar before the table
    tableContainer.insertBefore(searchBar, tableBody.closest('table'));

    // Add search functionality
    const searchInput = searchBar.querySelector('input');
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = Array.from(tableBody.querySelectorAll('tr'));

        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(searchTerm) ? '' : 'none';
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize sidebar navigation
        setupSidebarNavigation();

        // Add sidebar toggle functionality
        const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');
        const sidebarCloseBtn = document.querySelector('.sidebar-close');

        if (sidebarToggleBtn && sidebar && sidebarOverlay && sidebarCloseBtn) {
            sidebarToggleBtn.addEventListener('click', function() {
                sidebar.classList.toggle('show');
                sidebarOverlay.classList.toggle('show');
            });

            sidebarOverlay.addEventListener('click', function() {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
            });

            sidebarCloseBtn.addEventListener('click', function() {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
            });
        }

        // Initialize Bootstrap components after DOM is loaded
        initializeBootstrapComponents();

        // Initialize LOCAL_STORAGE_KEYS if not exists to prevent undefined errors
        if (!localStorage.getItem(LOCAL_STORAGE_KEYS.LIVE_MEMBERS)) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.LIVE_MEMBERS, JSON.stringify([]));
        }

        // Load initial data and update UI
        function initializeData() {
            try {
                // Update all tables and metrics
                updateMembersTable();
                updateApprovedMembersTable();
                updateLiveMembersTable();
                updateTotalMembersMetric();
                
                // Update contribution tables and charts
                ['saving', 'benevolence', 'education', 'health'].forEach(type => {
                    updateContributionTable(type);
                });

                // Update expenditure tables
                ['official', 'general'].forEach(type => {
                    updateExpenditureTable(type);
                });

                // Update all metrics
                updateDashboardContributionMetrics();
                updateDashboardExpenditureMetrics();
                updateLiveMembersCount();

                // Update member dropdowns
                populateMemberDropdowns();

                // Load initial settings
                loadSettings();

                // Update beneficiary data and charts
                updateAllBeneficiaryData();
                updateBeneficiaryTypeDistributionChart();
                updateMonthlyContributionTrendsChart();
            } catch (error) {
                console.error('Error initializing data:', error);
            }
        }

        // Initialize data when page loads
        initializeData();

        // Load and display beneficiary reference data
        const savedBeneficiaryData = localStorage.getItem(LOCAL_STORAGE_KEYS.BENEFICIARY_REFERENCE);
        if (savedBeneficiaryData) {
            DATA_STORE.beneficiaryReference = JSON.parse(savedBeneficiaryData);
        }

        // Initialize beneficiary data if it exists
        if (DATA_STORE.beneficiaryReference) {
            updateAllBeneficiaryData();
        }

        function updateMemberRatingAndStatus(mId, contributionType) {
            const memberIndex = DATA_STORE.approvedMembers.findIndex(m => m.memberId === mId);
            
            if (memberIndex === -1) {
                return;
            } 

            let member = DATA_STORE.approvedMembers[memberIndex];

            if (!member.contributionTracking) {
                member.contributionTracking = {
                    saving: 0,
                    benevolence: {
                        count: 0,
                        uniqueBeneficiaries: new Set()
                    },
                    education: 0,
                    health: 0
                };
            }

            if (contributionType === 'benevolence') {
                DATA_STORE.contributions.benevolence.forEach(cont => {
                    if (cont.memberId === mId) {
                        member.contributionTracking.benevolence.uniqueBeneficiaries.add(cont.beneficiary);
                        member.contributionTracking.benevolence.count = member.contributionTracking.benevolence.uniqueBeneficiaries.size;
                    }
                });
            }

            if (member.contributionTracking.benevolence.uniqueBeneficiaries.size >= 5) {
                const existingLiveMember = DATA_STORE.liveMembers.find(lm => lm.memberId === member.memberId);
                
                if (!existingLiveMember) {
                    DATA_STORE.liveMembers.push({
                        ...member,
                        rating: 5, 
                        addedToLiveAt: new Date().toISOString()
                    });
                    localStorage.setItem(LOCAL_STORAGE_KEYS.LIVE_MEMBERS, JSON.stringify(DATA_STORE.liveMembers));
                }
            }

            const totalContributions = Object.values(member.contributionTracking)
                .reduce((total, typeContribution) => {
                    return total + (typeof typeContribution === 'number' ? typeContribution : typeContribution.count);
                }, 0);

            member.rating = Math.min(Math.floor(totalContributions / 5), 5);

            saveApprovedMembers();
            updateLiveMembersTable();
            updateLiveMembersCount();
        }

        function updateContributionTypeChart() {
            const ctx = document.getElementById('contributionTypeChart');
            if (!ctx) return;

            // Get contributions data
            const storedContributions = DATA_STORE.contributions;

            // Calculate total contributions by type
            const contributionTypes = {
                'Saving': storedContributions.saving.reduce((sum, cont) => sum + cont.amount, 0),
                'Benevolence': storedContributions.benevolence.reduce((sum, cont) => sum + cont.amount, 0),
                'Education': storedContributions.education.reduce((sum, cont) => sum + cont.amount, 0),
                'Health': storedContributions.health.reduce((sum, cont) => sum + cont.amount, 0)
            };

            if (contributionTypeChart) {
                contributionTypeChart.destroy();
            }

            contributionTypeChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(contributionTypes),
                    datasets: [{
                        data: Object.values(contributionTypes),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: 'Contribution Types Distribution'
                    }
                }
            });
        }

        function updateSubLocationMembersChart() {
            const ctx = document.getElementById('subLocationMembersChart');
            if (!ctx) return;

            // Count members by sub-location
            const subLocationCount = DATA_STORE.approvedMembers.reduce((counts, member) => {
                counts[member.subLocation] = (counts[member.subLocation] || 0) + 1;
                return counts;
            }, {});

            // Generate a color palette with distinct colors
            const colorPalette = [
                'rgba(255, 99, 132, 0.7)',   // Red
                'rgba(54, 162, 235, 0.7)',   // Blue
                'rgba(255, 206, 86, 0.7)',   // Yellow
                'rgba(75, 192, 192, 0.7)',   // Teal
                'rgba(153, 102, 255, 0.7)',  // Purple
                'rgba(255, 159, 64, 0.7)',   // Orange
                'rgba(199, 199, 199, 0.7)',  // Grey
                'rgba(83, 102, 255, 0.7)',   // Indigo
                'rgba(40, 159, 64, 0.7)'    // Green
            ];

            // Assign unique colors to each sub-location
            const backgroundColors = Object.keys(subLocationCount).map((location, index) => 
                colorPalette[index % colorPalette.length]
            );

            if (subLocationMembersChart) {
                subLocationMembersChart.destroy();
            }

            subLocationMembersChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(subLocationCount),
                    datasets: [{
                        label: 'Members',
                        data: Object.values(subLocationCount),
                        backgroundColor: backgroundColors,
                        borderColor: backgroundColors.map(color => color.replace('0.7)', '1)')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Members'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Members by Sub-Location'
                        }
                    }
                }
            });
        }

        function updateClanAnalysisChart() {
            const ctx = document.getElementById('clanAnalysisChart');
            if (!ctx) return;

            // Count members by clan
            const clanCount = DATA_STORE.approvedMembers.reduce((counts, member) => {
                counts[member.clan] = (counts[member.clan] || 0) + 1;
                return counts;
            }, {});

            if (clanChart) {
                clanChart.destroy();
            }

            clanChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(clanCount),
                    datasets: [{
                        data: Object.values(clanCount),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: 'Members by Clan Distribution'
                    }
                }
            });
        }

        function updateLiveMembersTable() {
            const liveMembersTableBody = document.getElementById('liveMembersTableBody');
            if (!liveMembersTableBody) return;

            liveMembersTableBody.innerHTML = '';

            // Calculate performance data to determine live members
            const performanceData = calculateBenevolencePerformance();

            // Filter live members based on performance criteria
            const liveMemberCandidates = Object.entries(performanceData)
                .filter(([memberId, performance]) => 
                    performance.uniqueBeneficiaries.size >= 5
                )
                .map(([memberId, performance]) => {
                    // Find the full member details in approved members
                    const memberDetails = DATA_STORE.approvedMembers.find(m => m.memberId === memberId);
                    
                    return {
                        ...memberDetails,
                        memberId,
                        consecutiveContributions: performance.uniqueBeneficiaries.size,
                        rating: 5, 
                        beneficiaries: Array.from(performance.uniqueBeneficiaries),
                        totalContributions: performance.totalContributions
                    };
                });

            // Update the live members data store
            DATA_STORE.liveMembers = liveMemberCandidates;
            localStorage.setItem(LOCAL_STORAGE_KEYS.LIVE_MEMBERS, JSON.stringify(DATA_STORE.liveMembers));

            // Populate the live members table
            liveMemberCandidates.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${member.memberId}</td>
                    <td>${member.fullName}</td>
                    <td>${member.contact}</td>
                    <td>${member.subLocation}</td>
                    <td>${member.clan}</td>
                    <td>${member.consecutiveContributions}</td>
                    <td>
                        <div class="rating">
                            ${Array(5).fill().map((_, i) => 
                                `<i class="fas fa-star ${i < 5 ? 'text-warning' : ''}"></i>`
                            ).join('')}
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning details-btn">Details</button>
                    </td>
                `;

                // Add details button functionality
                const detailsBtn = row.querySelector('.details-btn');
                detailsBtn.addEventListener('click', () => {
                    const detailsContent = `
                        <div class="modal fade" id="memberDetailsModal" tabindex="-1" aria-labelledby="memberDetailsModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-lg">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="memberDetailsModalLabel">Member Details - ${member.fullName}</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div class="modal-body">
                                        <form class="member-details-form">
                                            <div class="row mb-4">
                                                <div class="col-md-6">
                                                    <h6 class="text-primary">Personal Information</h6>
                                                    <div class="mb-3">
                                                        <label class="form-label">Member ID</label>
                                                        <input type="text" class="form-control" value="${member.memberId}" readonly>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Full Name</label>
                                                        <input type="text" class="form-control" value="${member.fullName}" readonly>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Contact</label>
                                                        <input type="text" class="form-control" value="${member.contact}" readonly>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <h6 class="text-primary">Location Details</h6>
                                                    <div class="mb-3">
                                                        <label class="form-label">Sub-Location</label>
                                                        <input type="text" class="form-control" value="${member.subLocation}" readonly>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Clan</label>
                                                        <input type="text" class="form-control" value="${member.clan}" readonly>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row mb-4">
                                                <div class="col-12">
                                                    <h6 class="text-primary">Contribution Statistics</h6>
                                                    <div class="table-responsive">
                                                        <table class="table table-bordered">
                                                            <thead class="table-light">
                                                                <tr>
                                                                    <th>Total Contributions</th>
                                                                    <th>Consecutive Contributions</th>
                                                                    <th>Rating</th>
                                                                    <th>Member Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>Ksh ${member.totalContributions?.toLocaleString() || '0'}</td>
                                                                    <td>${member.consecutiveContributions || '0'}</td>
                                                                    <td>
                                                                        <div class="rating">
                                                                            ${Array(5).fill().map((_, i) => 
                                                                                `<i class="fas fa-star ${i < 5 ? 'text-warning' : ''}"></i>`
                                                                            ).join('')}
                                                                        </div>
                                                                    </td>
                                                                    <td><span class="badge bg-success">Live Member</span></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="row">
                                                <div class="col-12">
                                                    <h6 class="text-primary">Beneficiary Contributions</h6>
                                                    <div class="table-responsive">
                                                        <table class="table table-striped">
                                                            <thead>
                                                                <tr>
                                                                    <th>Beneficiary</th>
                                                                    <th>Amount</th>
                                                                    <th>Date</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                ${member.beneficiaries.map((beneficiary, index) => `
                                                                    <tr>
                                                                        <td>${beneficiary}</td>
                                                                        <td>Ksh ${(member.totalContributions / member.beneficiaries.length).toLocaleString()}</td>
                                                                        <td>${new Date().toLocaleDateString()}</td>
                                                                    </tr>
                                                                `).join('')}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div class="modal-footer bg-light">
                                        <div class="d-flex justify-content-between w-100">
                                            <div class="text-muted">
                                                <small>Member since: ${new Date(member.registrationDate || Date.now()).toLocaleDateString()}</small>
                                            </div>
                                            <div>
                                                <button type="button" class="btn btn-primary" onclick="window.print()">
                                                    <i class="fas fa-print me-1"></i> Print Details
                                                </button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    // Create and show the modal
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = detailsContent;
                    document.body.appendChild(tempDiv.firstChild);
                    
                    const modalElement = document.body.lastChild;
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();

                    // Remove modal from DOM when closed
                    modalElement.addEventListener('hidden.bs.modal', () => {
                        document.body.removeChild(modalElement);
                    });
                });

                liveMembersTableBody.appendChild(row);
            });

            // Update live members count
            updateLiveMembersCount();
        }

        function updateLiveMembersCount() {
            const liveMembersCountElement = document.getElementById('liveMembersCount');
            if (liveMembersCountElement) {
                liveMembersCountElement.textContent = DATA_STORE.liveMembers.length;
            }
        }

        // Modify the updateContributionTable function to include totals calculation
        function updateContributionTable(type) {
            const tbody = document.getElementById(`${type}ContributionsBody`);
            if (!tbody) return;

            // Remove any existing search bar first
            const existingSearchBar = tbody.parentNode.querySelector('.table-search-bar');
            if (existingSearchBar) {
                existingSearchBar.remove();
            }

            tbody.innerHTML = '';
            
            let totalAmount = 0;
            let totalPaid = 0;
            let totalBalance = 0;

            const conts = DATA_STORE.contributions[type] || [];
            
            // Calculate totals first
            conts.forEach(con => {
                totalAmount += Number(con.amount) || 0;
                totalPaid += Number(con.paid) || 0;
                totalBalance += Number(con.balance) || 0;
            });

            // Add search bar with proper placement
            const parent = tbody.parentNode.parentNode;
            if (parent) {
                const searchBar = document.createElement('div');
                searchBar.classList.add('table-search-bar');
                searchBar.innerHTML = `<input type="text" class="form-control" placeholder="Search ${type} contributions">`;
                parent.insertBefore(searchBar, tbody.parentNode);
                searchBar.querySelector('input').addEventListener('keyup', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const rows = Array.from(tbody.querySelectorAll('tr'));

                    rows.forEach(row => {
                        const rowText = row.textContent.toLowerCase();
                        row.style.display = rowText.includes(searchTerm) ? '' : 'none';
                    });
                });
            }

            conts.forEach(con => {
                // Existing row creation code
                const member = DATA_STORE.approvedMembers.find(m => m.memberId === con.memberId) || DATA_STORE.approvedMembers.find(m => m.fullName === con.fullName);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${con.id}</td>
                    <td>${member ? member.fullName : con.fullName || 'Unknown'}</td>
                    <td>Ksh ${(con.amount || 0).toLocaleString()}</td>
                    <td>Ksh ${(con.paid || 0).toLocaleString()}</td>
                    <td>Ksh ${(con.balance || 0).toLocaleString()}</td>
                    <td>${con.beneficiary || ''}</td>
                    <td>${new Date(con.date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-success pay-btn">Pay</button>
                        <button class="btn btn-sm btn-info receipt-btn">Receipt</button>
                        <button class="btn btn-sm btn-warning edit-btn">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                    </td>
                `;

                // Add button event listeners
                row.querySelector('.pay-btn').addEventListener('click', () => {
                    const amount = parseFloat(prompt('Enter payment amount:'));
                    if (!isNaN(amount) && amount > 0) {
                        con.paid += amount;
                        con.balance = con.amount - con.paid;
                        DATA_STORE.contributions[type] = conts;
                        localStorage.setItem(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(DATA_STORE.contributions));
                        updateContributionTable(type);
                        updateDashboardContributionMetrics();
                    }
                });

                row.querySelector('.receipt-btn').addEventListener('click', () => {
                    const contributionType = type;
                    const contributionData = con;

                    const receiptContent = `
                        <html>
                            <head>
                                <title>Contribution Receipt</title>
                                <style>
                                    body {
                                        font-family: 'Courier New', monospace;
                                        max-width: 600px;
                                        margin: 0 auto;
                                        padding: 20px;
                                        line-height: 1.6;
                                        color: #333;
                                        background-color: #f4f4f4;
                                    }
                                    .receipt {
                                        background-color: white;
                                        border: 1px solid #ddd;
                                        border-radius: 8px;
                                        padding: 20px;
                                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                    }
                                    .receipt-header {
                                        text-align: center;
                                        border-bottom: 2px solid #007bff;
                                        padding-bottom: 15px;
                                        margin-bottom: 20px;
                                    }
                                    .receipt-header h2 {
                                        color: #007bff;
                                        margin-bottom: 5px;
                                        letter-spacing: 1px;
                                    }
                                    .receipt-details {
                                        display: flex;
                                        justify-content: space-between;
                                        margin-bottom: 20px;
                                        padding: 10px;
                                        background-color: #f8f9fa;
                                        border-radius: 5px;
                                        font-size: 14px;
                                    }
                                    .receipt-amount {
                                        text-align: center;
                                        font-size: 1.2em;
                                        font-weight: bold;
                                        color: #28a745;
                                        margin-bottom: 20px;
                                        background-color: #e9ecef;
                                        padding: 10px;
                                        border-radius: 5px;
                                    }
                                    .receipt-footer {
                                        margin-top: 30px;
                                        text-align: center;
                                        border-top: 2px solid #007bff;
                                        padding-top: 15px;
                                        color: #6c757d;
                                        font-size: 12px;
                                    }
                                    .receipt-line {
                                        display: flex;
                                        justify-content: space-between;
                                        margin-bottom: 10px;
                                        border-bottom: 1px dotted #ddd;
                                        padding-bottom: 5px;
                                    }
                                    .barcode {
                                        text-align: center;
                                        margin-bottom: 20px;
                                    }
                                    .barcode img {
                                        height: 50px; 
                                    }
                                    @media print {
                                        body {
                                            margin: 0;
                                            padding: 10px;
                                            background-color: white;
                                        }
                                        .receipt {
                                            border: none;
                                            box-shadow: none;
                                            padding: 0;
                                        }
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="receipt">
                                    <div class="receipt-header">
                                        <h2>Kanam Welfare Association</h2>
                                        <p>Official Contribution Receipt</p>
                                    </div>
                                    <div class="barcode">
                                        <img src="https://barcode.tec-it.com/barcode.ashx?data=${contributionData.id}&code=Code128&multiplebarcodes=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=000000&bgcolor=FFFFFF&qunit=Mm&quiet=0" alt="Barcode">
                                        <p>${contributionData.id}</p>
                                    </div>
                                    <div class="receipt-details">
                                        <div>
                                            <div class="receipt-line">
                                                <span>Contribution Type:</span>
                                                <span>${contributionType.charAt(0).toUpperCase() + contributionType.slice(1)}</span>
                                            </div>
                                            <div class="receipt-line">
                                                <span>Member Name:</span>
                                                <span>${contributionData.fullName}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div class="receipt-line">
                                                <span>Date:</span>
                                                <span>${new Date(contributionData.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="receipt-amount">
                                        <div class="receipt-line">
                                            <span>Total Amount:</span>
                                            <span>Ksh ${contributionData.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div class="receipt-details">
                                        <div>
                                            <div class="receipt-line">
                                                <span>Beneficiary:</span>
                                                <span>${contributionData.beneficiary}</span>
                                            </div>
                                            <div class="receipt-line">
                                                <span>Paid Amount:</span>
                                                <span>Ksh ${contributionData.paid.toLocaleString()}</span>
                                            </div>
                                            <div class="receipt-line">
                                                <span>Remaining Balance:</span>
                                                <span>Ksh ${((contributionData.balance) || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="receipt-footer">
                                        <p>Thank you for your contribution to community development!</p>
                                        <p>Kanam Welfare Association - Empowering Communities</p>
                                    </div>
                                </div>
                                <script>
                                    window.onload = function() {
                                        window.print();
                                        window.onafterprint = function() {
                                            window.close();
                                        };
                                    }
                                </script>
                            </body>
                        </html>
                    `;


                    // Create a new window for printing
                    const printWindow = window.open('', '_blank', 'width=600,height=800');
                    printWindow.document.write(receiptContent);
                    printWindow.document.close();
                });

                row.querySelector('.edit-btn').addEventListener('click', () => {
                    const newAmount = parseFloat(prompt('Enter new amount:', con.amount));
                    if (!isNaN(newAmount) && newAmount > 0) {
                        con.amount = newAmount;
                        con.balance = newAmount - con.paid;
                        DATA_STORE.contributions[type] = conts;
                        localStorage.setItem(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(DATA_STORE.contributions));
                        updateContributionTable(type);
                        updateDashboardContributionMetrics();
                    }
                });

                row.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this contribution?')) {
                        DATA_STORE.contributions[type] = conts.filter(c => c.id !== con.id);
                        localStorage.setItem(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(DATA_STORE.contributions));
                        updateContributionTable(type);
                        updateDashboardContributionMetrics();
                    }
                });

                tbody.appendChild(row);
            });

            // Update totals in table footer - make sure to update the correct elements
            const totalAmountElement = document.getElementById(`${type}ContributionsTotalAmount`);
            const totalPaidElement = document.getElementById(`${type}ContributionsTotalPaid`);
            const totalBalanceElement = document.getElementById(`${type}ContributionsTotalBalance`);

            if (totalAmountElement) totalAmountElement.textContent = `Ksh ${totalAmount.toLocaleString()}`;
            if (totalPaidElement) totalPaidElement.textContent = `Ksh ${totalPaid.toLocaleString()}`;
            if (totalBalanceElement) totalBalanceElement.textContent = `Ksh ${totalBalance.toLocaleString()}`;

            // Also update dashboard metrics when contribution table is updated
            updateDashboardContributionMetrics();
        }

        function updateDashboardContributionMetrics() {
            try {
                let totalAmount = 0;
                Object.values(DATA_STORE.contributions).forEach(typeContributions => {
                    typeContributions.forEach(contribution => {
                        totalAmount += contribution.amount || 0;
                    });
                });

                document.getElementById('totalContributionsAmount').textContent = `Ksh ${totalAmount.toLocaleString()}`;

                updateContributionTypeChart();
                updateSubLocationMembersChart();
                updateClanAnalysisChart();

                updateRecentContributionsTable(DATA_STORE.contributions);

            } catch (error) {
                console.error('Error updating dashboard metrics:', error);
            }
        }

        function updateRecentContributionsTable(contributions) {
            const recentContributionsBody = document.getElementById('recentContributionsBody');
            if (!recentContributionsBody) return;

            // Combine all contribution types and sort by date
            const allContributions = [
                ...contributions.saving || [],
                ...contributions.benevolence || [],
                ...contributions.education || [],
                ...contributions.health || []
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            // Take only the most recent 5 contributions
            const recentContributions = allContributions.slice(0, 5);

            recentContributionsBody.innerHTML = recentContributions.map(contribution => `
                <tr>
                    <td>${contribution.fullName}</td>
                    <td>${contribution.type || 'N/A'}</td>
                    <td>Ksh ${contribution.amount.toLocaleString()}</td>
                    <td>${new Date(contribution.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        // Modify the handleContributionSubmit function to properly initialize paid and balance
        function handleContributionSubmit(type, event) {
            event.preventDefault();
            
            try {
                const memberNameInput = document.getElementById(`${type}ContributionMemberName`);
                const amountInput = document.getElementById(`${type}ContributionAmount`);
                const beneficiaryInput = document.getElementById(`${type}ContributionBeneficiary`);
                const dateInput = document.getElementById(`${type}ContributionDate`);

                if (!memberNameInput || !amountInput) {
                    throw new Error('Required form fields not found');
                }

                const memberName = memberNameInput.value.trim();
                const amount = parseFloat(amountInput.value);
                const beneficiary = beneficiaryInput ? beneficiaryInput.value.trim() : '';
                const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

                if (!memberName || isNaN(amount) || amount <= 0) {
                    alert('Please fill all required fields correctly');
                    return;
                }

                // Find member in approved members
                const member = DATA_STORE.approvedMembers.find(m => m.fullName === memberName);
                if (!member) {
                    alert('Member not found in approved members list');
                    return;
                }

                // Initialize the contributions type array if it doesn't exist
                if (!DATA_STORE.contributions[type]) {
                    DATA_STORE.contributions[type] = [];
                }

                // Create new contribution record with properly initialized paid and balance fields
                const newContribution = {
                    id: `CONT-${type.toUpperCase()}-${Date.now().toString().slice(-6)}`,
                    memberId: member.memberId,
                    fullName: memberName,
                    amount: amount,
                    paid: 0, // Initialize paid amount to 0
                    balance: amount, // Initialize balance to full amount
                    date: date,
                    type: type,
                    beneficiary: beneficiary
                };

                // Add new contribution to data store
                DATA_STORE.contributions[type].push(newContribution);

                // Save all contributions to localStorage
                localStorage.setItem(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(DATA_STORE.contributions));

                // Update member status if it's a benevolence contribution
                if (type === 'benevolence' && member.memberId) {
                    updateMemberRatingAndStatus(member.memberId, type);
                }

                // Update all relevant UI components
                updateContributionTable(type);
                updateDashboardContributionMetrics();
                updateAllBeneficiaryData();
                
                // Reset form
                event.target.reset();
                
                // Show success message
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} contribution added successfully!`);

                // If it's a benevolence contribution, update performance data
                if (type === 'benevolence') {
                    updatePerformanceTable();
                }

                return true;

            } catch (error) {
                console.error('Error adding contribution:', error);
                alert('Error adding contribution. Please try again.');
                return false;
            }
        }

        // Update the contribution form event listeners
        const contributionForms = {
            saving: document.getElementById('savingContributionForm'),
            benevolence: document.getElementById('benevolenceContributionForm'),
            education: document.getElementById('educationContributionForm'),
            health: document.getElementById('healthContributionForm')
        };

        Object.entries(contributionForms).forEach(([type, form]) => {
            if (form) {
                form.addEventListener('submit', function(e) {
                    handleContributionSubmit(type, e);
                });
            }
        });

        // Expenditure Management
        function saveExpenditures() {
            localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENDITURES, JSON.stringify(DATA_STORE.expenditures));
        }

        function getExpendituresData() {
            return DATA_STORE.expenditures;
        }

        function restoreExpendituresData(data) {
            DATA_STORE.expenditures = data;
            saveExpenditures();
            // Update expenditure tables for each type
            ['official', 'general'].forEach(type => updateExpenditureTable(type));
        }

        function updateExpenditureTable(type) {
            const tableBody = document.getElementById(`${type}ExpendituresBody`);
            if (!tableBody) {
                console.warn(`Expenditure table body not found for type: ${type}`);
                return;
            }

            // Remove any existing search bar first
            const existingSearchBar = tableBody.parentNode.querySelector('.table-search-bar');
            if (existingSearchBar) {
                existingSearchBar.remove();
            }

            const typeExpenditures = DATA_STORE.expenditures[type] || [];

            tableBody.innerHTML = '';

            try {
                // Add search bar with proper placement
                const parent = tableBody.parentNode.parentNode;
                if (parent) {
                    const searchBar = document.createElement('div');
                    searchBar.classList.add('table-search-bar');
                    searchBar.innerHTML = `<input type="text" class="form-control" placeholder="Search ${type} expenditures">`;
                    parent.insertBefore(searchBar, tableBody.parentNode);
                    searchBar.querySelector('input').addEventListener('keyup', (e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const rows = Array.from(tableBody.querySelectorAll('tr'));

                        rows.forEach(row => {
                            const rowText = row.textContent.toLowerCase();
                            row.style.display = rowText.includes(searchTerm) ? '' : 'none';
                        });
                    });
                }

                typeExpenditures.forEach(expenditure => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${expenditure.id}</td>
                        <td>${expenditure.type}</td>
                        <td>Ksh ${expenditure.amount.toLocaleString()}</td>
                        <td>${expenditure.description}</td>
                        <td>${new Date(expenditure.date).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-warning edit-btn">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                        </td>
                    `;

                    row.querySelector('.edit-btn').addEventListener('click', () => {
                        const newAmount = parseFloat(prompt('Enter new amount:', expenditure.amount));
                        if (!isNaN(newAmount) && newAmount > 0) {
                            expenditure.amount = newAmount;
                            DATA_STORE.expenditures[type] = typeExpenditures;
                            saveExpenditures();
                            updateExpenditureTable(type);
                            updateDashboardExpenditureMetrics();
                        }
                    });

                    row.querySelector('.delete-btn').addEventListener('click', () => {
                        if (confirm('Are you sure you want to delete this expenditure?')) {
                            DATA_STORE.expenditures[type] = typeExpenditures.filter(e => e.id !== expenditure.id);
                            saveExpenditures();
                            updateExpenditureTable(type);
                            updateDashboardExpenditureMetrics();
                        }
                    });

                    tableBody.appendChild(row);
                });

                // Calculate and display total amount
                const totalAmount = typeExpenditures.reduce((sum, exp) => sum + exp.amount, 0);
                const totalAmountElement = document.getElementById(`${type}ExpendituresTotalAmount`);
                if (totalAmountElement) {
                    totalAmountElement.textContent = `Ksh ${totalAmount.toLocaleString()}`;
                }
            } catch (error) {
                console.error(`Error updating expenditure table for type ${type}:`, error);
            }
        }

        function updateDashboardExpenditureMetrics() {
            try {
                let totalExpenditureAmount = 0;
                Object.values(DATA_STORE.expenditures).forEach(typeExpenditures => {
                    typeExpenditures.forEach(expenditure => {
                        totalExpenditureAmount += expenditure.amount || 0;
                    });
                });

                const totalExpendituresElement = document.getElementById('totalExpendituresAmount');
                if (totalExpendituresElement) {
                    totalExpendituresElement.textContent = `Ksh ${totalExpenditureAmount.toLocaleString()}`;
                }

                updateRecentExpendituresTable(DATA_STORE.expenditures);

            } catch (error) {
                console.error('Error updating dashboard expenditure metrics:', error);
            }
        }

        function updateRecentExpendituresTable(expenditures) {
            const recentExpendituresBody = document.getElementById('recentExpendituresBody');
            if (!recentExpendituresBody) return;

            const allExpenditures = [
                ...expenditures.official || [],
                ...expenditures.general || []
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            const recentExpenditures = allExpenditures.slice(0, 5);

            recentExpendituresBody.innerHTML = recentExpenditures.map(expenditure => `
                <tr>
                    <td>${expenditure.type || 'N/A'}</td>
                    <td>${expenditure.description}</td>
                    <td>Ksh ${expenditure.amount.toLocaleString()}</td>
                    <td>${new Date(expenditure.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        const officialExpenditureForm = document.getElementById('officialExpenditureForm');
        const generalExpenditureForm = document.getElementById('generalExpenditureForm');

        if (officialExpenditureForm) {
            officialExpenditureForm.addEventListener('submit', (e) => handleExpenditureSubmit('official', e));
        }
        if (generalExpenditureForm) {
            generalExpenditureForm.addEventListener('submit', (e) => handleExpenditureSubmit('general', e));
        }

        // Settings Management
        // ... existing code ...

        // Data Management
        function saveMembers() {
            try {
                localStorage.setItem(LOCAL_STORAGE_KEYS.MEMBERS, JSON.stringify(DATA_STORE.members));
            } catch (error) {
                console.error('Error saving members:', error);
                throw error;
            }
        }

        function addApprovedMember(member) {
            try {
                DATA_STORE.approvedMembers.push({
                    ...member,
                    approvalDate: new Date().toISOString()
                });
                saveApprovedMembers();
                populateMemberDropdowns();
                updateTotalMembersMetric();
            } catch (error) {
                console.error('Error adding approved member:', error);
                throw error;
            }
        }

        const backupDataBtn = document.getElementById('backupDataBtn');
        const restoreDataBtn = document.getElementById('restoreDataBtn');
        const resetDataBtn = document.getElementById('resetDataBtn');
        const restoreFileInput = document.getElementById('restoreFileInput');

        if (backupDataBtn) {
            backupDataBtn.addEventListener('click', () => {
                requireAdminAuth(() => {
                    backupAppData();
                });
            });
        }

        if (restoreDataBtn && restoreFileInput) {
            restoreFileInput.addEventListener('change', async (e) => {
                try {
                    const file = e.target.files[0];
                    if (!file) {
                        alert('No file selected.');
                        return;
                    }

                    if (file.type !== 'application/json') {
                        alert('Please select a valid JSON backup file.');
                        return;
                    }

                    const confirmed = confirm(
                        'Warning: Restoring data will replace all current data. ' +
                        'Make sure you have backed up your current data before proceeding. ' +
                        'Do you want to continue?'
                    );

                    if (confirmed) {
                        await restoreAppData(file);
                    }
                } catch (error) {
                    console.error('Restore error:', error);
                    alert(error.message || 'Error restoring data. Please try again.');
                } finally {
                    // Clear the input to allow selecting the same file again
                    restoreFileInput.value = '';
                }
            });

            restoreDataBtn.addEventListener('click', () => {
                requireAdminAuth(() => {
                    restoreFileInput.click();
                });
            });
        }

        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                requireAdminAuth(() => {
                    const confirmed = confirm(
                        'WARNING: This will permanently delete all data and cannot be undone. ' +
                        'Are you absolutely sure you want to continue?'
                    );
                    
                    if (confirmed) {
                        try {
                            // Clear all data from localStorage
                            Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
                                localStorage.removeItem(key);
                            });
                            
                            alert('All data has been reset. The page will now reload.');
                            window.location.reload();
                        } catch (error) {
                            console.error('Reset error:', error);
                            alert('Error resetting data. Please try again.');
                        }
                    }
                });
            });
        }

        // Check initial admin status
        if (isAdminLoggedIn()) {
            document.getElementById('adminLoginContainer').classList.add('d-none');
            document.getElementById('adminLogoutContainer').classList.remove('d-none');
            updateAdminUI();
        }

        // Helper functions
        function saveSettings() {
            localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        }

        function loadSettings() {
            // ... existing code ...
        }

        function applyTheme() {
            const root = document.documentElement;
            root.style.setProperty('--primary-color', settings.appearance.primaryColor);
            root.style.setProperty('--secondary-color', settings.appearance.secondaryColor);

            if (settings.appearance.theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }

        function showToast(message, type = 'success') {
            alert(message);
        }

        // Live Member Management
        function getLiveMembersData() {
            return DATA_STORE.liveMembers;
        }

        function restoreLiveMembersData(data) {
            DATA_STORE.liveMembers = data;
            localStorage.setItem(LOCAL_STORAGE_KEYS.LIVE_MEMBERS, JSON.stringify(DATA_STORE.liveMembers));
            updateLiveMembersTable();
        }

        // Approved Member Management
        function saveApprovedMembers() {
            localStorage.setItem(LOCAL_STORAGE_KEYS.APPROVED_MEMBERS, JSON.stringify(DATA_STORE.approvedMembers));
        }

        function getApprovedMembersData() {
            return DATA_STORE.approvedMembers;
        }

        // Modify addMember function to properly save member data
        function addMember(fullName, contact, subLocation, clan, status) {
            try {
                const memberId = generateMemberID();
                const newMember = { 
                    memberId, 
                    fullName, 
                    contact, 
                    subLocation, 
                    clan, 
                    status,
                    consecutiveContributions: 0,
                    rating: 0,
                    registrationDate: new Date().toISOString().split('T')[0]
                };
                
                DATA_STORE.members.push(newMember);
                localStorage.setItem(LOCAL_STORAGE_KEYS.MEMBERS, JSON.stringify(DATA_STORE.members));
                updateMembersTable();
                updateTotalMembersMetric();
                return true;
            } catch (error) {
                console.error('Error adding member:', error);
                return false;
            }
        }

        // Add this function to handle member editing for both registration and approved members
        function editMember(memberId, updatedData, isApproved = false) {
            try {
                const collection = isApproved ? DATA_STORE.approvedMembers : DATA_STORE.members;
                const index = collection.findIndex(m => m.memberId === memberId);
                
                if (index === -1) {
                    throw new Error('Member not found');
                }

                // Update member data while preserving other properties
                collection[index] = {
                    ...collection[index],
                    ...updatedData,
                    lastModified: new Date().toISOString()
                };

                // Save to appropriate storage
                if (isApproved) {
                    localStorage.setItem(LOCAL_STORAGE_KEYS.APPROVED_MEMBERS, JSON.stringify(DATA_STORE.approvedMembers));
                    updateApprovedMembersTable();
                } else {
                    localStorage.setItem(LOCAL_STORAGE_KEYS.MEMBERS, JSON.stringify(DATA_STORE.members));
                    updateMembersTable();
                }

                // Update member dropdowns and metrics
                populateMemberDropdowns();
                updateTotalMembersMetric();
                
                return true;
            } catch (error) {
                console.error('Error editing member:', error);
                return false;
            }
        }

        // Update the registration form handling
        function setupFormSubmission(formSelector, submitHandler) {
            const forms = document.querySelectorAll(formSelector);

            forms.forEach(form => {
                if (!form) {
                    console.error(`[FormSetup] No form found for selector: ${formSelector}`);
                    return;
                }

                form.addEventListener('submit', function(e) {
                    e.preventDefault();

                    try {
                        const result = submitHandler(form);
                        if (result) {
                            form.reset();
                            alert('Operation completed successfully!');
                        }
                    } catch (error) {
                        console.error(`[FormSubmission] Error in ${formSelector}:`, error);
                        alert('An error occurred while processing the form');
                    }
                });
            });
        }

        // Add this function to handle member editing for both registration and approved members
        function showEditMemberModal(member, isApproved) {
            try {
                // Remove any existing edit modal first
                const existingModal = document.getElementById('editMemberModal');
                if (existingModal) {
                    existingModal.remove();
                }

                const modalContent = `
                    <div class="modal fade" id="editMemberModal" tabindex="-1" aria-labelledby="editMemberModalLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="editMemberModalLabel">Edit Member Details</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="editMemberForm">
                                        <div class="mb-3">
                                            <label class="form-label">Full Name</label>
                                            <input type="text" class="form-control" id="editFullName" value="${member.fullName || ''}" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Contact</label>
                                            <input type="tel" class="form-control" id="editContact" value="${member.contact || ''}" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Sub-Location</label>
                                            <select class="form-select" id="editSubLocation" required>
                                                <option value="KOWUOR" ${member.subLocation === 'KOWUOR' ? 'selected' : ''}>Kowuor</option>
                                                <option value="KOGUTA" ${member.subLocation === 'KOGUTA' ? 'selected' : ''}>Koguta</option>
                                                <option value="KANYADENDA" ${member.subLocation === 'KANYADENDA' ? 'selected' : ''}>Kanyadenda</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Clan</label>
                                            <select class="form-select" id="editClan" required>
                                                ${document.getElementById('clan')?.innerHTML || ''}
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Status</label>
                                            <select class="form-select" id="editStatus" required>
                                                <option value="ACTIVE" ${member.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
                                                <option value="INACTIVE" ${member.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
                                            </select>
                                        </div>
                                        <input type="hidden" id="editMemberId" value="${member.memberId}">
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                            <button type="submit" class="btn btn-primary">Save Changes</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Add modal to DOM
                document.body.insertAdjacentHTML('beforeend', modalContent);

                // Get modal element
                const modalElement = document.getElementById('editMemberModal');
                if (!modalElement) {
                    throw new Error('Failed to create modal element');
                }

                // Initialize modal with Bootstrap
                const modal = new bootstrap.Modal(modalElement, {
                    backdrop: 'static',
                    keyboard: false
                });

                // Set the clan value after modal is added to DOM
                const clanSelect = document.getElementById('editClan');
                if (clanSelect) {
                    clanSelect.value = member.clan || '';
                }

                // Handle form submission
                const editForm = document.getElementById('editMemberForm');
                if (editForm) {
                    editForm.addEventListener('submit', function(e) {
                        e.preventDefault();

                        const updatedData = {
                            fullName: document.getElementById('editFullName')?.value.trim(),
                            contact: document.getElementById('editContact')?.value.trim(),
                            subLocation: document.getElementById('editSubLocation')?.value,
                            clan: document.getElementById('editClan')?.value,
                            status: document.getElementById('editStatus')?.value
                        };

                        const success = editMember(member.memberId, updatedData, isApproved);
                        
                        if (success) {
                            modal.hide();
                            alert('Member details updated successfully!');
                        }
                    });
                }

                // Handle modal cleanup
                modalElement.addEventListener('hidden.bs.modal', function() {
                    this.remove();
                });

                // Show modal
                modal.show();

            } catch (error) {
                console.error('Error showing edit modal:', error);
                alert('Error showing edit form. Please try again.');
            }
        }

        function updateMembersTable() {
            const membersTableBody = document.getElementById('membersTableBody');
            if (!membersTableBody) return;

            membersTableBody.innerHTML = '';
            
            DATA_STORE.members.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${member.memberId}</td>
                    <td>${member.fullName}</td>
                    <td>${member.contact}</td>
                    <td>${member.subLocation}</td>
                    <td>${member.clan}</td>
                    <td>${member.status}</td>
                    <td>
                        <button class="btn btn-sm btn-success approve-btn admin-restricted">Approve</button>
                        <button class="btn btn-sm btn-warning edit-btn admin-restricted">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn admin-restricted">Delete</button>
                    </td>
                `;

                // Add edit functionality
                row.querySelector('.edit-btn').addEventListener('click', () => {
                    requireAdminAuth(() => {
                        showEditMemberModal(member, false);
                    });
                });

                // Add approve functionality
                row.querySelector('.approve-btn').addEventListener('click', () => {
                    requireAdminAuth(() => {
                        addApprovedMember(member);
                        DATA_STORE.members = DATA_STORE.members.filter(m => m.memberId !== member.memberId);
                        saveMembers();
                        updateMembersTable();
                        updateApprovedMembersTable();
                    });
                });

                // Add delete functionality
                row.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this member?')) {
                        DATA_STORE.members = DATA_STORE.members.filter(m => m.memberId !== member.memberId);
                        saveMembers();
                        updateMembersTable();
                    }
                });

                membersTableBody.appendChild(row);
            });
        }

        function updateApprovedMembersTable() {
            const tbody = document.getElementById('approvedMembersTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                DATA_STORE.approvedMembers.forEach(member => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${member.memberId}</td>
                        <td>${member.fullName}</td>
                        <td>${member.contact}</td>
                        <td>${member.subLocation}</td>
                        <td>${member.clan}</td>
                        <td>
                            <button class="btn btn-sm btn-warning edit-btn admin-restricted" data-id="${member.memberId}">Edit</button>
                            <button class="btn btn-sm btn-danger remove-btn admin-restricted" data-id="${member.memberId}">Remove</button>
                        </td>
                    `;

                    // Add event listener for edit button
                    const editBtn = row.querySelector('.edit-btn');
                    editBtn.addEventListener('click', () => {
                        requireAdminAuth(() => {
                            // Move member back to registration for editing
                            DATA_STORE.approvedMembers = DATA_STORE.approvedMembers.filter(m => m.memberId !== member.memberId);
                            DATA_STORE.members.push(member);
                            
                            // Save changes
                            saveApprovedMembers();
                            saveMembers();
                            
                            // Update tables
                            updateApprovedMembersTable();
                            updateMembersTable();
                            
                            // Show success message
                            alert('Member moved back to registration for editing.');
                            
                            // Switch to registration section
                            const registrationLink = document.querySelector('a[href="#registration"]');
                            if (registrationLink) {
                                registrationLink.click();
                            }
                        });
                    });

                    // Add event listener for remove button
                    const removeBtn = row.querySelector('.remove-btn');
                    removeBtn.addEventListener('click', () => {
                        requireAdminAuth(() => {
                            if (confirm('Are you sure you want to remove this member from approved list?')) {
                                // Remove from approved members and add back to pending members
                                DATA_STORE.approvedMembers = DATA_STORE.approvedMembers.filter(m => m.memberId !== member.memberId);
                                DATA_STORE.members.push(member);
                                
                                // Save changes
                                saveApprovedMembers();
                                saveMembers();
                                
                                // Update UI
                                updateApprovedMembersTable();
                                updateMembersTable();
                                populateMemberDropdowns();
                                updateTotalMembersMetric();
                            }
                        });
                    });

                    tbody.appendChild(row);
                });
            }
        }

        function generateMemberID() {
            const totalMemberCount = [...DATA_STORE.members, ...DATA_STORE.approvedMembers].length;
            return `MEMB-${String(totalMemberCount + 1).padStart(3, '0')}`;
        }

        function updateTotalMembersMetric() {
            const totalMembersCount = safeQuerySelector('#totalMembersCount');
            if (totalMembersCount) {
                const totalMembers = DATA_STORE.members.length + DATA_STORE.approvedMembers.length;
                totalMembersCount.textContent = totalMembers;
            }
        }

        function populateMemberDropdowns() {
            const contributionTypes = ['saving', 'benevolence', 'education', 'health'];
            
            contributionTypes.forEach(type => {
                const dropdown = document.querySelector(`#${type}ContributionMemberName`);
                if (dropdown) {
                    dropdown.innerHTML = '<option value="">Select Member</option>';
                    DATA_STORE.approvedMembers.forEach(member => {
                        const option = document.createElement('option');
                        option.value = member.fullName;
                        option.textContent = member.fullName;
                        dropdown.appendChild(option);
                    });
                }
            });
        }

       
        function calculateBenevolencePerformance() {
            const perfData = {};

            (DATA_STORE.contributions?.benevolence || []).forEach(con => {
                if (!perfData[con.memberId]) {
                    const member = DATA_STORE.approvedMembers.find(m => m.memberId === con.memberId);
                    perfData[con.memberId] = {
                        fullName: member ? member.fullName : con.fullName || 'Unknown',
                        totalContributions: 0,
                        uniqueBeneficiaries: new Set(),
                        beneficiaryBreakdown: {}
                    };
                }

                perfData[con.memberId].totalContributions += con.amount;
                perfData[con.memberId].uniqueBeneficiaries.add(con.beneficiary);

                if (!perfData[con.memberId].beneficiaryBreakdown[con.beneficiary]) {
                    perfData[con.memberId].beneficiaryBreakdown[con.beneficiary] = 0;
                }
                perfData[con.memberId].beneficiaryBreakdown[con.beneficiary] += con.amount;
            });

            return perfData;
        }

        function updatePerformanceTable() {
            const performanceTableBody = document.getElementById('performanceTableBody');
            if (!performanceTableBody) return;

            performanceTableBody.innerHTML = '';
            const performanceData = calculateBenevolencePerformance();

            Object.entries(performanceData).forEach(([memberId, performance]) => {
                const row = document.createElement('tr');
                
                const performanceRating = Math.min(performance.uniqueBeneficiaries.size, 5);
                const starRating = Array(5).fill().map((_, i) => 
                    `<i class="fas fa-star ${i < performanceRating ? 'active' : ''}"></i>`
                ).join('');

                row.innerHTML = `
                    <td>${memberId}</td>
                    <td>${performance.fullName}</td>
                    <td>Ksh ${performance.totalContributions.toLocaleString()}</td>
                    <td>${performance.uniqueBeneficiaries.size}</td>
                    <td>
                        <div class="performance-rating">
                            ${starRating}
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info details-btn">View Details</button>
                    </td>
                `;

                const detailsBtn = row.querySelector('.details-btn');
                detailsBtn.addEventListener('click', () => {
                    const beneficiaryDetails = Object.entries(performance.beneficiaryBreakdown)
                        .map(([beneficiary, amount]) => `${beneficiary}: Ksh ${amount.toLocaleString()}`)
                        .join('<br>');

                    const modalHtml = `
                        <div class="modal fade" tabindex="-1">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">${performance.fullName} - Beneficiary Breakdown</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body">
                                        <table class="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Beneficiary</th>
                                                    <th>Total Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${Object.entries(performance.beneficiaryBreakdown)
                                                    .map(([beneficiary, amount]) => `
                                                        <tr>
                                                            <td>${beneficiary}</td>
                                                            <td>Ksh ${amount.toLocaleString()}</td>
                                                        </tr>
                                                    `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = modalHtml;
                    document.body.appendChild(tempDiv.firstChild);
                    
                    const modalElement = document.body.lastChild;
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();

                    modalElement.addEventListener('hidden.bs.modal', () => {
                        document.body.removeChild(modalElement);
                    });
                });

                performanceTableBody.appendChild(row);
            });

            updateBeneficiaryPerformanceChart(performanceData);
        }

        function updateBeneficiaryPerformanceChart(performanceData) {
            const ctx = document.getElementById('beneficiaryPerformanceChart');
            if (!ctx) return;

            const beneficiaryTotals = {};
            Object.values(performanceData).forEach(performance => {
                Object.entries(performance.beneficiaryBreakdown).forEach(([beneficiary, amount]) => {
                    beneficiaryTotals[beneficiary] = (beneficiaryTotals[beneficiary] || 0) + amount;
                });
            });

            if (beneficiaryPerformanceChart) {
                beneficiaryPerformanceChart.destroy();
            }

            beneficiaryPerformanceChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(beneficiaryTotals),
                    datasets: [{
                        label: 'Total Contributions',
                        data: Object.values(beneficiaryTotals),
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Total Contributions (Ksh)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Beneficiary Performance Overview'
                        }
                    }
                }
            });
        }

        const printPerformanceBtn = document.getElementById('printPerformanceBtn');
        if (printPerformanceBtn) {
            printPerformanceBtn.addEventListener('click', () => {
                window.printTable('performanceTable');
            });
        }

        function initializeApprovedMembers() {
            const storedApprovedMembers = localStorage.getItem(LOCAL_STORAGE_KEYS.APPROVED_MEMBERS);
            
            if (storedApprovedMembers) {
                try {
                    DATA_STORE.approvedMembers = JSON.parse(storedApprovedMembers);
                    
                    // Update tables and dropdowns after loading
                    updateApprovedMembersTable();
                    populateMemberDropdowns();
                    updateTotalMembersMetric();
                } catch (error) {
                    console.error('Error loading approved members:', error);
                }
            }
        }

        initializeApprovedMembers();

        updatePerformanceTable();

        ['saving', 'benevolence', 'education', 'health'].forEach(type => {
            updateContributionTable(type);
        });

        ['official', 'general'].forEach(type => {
            updateExpenditureTable(type);
        });

        updateDashboardContributionMetrics();
        updateDashboardExpenditureMetrics();
        updateLiveMembersTable();
        updateLiveMembersCount();

        populateMemberDropdowns();

        function setupFormSubmission(formSelector, submitHandler) {
            const forms = document.querySelectorAll(formSelector);

            forms.forEach(form => {
                if (!form) {
                    console.error(`[FormSetup] No form found for selector: ${formSelector}`);
                    return;
                }

                form.addEventListener('submit', function(e) {
                    e.preventDefault();

                    try {
                        const result = submitHandler(form);
                        if (result) {
                            form.reset();
                            alert('Operation completed successfully!');
                        }
                    } catch (error) {
                        console.error(`[FormSubmission] Error in ${formSelector}:`, error);
                        alert('An error occurred while processing the form');
                    }
                });
            });
        }

        setupFormSubmission('#memberRegistrationForm', (form) => {
            const fullName = form.querySelector('#fullName').value.trim();
            const contact = form.querySelector('#contact').value.trim();
            const subLocation = form.querySelector('#subLocation').value;
            const clan = form.querySelector('#clan').value;
            const status = form.querySelector('#status').value;

            if (!fullName || !contact || !subLocation || !clan || !status) {
                alert('Please fill all required fields');
                return false;
            }

            return addMember(fullName, contact, subLocation, clan, status);
        });

        // Add admin login form submission handler
        document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            if (handleAdminLogin(username, password)) {
                alert('Admin login successful!');
                bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
                updateAdminUI();
            } else {
                alert('Invalid credentials!');
            }
        });

        // Add logout button handler
        document.querySelector('.admin-logout-btn')?.addEventListener('click', function() {
            handleAdminLogout();
            alert('Logged out successfully!');
        });

        // Add admin prompt form handler
        document.getElementById('adminPromptForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('promptUsername').value;
            const password = document.getElementById('promptPassword').value;
            
            if (handleAdminLogin(username, password)) {
                bootstrap.Modal.getInstance(document.getElementById('adminPromptModal')).hide();
                if (pendingAdminAction) {
                    pendingAdminAction();
                    pendingAdminAction = null;
                }
            } else {
                alert('Invalid credentials!');
            }
        });

        // Initialize admin UI state
        updateAdminUI();
        
        // Add admin-restricted class to buttons that should be admin-only
        document.querySelectorAll('.edit-btn, .delete-btn, .approve-btn').forEach(button => {
            button.classList.add('admin-restricted');
        });

        window.addEventListener('error', function(event) {
            console.error('Uncaught error:', {
                message: event.message,
                error: event.error
            });
        });

        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled Promise Rejection:', event.reason);
            alert('An unexpected error occurred. Please try again.');
        });

        // Add search bars to all tables
        [
            '#membersTableBody',
            '#approvedMembersTableBody',
            '#savingContributionsBody',
            '#benevolenceContributionsBody', 
            '#educationContributionsBody', 
            '#healthContributionsBody',
            '#officialExpendituresBody',
            '#generalExpendituresBody',
            '#performanceTableBody',
            '#liveMembersTableBody',
            '#recentContributionsBody',
            '#recentExpendituresBody'
        ].forEach(selector => {
            addTableSearchBar(selector);
        });

        // Show dashboard by default
        document.getElementById('dashboard-section').style.display = 'block';

        // Print buttons for expenditures
        const printOfficialBtn = document.getElementById('printOfficialExpendituresBtn');
        const printGeneralBtn = document.getElementById('printGeneralExpendituresBtn');

        if (printOfficialBtn) {
            printOfficialBtn.addEventListener('click', () => {
                window.printTable('officialExpendituresTable');
            });
        }

        if (printGeneralBtn) {
            printGeneralBtn.addEventListener('click', () => {
                window.printTable('generalExpendituresTable');
            });
        }

        // Import/Export functionality for expenditures
        ['official', 'general'].forEach(type => {
            const importBtn = document.getElementById(`import${type.charAt(0).toUpperCase() + type.slice(1)}ExpendituresBtn`);
            const exportBtn = document.getElementById(`export${type.charAt(0).toUpperCase() + type.slice(1)}ExpendituresBtn`);

            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const importedData = JSON.parse(e.target.result);
                                DATA_STORE.expenditures[type] = importedData;
                                localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENDITURES, JSON.stringify(DATA_STORE.expenditures));
                                updateExpenditureTable(type);
                                updateDashboardExpenditureMetrics();
                                alert('Expenditure data imported successfully!');
                            } catch (error) {
                                console.error('Import error:', error);
                                alert('Error importing expenditure data. Please check the file format.');
                            }
                        };
                        reader.readAsText(file);
                    };
                    input.click();
                });
            }

            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    const data = DATA_STORE.expenditures[type] || [];
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    a.href = url;
                    a.download = `${type}_expenditures_${timestamp}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            }
        });

        // Add import/export functionality for contribution types
        ['saving', 'benevolence', 'education', 'health'].forEach(type => {
            const importBtn = document.getElementById(`import${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
            const exportBtn = document.getElementById(`export${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);

            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const importedData = JSON.parse(e.target.result);
                                DATA_STORE.contributions[type] = importedData;
                                localStorage.setItem(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(DATA_STORE.contributions));
                                updateContributionTable(type);
                                updateDashboardContributionMetrics();
                                alert('Data imported successfully!');
                            } catch (error) {
                                console.error('Import error:', error);
                                alert('Error importing data. Please check the file format.');
                            }
                        };
                        reader.readAsText(file);
                    };
                    input.click();
                });
            }

            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    const data = DATA_STORE.contributions[type] || [];
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${type}_contributions_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            }
        });

        // Add this function to show beneficiary details
        function showBeneficiaryDetails(beneficiary, data) {
            const modalHtml = `
                <div class="modal fade" id="beneficiaryDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title">Beneficiary Details - ${beneficiary}</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Summary</h6>
                                                <p><strong>Total Amount Received:</strong> Ksh ${data.totalAmount.toLocaleString()}</p>
                                                <p><strong>Number of Contributors:</strong> ${data.contributors.size}</p>
                                                <p><strong>Last Contribution:</strong> ${new Date(data.lastContribution).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Contribution Breakdown</h6>
                                                ${Object.entries(data.byType)
                                                    .filter(([_, amount]) => amount > 0)
                                                    .map(([type, amount]) => `
                                                        <div class="d-flex justify-content-between mb-2">
                                                            <span>${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                                                            <span>Ksh ${amount.toLocaleString()}</span>
                                                        </div>
                                                    `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Contributor</th>
                                                <th>Amount</th>
                                                <th>Type</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${data.contributions
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map(cont => `
                                                    <tr>
                                                        <td>${cont.contributor}</td>
                                                        <td>Ksh ${cont.amount.toLocaleString()}</td>
                                                        <td>${cont.type}</td>
                                                        <td>${new Date(cont.date).toLocaleDateString()}</td>
                                                        <td><span class="badge bg-success">${cont.status}</span></td>
                                                    </tr>
                                                `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" onclick="printBeneficiaryDetails('${beneficiary}')">
                                    <i class="fas fa-print me-1"></i> Print Details
                                </button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('beneficiaryDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add new modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('beneficiaryDetailsModal'));
            modal.show();
        }

        function printBeneficiaryDetails(beneficiary) {
            const data = DATA_STORE.beneficiaryReference[beneficiary];
            if (!data) return;

            const printContent = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Beneficiary Details - ${beneficiary}</title>
                        <style>
                            @media print {
                                body { 
                                    font-family: Arial, sans-serif;
                                    padding: 20px;
                                    color: #000;
                                }
                                .header {
                                    text-align: center;
                                    margin-bottom: 30px;
                                    border-bottom: 2px solid #000;
                                    padding-bottom: 10px;
                                }
                                .summary-card {
                                    border: 1px solid #000;
                                    padding: 15px;
                                    margin-bottom: 20px;
                                    page-break-inside: avoid;
                                }
                                .breakdown {
                                    margin: 20px 0;
                                    page-break-inside: avoid;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin-top: 20px;
                                }
                                th, td {
                                    border: 1px solid #000;
                                    padding: 8px;
                                    text-align: left;
                                }
                                th {
                                    background-color: #f0f0f0;
                                }
                                .footer {
                                    margin-top: 30px;
                                    text-align: center;
                                    font-size: 12px;
                                    page-break-inside: avoid;
                                }
                                .page-break {
                                    page-break-after: always;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Kanam Welfare Association</h1>
                            <h2>Beneficiary Details Report</h2>
                            <p>Generated on: ${new Date().toLocaleDateString()}</p>
                        </div>

                        <div class="summary-card">
                            <h3>Beneficiary Information</h3>
                            <p><strong>Name:</strong> ${beneficiary}</p>
                            <p><strong>Total Amount Received:</strong> Ksh ${data.totalAmount.toLocaleString()}</p>
                            <p><strong>Total Contributors:</strong> ${data.contributors.size}</p>
                            <p><strong>Last Contribution Date:</strong> ${new Date(data.lastContribution).toLocaleDateString()}</p>
                        </div>

                        <div class="breakdown">
                            <h3>Contribution Type Breakdown</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(data.byType)
                                        .filter(([_, amount]) => amount > 0)
                                        .map(([type, amount]) => `
                                            <tr>
                                                <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
                                                <td>Ksh ${amount.toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="page-break"></div>

                        <h3>Detailed Contribution History</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Contributor</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.contributions
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map(cont => `
                                        <tr>
                                            <td>${new Date(cont.date).toLocaleDateString()}</td>
                                            <td>${cont.contributor}</td>
                                            <td>${cont.type}</td>
                                            <td>Ksh ${cont.amount.toLocaleString()}</td>
                                            <td>${cont.status}</td>
                                        </tr>
                                    `).join('')}
                            </tbody>
                        </table>

                        <div class="footer">
                            <p>Kanam Welfare Association - Empowering Communities</p>
                            <p>Report generated by the system on ${new Date().toLocaleString()}</p>
                        </div>
                    </body>
                </html>
            `;

            // Create and open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();

            // Wait for content to load before printing
            printWindow.onload = function() {
                printWindow.print();
                // Close the window after printing (for most browsers)
                printWindow.onafterprint = function() {
                    printWindow.close();
                };
            };
        }

        updateBeneficiaryMetrics();
        
        // Update the monthly contribution trends chart
        function updateMonthlyContributionTrendsChart() {
            const ctx = document.getElementById('monthlyContributionTrendsChart');
            if (!ctx) return;

            // Get all contributions with beneficiaries
            const allContributions = ['benevolence', 'education', 'health'].reduce((acc, type) => {
                return acc.concat((DATA_STORE.contributions[type] || [])
                    .filter(cont => cont.beneficiary)
                    .map(cont => ({...cont, type})));
            }, []);

            // Group by month
            const monthlyData = allContributions.reduce((acc, cont) => {
                const month = new Date(cont.date).toLocaleString('default', { month: 'long' });
                if (!acc[month]) {
                    acc[month] = 0;
                }
                acc[month] += cont.amount;
                return acc;
            }, {});

            if (monthlyTrendsChart) {
                monthlyTrendsChart.destroy();
            }

            monthlyTrendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Object.keys(monthlyData),
                    datasets: [{
                        label: 'Monthly Contributions',
                        data: Object.values(monthlyData),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Amount (Ksh)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Contribution Trends'
                        }
                    }
                }
            });
        }

        // Add these functions after the other data management functions, before the DOMContentLoaded event
        function backupAppData() {
            try {
                const backupData = {
                    members: DATA_STORE.members,
                    approvedMembers: DATA_STORE.approvedMembers,
                    liveMembers: DATA_STORE.liveMembers,
                    contributions: DATA_STORE.contributions,
                    expenditures: DATA_STORE.expenditures,
                    settings: settings,
                    beneficiaryReference: DATA_STORE.beneficiaryReference
                };

                const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                a.href = url;
                a.download = `kanam_welfare_backup_${timestamp}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert('Backup completed successfully!');
            } catch (error) {
                console.error('Backup error:', error);
                alert('Error creating backup. Please try again.');
            }
        }

        async function restoreAppData(file) {
            try {
                const text = await file.text();
                const restoredData = JSON.parse(text);

                // Validate restored data structure
                const requiredKeys = ['members', 'approvedMembers', 'liveMembers', 'contributions', 
                                    'expenditures', 'settings', 'beneficiaryReference'];
                
                const missingKeys = requiredKeys.filter(key => !restoredData.hasOwnProperty(key));
                if (missingKeys.length > 0) {
                    throw new Error(`Invalid backup file. Missing required data: ${missingKeys.join(', ')}`);
                }

                // Restore all data stores
                DATA_STORE.members = restoredData.members;
                DATA_STORE.approvedMembers = restoredData.approvedMembers;
                DATA_STORE.liveMembers = restoredData.liveMembers;
                DATA_STORE.contributions = restoredData.contributions;
                DATA_STORE.expenditures = restoredData.expenditures;
                DATA_STORE.beneficiaryReference = restoredData.beneficiaryReference;

                // Update localStorage
                Object.entries(LOCAL_STORAGE_KEYS).forEach(([key, storageKey]) => {
                    const dataKey = key.toLowerCase();
                    if (restoredData[dataKey]) {
                        localStorage.setItem(storageKey, JSON.stringify(restoredData[dataKey]));
                    }
                });

                // Restore settings
                Object.assign(settings, restoredData.settings);
                localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

                // Update UI
                updateMembersTable();
                updateApprovedMembersTable();
                updateLiveMembersTable();
                updateTotalMembersMetric();
                
                ['saving', 'benevolence', 'education', 'health'].forEach(type => {
                    updateContributionTable(type);
                });
                
                ['official', 'general'].forEach(type => {
                    updateExpenditureTable(type);
                });

                updateDashboardContributionMetrics();
                updateDashboardExpenditureMetrics();
                updateAllBeneficiaryData();
                populateMemberDropdowns();
                
                // Apply restored settings
                loadSettings();
                applyOrganizationSettings();

                alert('Data restored successfully! The page will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Restore error:', error);
                alert(`Error restoring data: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('Initialization error:', error);
    }
});

        // Add handler for moving all approved members back to registration
        const moveAllToRegistrationBtn = document.getElementById('moveAllToRegistrationBtn');
        if (moveAllToRegistrationBtn) {
            moveAllToRegistrationBtn.addEventListener('click', () => {
                requireAdminAuth(() => {
                    if (confirm('Are you sure you want to move all approved members back to registration? This action cannot be undone.')) {
                        try {
                            // Get count before moving
                            const memberCount = DATA_STORE.approvedMembers.length;
                            
                            // Move all approved members back to registration
                            const approvedMembers = [...DATA_STORE.approvedMembers];
                            DATA_STORE.members = [...DATA_STORE.members, ...approvedMembers];
                            DATA_STORE.approvedMembers = [];

                            // Update live members - remove any that were approved
                            DATA_STORE.liveMembers = DATA_STORE.liveMembers.filter(member => 
                                !approvedMembers.some(approved => approved.memberId === member.memberId)
                            );

                            // Save all changes to localStorage
                            localStorage.setItem(LOCAL_STORAGE_KEYS.MEMBERS, JSON.stringify(DATA_STORE.members));
                            localStorage.setItem(LOCAL_STORAGE_KEYS.APPROVED_MEMBERS, JSON.stringify(DATA_STORE.approvedMembers));
                            localStorage.setItem(LOCAL_STORAGE_KEYS.LIVE_MEMBERS, JSON.stringify(DATA_STORE.liveMembers));

                            // Update all relevant UI components
                            updateMembersTable();
                            updateApprovedMembersTable();
                            updateLiveMembersTable();
                            populateMemberDropdowns();
                            updateTotalMembersMetric();
                            updateLiveMembersCount();
                            updateDashboardContributionMetrics();

                            // Show detailed success notification
                            alert(`Successfully moved ${memberCount} members back to registration.\n\nPlease note:\n- All members need to be re-approved\n- Live member status will be recalculated upon approval`);

                            // Switch to registration section to show the moved members
                            const registrationLink = document.querySelector('a[href="#registration"]');
                            if (registrationLink) {
                                registrationLink.click();
                            }
                        } catch (error) {
                            console.error('Error moving members back to registration:', error);
                            alert('An error occurred while moving members back to registration. Please try again.');
                        }
                    }
                });
            });
        }

        // Add print button handlers for expenditures
        const printOfficialExpendituresBtn = document.getElementById('printOfficialExpendituresBtn');
        if (printOfficialExpendituresBtn) {
            printOfficialExpendituresBtn.addEventListener('click', () => {
                printExpenditureTable('official');
            });
        }

        const printGeneralExpendituresBtn = document.getElementById('printGeneralExpendituresBtn');
        if (printGeneralExpendituresBtn) {
            printGeneralExpendituresBtn.addEventListener('click', () => {
                printExpenditureTable('general');
            });
        }

// Add these functions after other print-related functions
function printExpenditureTable(type) {
    try {
        const originalContents = document.body.innerHTML;
        const table = document.getElementById(`${type}ExpendituresTable`);
        if (!table) {
            throw new Error(`Table not found: ${type}ExpendituresTable`);
        }

        // Get the expenditures data
        const expendituresData = DATA_STORE.expenditures[type] || [];
        const totalAmount = expendituresData.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        const printContent = `
            <div style="padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2>${settings.organization.name || 'Kanam Welfare Association'}</h2>
                    <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Expenditures Report</h3>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <strong>Total ${type.charAt(0).toUpperCase() + type.slice(1)} Expenditures:</strong> 
                    Ksh ${totalAmount.toLocaleString()}
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="border: 1px solid #dee2e6; padding: 8px;">Exp. ID</th>
                            <th style="border: 1px solid #dee2e6; padding: 8px;">Type</th>
                            <th style="border: 1px solid #dee2e6; padding: 8px;">Amount</th>
                            <th style="border: 1px solid #dee2e6; padding: 8px;">Description</th>
                            <th style="border: 1px solid #dee2e6; padding: 8px;">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expendituresData.map(exp => `
                            <tr>
                                <td style="border: 1px solid #dee2e6; padding: 8px;">${exp.id}</td>
                                <td style="border: 1px solid #dee2e6; padding: 8px;">${exp.type}</td>
                                <td style="border: 1px solid #dee2e6; padding: 8px;">Ksh ${exp.amount.toLocaleString()}</td>
                                <td style="border: 1px solid #dee2e6; padding: 8px;">${exp.description}</td>
                                <td style="border: 1px solid #dee2e6; padding: 8px;">${new Date(exp.date).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #f8f9fa;">
                            <td colspan="2" style="border: 1px solid #dee2e6; padding: 8px;"><strong>Total</strong></td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;"><strong>Ksh ${totalAmount.toLocaleString()}</strong></td>
                            <td colspan="2" style="border: 1px solid #dee2e6; padding: 8px;"></td>
                        </tr>
                    </tfoot>
                </table>

                <div style="text-align: center; margin-top: 30px; font-size: 12px;">
                    <p>This is a computer-generated document. No signature required.</p>
                    <p>${settings.organization.name || 'Kanam Welfare Association'} - Financial Management System</p>
                </div>
            </div>
        `;

        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContents;
        location.reload();

    } catch (error) {
        console.error('Error printing expenditure table:', error);
        alert('Error printing expenditure table. Please try again.');
    }
}