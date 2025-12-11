// Add multiple employees to the timesheet database
const employees = [
    'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
    'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
    'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
];

async function addEmployees() {
    console.log('Adding employees to the database...');

    for (const name of employees) {
        try {
            const response = await fetch('http://localhost:3000/api/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✓ Added: ${name} (ID: ${result.id})`);
            } else {
                console.error(`✗ Failed to add: ${name}`);
            }
        } catch (error) {
            console.error(`✗ Error adding ${name}:`, error.message);
        }
    }

    console.log('\nAll employees have been added!');
    console.log('Refresh your browser to see the updated timesheet.');
}

// Run the function
addEmployees();
