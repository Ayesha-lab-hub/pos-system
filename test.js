const http = require('http');

const testAPI = (path, payload) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

(async () => {
  const customerRes = await testAPI('/api/customers', { name: 'Test', phone: '123', customerId: '' });
  console.log('Customer API:', customerRes);

  const itemRes = await testAPI('/api/items', { itemId: '1', itemName: 'Apple' });
  console.log('Item API:', itemRes);
})();
