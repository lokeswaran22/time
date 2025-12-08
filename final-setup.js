// Native fetch is available in Node.js 18+

// The 17 authorized employees
const employees = [
    'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
    'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
    'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
];

async function setup() {
    console.log('🚀 Starting Final Setup...');

    // 1. Cleanup Database
    try {
        console.log('🧹 Cleaning up database...');
        const cleanRes = await fetch('http://localhost:3000/api/cleanup-employees', { method: 'POST' });
        if (!cleanRes.ok) throw new Error(await cleanRes.text());
        console.log('✅ Database wiped.');
    } catch (e) {
        console.error('❌ Error cleaning database:', e.message);
        return;
    }

    // 2. Add Employees
    console.log(`\n➕ Adding ${employees.length} employees...`);
    for (const name of employees) {
        try {
            const res = await fetch('http://localhost:3000/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                console.log(`   ✓ Added ${name}`);
            } else {
                const err = await res.json();
                console.log(`   ⚠️ Could not add ${name}: ${err.error}`);
            }
        } catch (e) {
            console.error(`   ❌ Error adding ${name}:`, e.message);
        }
    }

    // 3. Verify
    try {
        const res = await fetch('http://localhost:3000/api/employees');
        const data = await res.json();
        console.log(`\n📊 Verification: Found ${data.length} employees.`);
        const names = data.map(e => e.name).sort();
        console.log('   Current List:', names.join(', '));

        if (data.length === 17) {
            console.log('\n✨ SUCCESS! Exactly 17 employees present.');
        } else {
            console.log('\n⚠️ WARNING: Count mismatch.');
        }
    } catch (e) {
        console.error('❌ Error verifying:', e.message);
    }
}

setup();
