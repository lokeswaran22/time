# Read the original working version and remove the default PIN text
original_content = '''<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Master View - Timesheet History</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link rel="icon" type="image/jpeg" href="images/logogo.jpg">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="overflow-fix.css">
    <style>
        .history-container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .filters-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            border: 1px solid var(--border-color);
        }

        .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            align-items: end;
        }

        .data-table-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-color);
            overflow: hidden;
        }

        .table-responsive {
            overflow-x: auto;
            max-height: 70vh;
        }

        .master-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }

        .master-table th,
        .master-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .master-table th {
            background-color: var(--royal-navy);
            color: var(--royal-gold);
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .master-table tr:hover {
            background-color: #f8fafc;
        }

        .badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
        }

        .badge.epub {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .badge.proof {
            background-color: #dcfce7;
            color: #166534;
        }

        .badge.calibr {
            background-color: #f3e8ff;
            color: #6b21a8;
        }

        .badge.meeting {
            background-color: #fef3c7;
            color: #92400e;
        }

        .badge.break {
            background-color: #f1f5f9;
            color: #475569;
        }

        .badge.lunch {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .badge.other {
            background-color: #e2e8f0;
            color: #1e293b;
        }

        .badge.leave {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        /* PIN Protection Overlay */
        .pin-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 17, 40, 0.95);
            backdrop-filter: blur(10px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pin-overlay.hidden {
            display: none;
        }

        .pin-card {
            background: var(--bg-card);
            border: 2px solid var(--royal-gold);
            border-radius: var(--border-radius-xl);
            padding: 3rem;
            width: 100%;
            max-width: 400px;
            box-shadow: var(--shadow-luxury);
            position: relative;
            text-align: center;
        }

        .pin-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient-gold);
        }

        .pin-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: var(--gradient-gold);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow-gold);
        }

        .pin-title {
            font-family: var(--font-family);
            font-size: 1.75rem;
            color: var(--royal-navy);
            margin-bottom: 0.5rem;
            font-weight: 700;
        }

        .pin-subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }

        .pin-input-group {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            margin-bottom: 1.5rem;
        }

        .pin-digit {
            width: 50px;
            height: 60px;
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
            border: 2px solid var(--royal-gold-light);
            border-radius: var(--border-radius);
            background: white;
            color: var(--royal-navy);
            transition: all var(--transition-base);
        }

        .pin-digit:focus {
            outline: none;
            border-color: var(--royal-gold);
            box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15);
            transform: scale(1.05);
        }

        .pin-error {
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 1rem;
            display: none;
        }

        .pin-error.show {
            display: block;
            animation: shake 0.5s;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }

        .content-hidden {
            display: none !important;
        }
    </style>
</head>

<body>
    <!-- PIN Protection Overlay -->
    <div class="pin-overlay" id="pinOverlay">
        <div class="pin-card">
            <div class="pin-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--royal-navy);">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            <h2 class="pin-title">Master View Access</h2>
            <p class="pin-subtitle">Enter 4-digit PIN to continue</p>
            <div class="pin-input-group">
                <input type="password" maxlength="1" class="pin-digit" id="pin1" inputmode="numeric" pattern="[0-9]">
                <input type="password" maxlength="1" class="pin-digit" id="pin2" inputmode="numeric" pattern="[0-9]">
                <input type="password" maxlength="1" class="pin-digit" id="pin3" inputmode="numeric" pattern="[0-9]">
                <input type="password" maxlength="1" class="pin-digit" id="pin4" inputmode="numeric" pattern="[0-9]">
            </div>
            <p class="pin-error" id="pinError">❌ Incorrect PIN. Please try again.</p>
        </div>
    </div>

    <!-- Header -->
    <header class="header content-hidden" id="mainHeader">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <img src="../images/logogo.jpg" alt="Pristonix" width="60" height="40">
                    <h1 class="logo-text">PRISTONIX</h1>
                </div>
                <div class="header-actions">
                    <a href="/" class="btn btn-secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="history-container content-hidden" id="mainContent">
        <div class="filters-card">
            <h2 style="margin-bottom: 1rem; color: var(--royal-navy);">Master Activity View</h2>
            <div class="filters-grid">
                <div class="form-group">
                    <label for="searchFilter">Search</label>
                    <input type="text" id="searchFilter" class="form-input"
                        placeholder="Search employee, description...">
                </div>
                <div class="form-group">
                    <label for="dateFilter">Date</label>
                    <input type="date" id="dateFilter" class="form-input">
                </div>
                <div class="form-group">
                    <label for="typeFilter">Activity Type</label>
                    <select id="typeFilter" class="form-input">
                        <option value="">All Types</option>
                        <option value="epub">Epub</option>
                        <option value="proof">Proof</option>
                        <option value="calibr">Calibr</option>
                        <option value="meeting">Meeting</option>
                        <option value="break">Break</option>
                        <option value="lunch">Lunch</option>
                        <option value="leave">Leave</option>
                    </select>
                </div>
                <div class="form-group">
                    <button id="resetFilters" class="btn btn-secondary" style="width: 100%;">Reset Filters</button>
                </div>
            </div>
        </div>

        <div class="data-table-card">
            <div class="table-responsive">
                <table class="master-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>Time Slot</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Total Pages</th>
                            <th>Pages Done</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody id="historyBody">
                        <!-- Rows will be populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
        <div id="loadingState" style="text-align: center; padding: 2rem; display: none;">
            Loading data...
        </div>
        <div id="noDataState" style="text-align: center; padding: 2rem; display: none; color: var(--text-secondary);">
            No activities found matching your filters.
        </div>
    </main>

    <script>
        // PIN Protection Logic
        const CORRECT_PIN = '2025'; // You can change this PIN
        const pinOverlay = document.getElementById('pinOverlay');
        const pinError = document.getElementById('pinError');
        const pinInputs = [
            document.getElementById('pin1'),
            document.getElementById('pin2'),
            document.getElementById('pin3'),
            document.getElementById('pin4')
        ];
        const mainHeader = document.getElementById('mainHeader');
        const mainContent = document.getElementById('mainContent');

        // Auto-focus first input
        pinInputs[0].focus();

        // Handle PIN input
        pinInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Move to next input
                if (value && index < 3) {
                    pinInputs[index + 1].focus();
                }

                // Check PIN when all 4 digits are entered
                if (index === 3 && value) {
                    checkPIN();
                }
            });

            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    pinInputs[index - 1].focus();
                }
            });

            // Prevent paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                if (/^\\d{4}$/.test(pastedData)) {
                    pastedData.split('').forEach((digit, i) => {
                        if (pinInputs[i]) {
                            pinInputs[i].value = digit;
                        }
                    });
                    checkPIN();
                }
            });
        });

        function checkPIN() {
            const enteredPIN = pinInputs.map(input => input.value).join('');
            
            if (enteredPIN === CORRECT_PIN) {
                // Correct PIN - grant access
                pinOverlay.classList.add('hidden');
                mainHeader.classList.remove('content-hidden');
                mainContent.classList.remove('content-hidden');
                
                // Store access in session
                sessionStorage.setItem('masterViewAccess', 'granted');
            } else {
                // Incorrect PIN - show error
                pinError.classList.add('show');
                pinInputs.forEach(input => {
                    input.value = '';
                    input.style.borderColor = '#dc2626';
                });
                pinInputs[0].focus();
                
                setTimeout(() => {
                    pinError.classList.remove('show');
                    pinInputs.forEach(input => {
                        input.style.borderColor = '';
                    });
                }, 2000);
            }
        }

        // Check if user already has access in this session
        if (sessionStorage.getItem('masterViewAccess') === 'granted') {
            pinOverlay.classList.add('hidden');
            mainHeader.classList.remove('content-hidden');
            mainContent.classList.remove('content-hidden');
        }
    </script>
    <script src="history.js"></script>
</body>

</html>'''

with open('history.html', 'w', encoding='utf-8') as f:
    f.write(original_content)

print("Successfully restored history.html without default PIN display")
