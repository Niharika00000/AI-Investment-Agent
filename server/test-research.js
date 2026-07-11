async function test() {
  try {
    let token = '';
    
    // Attempt signup first
    console.log('Attempting signup...');
    const signupRes = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test99@test.com', password: 'test123', name: 'Test User' })
    });
    
    const signupData = await signupRes.json();
    if (signupRes.status === 201) {
      console.log('Signup success!');
      token = signupData.token;
    } else if (signupRes.status === 409) {
      console.log('User already exists, attempting login...');
      const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test99@test.com', password: 'test123' })
      });
      const loginData = await loginRes.json();
      token = loginData.token;
    } else {
      console.error('Signup failed:', signupData);
      return;
    }

    if (!token) {
      console.error('No token received, cannot test research');
      return;
    }

    console.log('Token received successfully.');

    // Now call research
    console.log('Triggering research request for Google...');
    const researchRes = await fetch('http://localhost:3001/api/research', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ companyName: 'Google' })
    });
    
    const text = await researchRes.text();
    console.log('Research status:', researchRes.status);
    console.log('Research body:', text.substring(0, 1000));
  } catch (e) {
    console.error('Test failed:', e.message);
  }
}

test();
