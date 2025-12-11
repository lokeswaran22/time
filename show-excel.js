const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('Timesheet.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('=== TIMESHEET.XLSX CONTENTS ===\n');
console.log(`Sheet Name: ${sheetName}\n`);

// Convert to array of arrays
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

console.log(`Total Rows: ${data.length}\n`);
console.log('='.repeat(120));

// Print all rows with formatting
data.forEach((row, index) => {
    if (!row || row.length === 0) {
        console.log(`\nRow ${index}: [EMPTY]\n`);
        return;
    }

    console.log(`\nRow ${index}:`);
    console.log('-'.repeat(120));

    if (index === 0 || index === 1) {
        // Header rows
        console.log(`  ${row.join(' ')}`);
    } else if (index === 2) {
        // Column headers
        row.forEach((cell, colIndex) => {
            console.log(`  Col ${colIndex}: ${cell}`);
        });
    } else {
        // Data rows
        console.log(`  S.No: ${row[0] || 'N/A'}`);
        console.log(`  Employee: ${row[1] || 'N/A'}`);
        console.log(`  Activities:`);

        const timeSlots = [
            '9:00-10:00',
            '10:00-11:00',
            '11:00-11:10',
            '11:10-12:00',
            '12:00-01:00',
            '01:00-01:40',
            '01:40-03:00',
            '03:00-03:50',
            '03:50-04:00',
            '04:00-05:00',
            '05:00-06:00',
            '06:00-07:00',
            '07:00-08:00'
        ];

        for (let i = 2; i < row.length && i < 15; i++) {
            const slotIndex = i - 2;
            const activity = row[i];
            if (activity && activity.toString().trim() !== '') {
                console.log(`    ${timeSlots[slotIndex]}: ${activity}`);
            }
        }
    }
});

console.log('\n' + '='.repeat(120));
console.log('\n=== SUMMARY ===');

// Count employees
const employees = new Set();
for (let i = 3; i < data.length; i++) {
    if (data[i] && data[i][1]) {
        employees.add(data[i][1]);
    }
}

console.log(`\nUnique Employees Found: ${employees.size}`);
console.log('Employee List:');
Array.from(employees).sort().forEach(emp => {
    console.log(`  - ${emp}`);
});

// Count total activities
let activityCount = 0;
for (let i = 3; i < data.length; i++) {
    if (data[i]) {
        for (let j = 2; j < data[i].length; j++) {
            if (data[i][j] && data[i][j].toString().trim() !== '') {
                activityCount++;
            }
        }
    }
}

console.log(`\nTotal Activities: ${activityCount}`);
console.log('\n' + '='.repeat(120));
