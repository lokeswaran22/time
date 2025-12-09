# Comprehensive fix for index.html
with open('index.html.broken', 'r', encoding='utf-8') as f:
    content = f.read()

# The correct structure should be:
# 1. DOCTYPE, html, head (lines 1-19)
# 2. body start, preloader (lines 21-30)
# 3. Reminder container
# 4. Header section (MISSING - needs to be added)
# 5. Main content with date selector (currently starts at line 28)
# 6. Rest of the content

# Extract the head section (lines 1-19)
head_section = '''<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timesheet Tracker - Royal Premium</title>
    <meta name="description" content="Royal premium employee timesheet tracking system">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link rel="icon" type="image/jpeg" href="images/logogo.jpg">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="reminder.css">

    <link rel="stylesheet" href="overflow-fix.css">
</head>

<body>
    <!-- Preloader -->
    <div id="preloader">
        <div class="preloader-content">
            <img src="images/logogo.jpg" alt="Loading..." class="preloader-logo">
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    </div>
    <!-- Reminder Notification Container -->
    <div id="reminderContainer"></div>

    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <img src="../images/logogo.jpg" alt="Pristonix" width="60" height="40">
                    <h1 class="logo-text" style="margin-left: -30px !important;">RISTONIX</h1>
                </div>
                <div class="header-actions">
                    <span id="userInfoDisplay"
                        style="color: var(--royal-gold); font-weight: 600; margin-right: 1rem;"></span>
                    <button class="btn btn-sm btn-danger" id="logoutBtn" style="margin-right: 0.5rem;">Logout</button>
                    <a href="history.html" class="btn btn-secondary" style="margin-right: 0.5rem;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                        </svg>
                        Admin Panel
                    </a>
                    <button class="btn btn-secondary" id="exportBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Export to Excel
                    </button>
                    <button class="btn btn-primary" id="addEmployeeBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Employee
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <!-- Date Selector -->
            '''

# Extract everything from line 28 onwards (the date-selector-card and rest)
# Remove the incorrect nesting
rest_of_content = content[content.find('<div class="date-selector-card">'):]

