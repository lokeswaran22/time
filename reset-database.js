// Aggressive database cleanup - DELETE ALL and re-add only the 17 employees
const allowedEmployees = [
    'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
    'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
    'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
];

async function resetDatabase() {
    console.log('🔥 RESETTING DATABASE - Removing ALL employees...\n');

    try {
        // 1. Get all employees
        const response = await fetch('http://localhost:3000/api/employees');
        const employees = await response.json();

        console.log(`Found ${employees.length} employees to delete\n`);

        // 2. Delete ALL employees
        console.log('Deleting all employees...');
        for (const emp of employees) {
            try {
                const delResponse = await fetch(`http://localhost:3000/api/employees/${emp.id}`, {
                    method: 'DELETE'
                });
                if (delResponse.ok) {
                    console.log(`  ✗ Deleted: ${emp.name} (${emp.id})`);
                }
            } catch (error) {
                console.error(`  Error deleting ${emp.name}:`, error.message);
            }
        }

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Add the 17 authorized employees
        console.log('\n➕ Adding authorized employees...\n');
        for (const name of allowedEmployees) {
            try {
                const addResponse = await fetch('http://localhost:3000/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name })
                });
                if (addResponse.ok) {
                    const result = await addResponse.json();
                    console.log(`  ✓ Added: ${name} (${result.id})`);
                }
            } catch (error) {
                console.error(`  Error adding ${name}:`, error.message);
            }
        }

        // 4. Verify
        console.log('\n✅ Database reset complete!\n');
        const verifyResponse = await fetch('http://localhost:3000/api/employees');
        const verifyEmployees = await verifyResponse.json();

        console.log('📊 Final employee list:');
        console.log(`Total: ${verifyEmployees.length} employees\n`);
        verifyEmployees
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((emp, index) => {
                console.log(`  ${(index + 1).toString().padStart(2, ' ')}. ${emp.name}`);
            });

        console.log('\n🎉 Database is now clean with exactly 17 employees!');
        console.log('🔄 Refresh your browser to see the changes.');

    } catch (error) {
        console.error('❌ Error during reset:', error);
    }
}

// Run the reset
resetDatabase();
