const XLSX = require('xlsx');
const EmployeeModel = require('../models/employee.model');
const TimesheetModel = require('../models/timesheet.model');

class ExportController {
    /**
     * Export timesheet to Excel
     */
    static async exportToExcel(req, res) {
        try {
            const { dateKey } = req.query;

            if (!dateKey) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Date is required'
                });
            }

            // Get all employees and their timesheet entries
            const employees = await EmployeeModel.getAll({ status: 'active' });
            const entries = await TimesheetModel.getByDate(dateKey);

            // Group entries by employee
            const entriesByEmployee = {};
            entries.forEach(entry => {
                if (!entriesByEmployee[entry.employeeId]) {
                    entriesByEmployee[entry.employeeId] = {};
                }
                entriesByEmployee[entry.employeeId][entry.timeSlot] = entry;
            });

            // Define time slots
            const timeSlots = [
                '9:00-10:00', '10:00-11:00', '11:00-11:10', '11:10-12:00',
                '12:00-01:00', '01:00-01:40', '01:40-03:00', '03:00-03:50',
                '03:50-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00', '07:00-08:00'
            ];

            // Create Excel data
            const data = [];
            const header = ['Employee Name', 'Proof Pages', 'Epub Pages', 'Calibr Pages', ...timeSlots];
            data.push(header);

            employees.forEach(emp => {
                const row = [emp.name];

                // Calculate totals
                let proofTotal = 0, epubTotal = 0, calibrTotal = 0;

                timeSlots.forEach(slot => {
                    const entry = entriesByEmployee[emp.id]?.[slot];
                    if (entry && entry.pagesDone) {
                        const pages = parseInt(entry.pagesDone) || 0;
                        if (entry.activityType === 'proof') proofTotal += pages;
                        else if (entry.activityType === 'epub') epubTotal += pages;
                        else if (entry.activityType === 'calibr') calibrTotal += pages;
                    }
                });

                row.push(proofTotal > 0 ? proofTotal : '');
                row.push(epubTotal > 0 ? epubTotal : '');
                row.push(calibrTotal > 0 ? calibrTotal : '');

                // Add time slot data
                timeSlots.forEach(slot => {
                    const entry = entriesByEmployee[emp.id]?.[slot];
                    if (entry) {
                        let cellContent = entry.activityType.toUpperCase();
                        if (entry.description && entry.activityType !== 'break' && entry.activityType !== 'lunch') {
                            cellContent += `: ${entry.description}`;
                        }
                        if (entry.pagesDone) {
                            cellContent += ` (${entry.pagesDone} pages)`;
                        }
                        row.push(cellContent);
                    } else {
                        row.push('');
                    }
                });

                data.push(row);
            });

            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);

            // Set column widths
            const colWidths = [
                { wch: 20 },  // Employee Name
                { wch: 12 },  // Proof Pages
                { wch: 12 },  // Epub Pages
                { wch: 12 },  // Calibr Pages
                ...timeSlots.map(() => ({ wch: 25 }))
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

            // Generate buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Send file
            res.setHeader('Content-Disposition', `attachment; filename="Timesheet_${dateKey}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

        } catch (error) {
            console.error('Export to Excel error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to export timesheet'
            });
        }
    }
}

module.exports = ExportController;