# Fix the indentation and structure
rest_of_content = rest_of_content.replace('                <div class="date-selector-card">', '            <div class="date-selector-card">')
rest_of_content = rest_of_content.replace('                    <div class="date-selector">', '                <div class="date-selector">')
rest_of_content = rest_of_content.replace('                        <h2>', '                    <h2>')
rest_of_content = rest_of_content.replace('                        <div class="date-controls">', '                    <div class="date-controls">')
rest_of_content = rest_of_content.replace('                            <button', '                        <button')
rest_of_content = rest_of_content.replace('                                <svg', '                            <svg')
rest_of_content = rest_of_content.replace('                                    <path', '                                <path')
rest_of_content = rest_of_content.replace('                                </svg>', '                            </svg>')
rest_of_content = rest_of_content.replace('                            </button>', '                        </button>')
rest_of_content = rest_of_content.replace('                            <input', '                        <input')
rest_of_content = rest_of_content.replace('                        </div>', '                    </div>')
rest_of_content = rest_of_content.replace('                    </div>', '                </div>')
rest_of_content = rest_of_content.replace('                    <br />', '                <br />')
rest_of_content = rest_of_content.replace('                    <!-- Timesheet Table -->', '                <!-- Timesheet Table -->')
rest_of_content = rest_of_content.replace('                    <div class="timesheet-container">', '                <div class="timesheet-container">')
rest_of_content = rest_of_content.replace('                        <div class="table-wrapper">', '                    <div class="table-wrapper">')
rest_of_content = rest_of_content.replace('                            <table', '                        <table')
rest_of_content = rest_of_content.replace('                                <thead>', '                            <thead>')
rest_of_content = rest_of_content.replace('                                    <tr>', '                                <tr>')
rest_of_content = rest_of_content.replace('                                        <th', '                                    <th')
rest_of_content = rest_of_content.replace('                                    </tr>', '                                </tr>')
rest_of_content = rest_of_content.replace('                                </thead>', '                            </thead>')
rest_of_content = rest_of_content.replace('                                <tbody', '                            <tbody')
rest_of_content = rest_of_content.replace('                                    <!-- Rows', '                                <!-- Rows')
rest_of_content = rest_of_content.replace('                                </tbody>', '                            </tbody>')
rest_of_content = rest_of_content.replace('                            </table>', '                        </table>')
rest_of_content = rest_of_content.replace('                        </div>', '                    </div>')
rest_of_content = rest_of_content.replace('                    </div>', '                </div>')
rest_of_content = rest_of_content.replace('                </div>', '            </div>')
rest_of_content = rest_of_content.replace('                <!-- Activity Tracker -->', '            <!-- Activity Tracker -->')
rest_of_content = rest_of_content.replace('                <div class="activity-tracker-card">', '            <div class="activity-tracker-card">')
rest_of_content = rest_of_content.replace('                    <div class="activity-tracker-header">', '                <div class="activity-tracker-header">')
rest_of_content = rest_of_content.replace('                        <div class="activity-tracker-title">', '                    <div class="activity-tracker-title">')
rest_of_content = rest_of_content.replace('                            <svg', '                        <svg')
rest_of_content = rest_of_content.replace('                                <path', '                            <path')
rest_of_content = rest_of_content.replace('                            </svg>', '                        </svg>')
rest_of_content = rest_of_content.replace('                            <h3>', '                        <h3>')
rest_of_content = rest_of_content.replace('                        </div>', '                    </div>')
rest_of_content = rest_of_content.replace('                        <button', '                    <button')
rest_of_content = rest_of_content.replace('                        </button>', '                    </button>')
rest_of_content = rest_of_content.replace('                    </div>', '                </div>')
rest_of_content = rest_of_content.replace('                    <div class="activity-tracker-list"', '                <div class="activity-tracker-list"')
rest_of_content = rest_of_content.replace('                        <!-- Tracker', '                    <!-- Tracker')
rest_of_content = rest_of_content.replace('                    </div>', '                </div>')
rest_of_content = rest_of_content.replace('                </div>', '            </div>')
rest_of_content = rest_of_content.replace('                <!-- Empty State -->', '            <!-- Empty State -->')
rest_of_content = rest_of_content.replace('                <div class="empty-state"', '            <div class="empty-state"')
rest_of_content = rest_of_content.replace('                    <svg', '                <svg')
rest_of_content = rest_of_content.replace('                        <circle', '                    <circle')
rest_of_content = rest_of_content.replace('                        <path', '                    <path')
rest_of_content = rest_of_content.replace('                        <defs>', '                    <defs>')
rest_of_content = rest_of_content.replace('                            <linearGradient', '                        <linearGradient')
rest_of_content = rest_of_content.replace('                                <stop', '                            <stop')
rest_of_content = rest_of_content.replace('                            </linearGradient>', '                        </linearGradient>')
rest_of_content = rest_of_content.replace('                        </defs>', '                    </defs>')
rest_of_content = rest_of_content.replace('                    </svg>', '                </svg>')
rest_of_content = rest_of_content.replace('                    <h3>', '                <h3>')
rest_of_content = rest_of_content.replace('                    <p>', '                <p>')
rest_of_content = rest_of_content.replace('                </div>', '            </div>')
rest_of_content = rest_of_content.replace('            </div>', '        </div>')
rest_of_content = rest_of_content.replace('            </main>', '    </main>')
rest_of_content = rest_of_content.replace('            <!-- Add/Edit Employee Modal -->', '    <!-- Add/Edit Employee Modal -->')
rest_of_content = rest_of_content.replace('            <div class="modal"', '    <div class="modal"')
rest_of_content = rest_of_content.replace('                <div class="modal-content">', '        <div class="modal-content">')
rest_of_content = rest_of_content.replace('                    <div class="modal-header">', '            <div class="modal-header">')
rest_of_content = rest_of_content.replace('                        <h3', '                <h3')
rest_of_content = rest_of_content.replace('                        <button', '                <button')
rest_of_content = rest_of_content.replace('                            <svg', '                    <svg')
rest_of_content = rest_of_content.replace('                                <path', '                        <path')
rest_of_content = rest_of_content.replace('                            </svg>', '                    </svg>')
rest_of_content = rest_of_content.replace('                        </button>', '                </button>')
rest_of_content = rest_of_content.replace('                    </div>', '            </div>')
rest_of_content = rest_of_content.replace('                    <div class="modal-body">', '            <div class="modal-body">')
rest_of_content = rest_of_content.replace('                        <form', '                <form')
rest_of_content = rest_of_content.replace('                            <div class="form-group">', '                    <div class="form-group">')
rest_of_content = rest_of_content.replace('                                <label', '                        <label')
rest_of_content = rest_of_content.replace('                                <input', '                        <input')
rest_of_content = rest_of_content.replace('                            </div>', '                    </div>')
rest_of_content = rest_of_content.replace('                            <div class="form-actions">', '                    <div class="form-actions">')
rest_of_content = rest_of_content.replace('                                <button', '                        <button')
rest_of_content = rest_of_content.replace('                            </div>', '                    </div>')
rest_of_content = rest_of_content.replace('                        </form>', '                </form>')
rest_of_content = rest_of_content.replace('                    </div>', '            </div>')
rest_of_content = rest_of_content.replace('                </div>', '        </div>')
rest_of_content = rest_of_content.replace('            </div>', '    </div>')
rest_of_content = rest_of_content.replace('            <!-- Activity Modal -->', '    <!-- Activity Modal -->')
rest_of_content = rest_of_content.replace('                            <select', '                        <select')
rest_of_content = rest_of_content.replace('                                    <option', '                            <option')
rest_of_content = rest_of_content.replace('                                </select>', '                        </select>')
rest_of_content = rest_of_content.replace('                                <textarea', '                        <textarea')
rest_of_content = rest_of_content.replace('                                </textarea>', '                        </textarea>')
rest_of_content = rest_of_content.replace('            <!-- Employee Action Modal', '    <!-- Employee Action Modal')
rest_of_content = rest_of_content.replace('                        <input type="hidden"', '                <input type="hidden"')
rest_of_content = rest_of_content.replace('                        <p', '                <p')
rest_of_content = rest_of_content.replace('                        <!-- Action Buttons -->', '                <!-- Action Buttons -->')
rest_of_content = rest_of_content.replace('                        <div id="actionButtons"', '                <div id="actionButtons"')
rest_of_content = rest_of_content.replace('                            <button class="btn"', '                    <button class="btn"')
rest_of_content = rest_of_content.replace('                                <svg', '                        <svg')
rest_of_content = rest_of_content.replace('                                    <path', '                            <path')
rest_of_content = rest_of_content.replace('                                </svg>', '                        </svg>')
rest_of_content = rest_of_content.replace('                            </button>', '                    </button>')
rest_of_content = rest_of_content.replace('                        </div>', '                </div>')
rest_of_content = rest_of_content.replace('                        <!-- Time Selection Form', '                <!-- Time Selection Form')
rest_of_content = rest_of_content.replace('                        <div id="timeSelectionForm"', '                <div id="timeSelectionForm"')
rest_of_content = rest_of_content.replace('                            <h4', '                    <h4')
rest_of_content = rest_of_content.replace('                            </h4>', '                    </h4>')
rest_of_content = rest_of_content.replace('                            <div class="form-group"', '                    <div class="form-group"')
rest_of_content = rest_of_content.replace('                                <label', '                        <label')
rest_of_content = rest_of_content.replace('                                    <input', '                            <input')
rest_of_content = rest_of_content.replace('                                </label>', '                        </label>')
rest_of_content = rest_of_content.replace('                                <select', '                        <select')
rest_of_content = rest_of_content.replace('                                    <!-- Options', '                            <!-- Options')
rest_of_content = rest_of_content.replace('                                </select>', '                        </select>')
rest_of_content = rest_of_content.replace('                                <textarea', '                        <textarea')
rest_of_content = rest_of_content.replace('                                </textarea>', '                        </textarea>')
rest_of_content = rest_of_content.replace('                            </div>', '                    </div>')
rest_of_content = rest_of_content.replace('                        </div>', '                </div>')
rest_of_content = rest_of_content.replace('                    </div>', '            </div>')
rest_of_content = rest_of_content.replace('                </div>', '        </div>')
rest_of_content = rest_of_content.replace('            </div>', '    </div>')
rest_of_content = rest_of_content.replace('            <script', '    <script')
rest_of_content = rest_of_content.replace('            <div class="footer">', '    <div class="footer">')
rest_of_content = rest_of_content.replace('                <a', '        <a')
rest_of_content = rest_of_content.replace('                by', '        by')
rest_of_content = rest_of_content.replace('            </div>', '    </div>')

# Combine everything
final_content = head_section + rest_of_content

# Write the fixed file
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(final_content)

print("File fixed successfully!")
print("Admin SVG changed to settings gear icon")
print("Button text changed to 'Admin Panel' to prevent overflow")
