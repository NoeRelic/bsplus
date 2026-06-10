fetch('http://localhost:3000/api/admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'adminToken=b.batin123'
  },
  body: JSON.stringify({ action: 'createUser', payload: { package: 'Gold' } })
})
.then(r => r.json())
.then(data => console.log(data))
.catch(err => console.error(err));
