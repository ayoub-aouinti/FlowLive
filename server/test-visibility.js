const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'flowlive_secret_key_2026';

const workerToken = jwt.sign(
  { id: 'user_1', name: 'Standard User', email: 'user@flow.com', role: 'worker', departmentId: 'dept_1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function test() {
  try {
    console.log('Testing Project Visibility for Workers...');
    
    // Test projects list
    const projectsRes = await axios.get('http://localhost:5001/api/projects', {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('Projects for Worker (user_1, dept_1):', projectsRes.data.length);
    
    const allMatch = projectsRes.data.every(p => p.departmentId === 'dept_1' && p.assignedTo === 'user_1');
    if (projectsRes.data.length > 0 && allMatch) {
      console.log('✅ Visibility test passed!');
    } else if (projectsRes.data.length === 0) {
      console.log('❌ No projects found for worker! (Check assignedTo and departmentId in projects.json)');
    } else {
      console.log('❌ Some projects did not match the expected filter!');
    }

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
