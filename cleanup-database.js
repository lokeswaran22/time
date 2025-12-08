// Clean up database - remove duplicates and ensure only authorized employees exist
const allowedEmployees = [
    'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
    'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
    'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
];

async function cleanupDatabase() {
    console.log('🧹 Starting database cleanup...\n');

    try {
        // 1. Get all employees
        const response = await fetch('http://localhost:3000/api/employees');
        const employees = await response.json();

        console.log(`Found ${employees.length} employees in database`);

        // 2. Group employees by name to find duplicates
        const employeesByName = {};
        employees.forEach(emp => {
            if (!employeesByName[emp.name]) {
                employeesByName[emp.name] = [];
            }
            employeesByName[emp.name].push(emp);
        });

        // 3. Delete unauthorized employees
        console.log('\n📋 Removing unauthorized employees...');
        let removedCount = 0;
        for (const emp of employees) {
            if (!allowedEmployees.includes(emp.name)) {
                try {
                    const delResponse = await fetch(`http://localhost:3000/api/employees/${emp.id}`, {
                        method: 'DELETE'
                    });
                    if (delResponse.ok) {
                        console.log(`  ✗ Removed: ${emp.name} (${emp.id})`);
                        removedCount++;
                    }
                } catch (error) {
                    console.error(`  ✗ Error removing ${emp.name}:`, error.message);
                }
            }
        }

        // 4. Remove duplicates (keep only the first occurrence of each name)
        console.log('\n🔄 Removing duplicates...');
        let duplicatesRemoved = 0;
        for (const name of allowedEmployees) {
            const emps = employeesByName[name] || [];
            if (emps.length > 1) {
                console.log(`  Found ${emps.length} copies of ${name}`);
                // Keep the first one, delete the rest
                for (let i = 1; i < emps.length; i++) {
                    try {
                        const delResponse = await fetch(`http://localhost:3000/api/employees/${emps[i].id}`, {
                            method: 'DELETE'
                        });
                        if (delResponse.ok) {
                            console.log(`    ✗ Removed duplicate: ${name} (${emps[i].id})`);
                            duplicatesRemoved++;
                        }
                    } catch (error) {
                        console.error(`    ✗ Error removing duplicate ${name}:`, error.message);
                    }
                }
            }
        }

        // 5. Add any missing employees
        console.log('\n➕ Adding missing employees...');
        const finalResponse = await fetch('http://localhost:3000/api/employees');
        const finalEmployees = await finalResponse.json();
        const existingNames = new Set(finalEmployees.map(e => e.name));

        let addedCount = 0;
        for (const name of allowedEmployees) {
            if (!existingNames.has(name)) {
                try {
                    const addResponse = await fetch('http://localhost:3000/api/employees', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name })
                    });
                    if (addResponse.ok) {
                        const result = await addResponse.json();
                        console.log(`  ✓ Added: ${name} (${result.id})`);
                        addedCount++;
                    }
                } catch (error) {
                    console.error(`  ✗ Error adding ${name}:`, error.message);
                }
            }
        }

        // 6. Final verification
        console.log('\n✅ Database cleanup complete!\n');
        const verifyResponse = await fetch('http://localhost:3000/api/employees');
        const verifyEmployees = await verifyResponse.json();

        console.log('📊 Summary:');
        console.log(`  - Unauthorized employees removed: ${removedCount}`);
        console.log(`  - Duplicates removed: ${duplicatesRemoved}`);
        console.log(`  - Missing employees added: ${addedCount}`);
        console.log(`  - Total employees now: ${verifyEmployees.length}`);
        console.log('\n👥 Current employees (alphabetically):');
        verifyEmployees
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((emp, index) => {
                console.log(`  ${(index + 1).toString().padStart(2, ' ')}. ${emp.name}`);
            });

        console.log('\n🎉 Database is now clean! Refresh your browser to see the changes.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

// Run the cleanup
cleanupDatabase();
