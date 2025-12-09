async function testLogin() {
    const username = 'admin@pristonix';
    const password = '!pristonixadmin@2025';

    try {
        const response = await fetch('http://localhost:3005/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();
