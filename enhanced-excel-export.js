// Enhanced Excel Export with Professional Formatting
// Replace the export button click handler in history.html with this code

document.getElementById('exportExcelBtn').addEventListener('click', () => {
    const table = document.querySelector('.master-table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));

    if (rows.length === 0 || (rows.length === 1 && rows[0].innerText.includes('No activities found'))) {
        alert('No data to export!');
        return;
    }

    // Create data array for Excel
    const data = [];

    // Add Header Row
    const headers = ['Date', 'Employee', 'Time Slot', 'Type', 'Description', 'Total Pages', 'Pages Done', 'Timestamp'];
    data.push(headers);

    // Add Data Rows (respecting current filters)
    rows.forEach(row => {
        if (row.style.display !== 'none') {
            const cells = row.querySelectorAll('td');
            const rowData = [
                cells[0].innerText, // Date
                cells[1].innerText, // Employee
                cells[2].innerText, // Time Slot
                cells[3].innerText, // Type
                cells[4].innerText, // Description
                cells[5].innerText, // Total Pages
                cells[6].innerText, // Pages Done
                cells[7].innerText  // Timestamp
            ];
            data.push(rowData);
        }
    });

    // Create Workbook and Worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Calculate optimal column widths based on content
    const colWidths = headers.map((header, colIndex) => {
        let maxWidth = header.length;
        data.forEach((row, rowIndex) => {
            if (rowIndex > 0 && row[colIndex]) {
                const cellLength = String(row[colIndex]).length;
                maxWidth = Math.max(maxWidth, cellLength);
            }
        });
        return { wch: Math.min(maxWidth + 2, 50) }; // Max width 50 chars
    });
    ws['!cols'] = colWidths;

    // Style the header row (Row 1)
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: "1E3A8A" } }, // Royal Navy Blue
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    // Apply header styling
    headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = headerStyle;
    });

    // Style data cells with borders
    const dataStyle = {
        border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
        },
        alignment: { vertical: "top", wrapText: true }
    };

    // Apply data cell styling
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
            ws[cellAddress].s = dataStyle;
        }
    }

    // Freeze the header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Set row height for header
    ws['!rows'] = [{ hpt: 25 }]; // Header row height

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Admin Panel Activity");

    // Generate Excel File with proper formatting
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Admin_Panel_Activity_${dateStr}.xlsx`, {
        bookType: 'xlsx',
        cellStyles: true
    });
});
