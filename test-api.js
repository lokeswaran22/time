const http = require('http');

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function test() {
    try {
        console.log('Testing GET /api/employees...');
        const getRes = await makeRequest('GET', '/api/employees');
        console.log('GET Status:', getRes.status);
        console.log('Employee Count:', Array.isArray(getRes.body) ? getRes.body.length : 'Not an array');

        if (Array.isArray(getRes.body) && getRes.body.length === 0) {
            console.log('Employees list is empty. Attempting to add one...');
            const postRes = await makeRequest('POST', '/api/employees', {
                id: 'test_' + Date.now(),
                name: 'TestUser',
                createdAt: new Date().toISOString()
            });
            console.log('POST Status:', postRes.status);
            console.log('POST Body:', postRes.body);
        } else {
            console.log('Employees exist:', getRes.body.map(e => e.name).join(', '));
        }

    } catch (e) {
        console.error('Test failed:', e.message);
    }
}

test();
