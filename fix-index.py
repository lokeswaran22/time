# Fix the corrupted index.html file
import re

# Read the broken file
with open('index.html.broken', 'r', encoding='utf-8') as f:
    content = f.read()

# Find where the corruption starts (after preloader)
# The file should have the header section after the preloader

fixed_header = '''    <!-- Header -->
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
            <!-- Date Selector -->'''

# Find the preloader end
preloader_end = content.find('</div>\n    <!-- Reminder Notification Container -->')
if preloader_end == -1:
    preloader_end = content.find('</div>\r\n    <!-- Reminder Notification Container -->')

if preloader_end != -1:
    # Find where the date selector card starts
    date_selector_start = content.find('<div class="date-selector-card">')
    
    if date_selector_start != -1:
        # Reconstruct the file
        before_header = content[:preloader_end + len('</div>\n    <!-- Reminder Notification Container -->\n    <div id="reminderContainer"></div>\n\n')]
        after_header = '\n' + content[date_selector_start:]
        
        fixed_content = before_header + fixed_header + after_header
        
        # Write the fixed file
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print("File fixed successfully!")
    else:
        print("Could not find date-selector-card")
else:
    print("Could not find preloader end")
