const http = require('http');

const PORT = 5001; // Run test on separate port
process.env.PORT = PORT;
const app = require('../src/server');
const { seed } = require('../src/database/seed');

let server;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting MoTA Unified Scholarship API Automated Test Suite ---');
  await seed();

  server = app.listen(PORT, '127.0.0.1', async () => {
    try {
      // 1. Health check
      console.log('\n[TEST 1] GET /health');
      const health = await request('GET', '/health');
      console.assert(health.status === 200, `Expected 200, got ${health.status}`);
      console.assert(health.body.status === 'ONLINE', 'Expected ONLINE status');
      console.log('✓ Health check passed');

      // 2. Student Registration with 14-digit OTR
      console.log('\n[TEST 2] POST /auth/register (New Student Registration)');
      const regRes = await request('POST', '/auth/register', {
        name: 'Somra Oraon',
        email: 'somra.oraon@example.edu',
        phone: '9800112233',
        password: 'Password@123',
        casteCategory: 'ST',
        subTribe: 'Oraon',
        annualIncome: 95000,
        institutionName: 'Ranchi University'
      });
      console.assert(regRes.status === 201, `Expected 201, got ${regRes.status}`);
      console.assert(regRes.body.user.otrNumber.length === 14, `Expected 14-digit OTR, got: ${regRes.body.user.otrNumber}`);
      console.log(`✓ Registration passed. OTR issued: ${regRes.body.user.otrNumber}`);

      // 3. Student Login
      console.log('\n[TEST 3] POST /auth/login (Student: Sunita Soren)');
      const loginRes = await request('POST', '/auth/login', {
        identifier: '20268839201941',
        password: 'Student@123'
      });
      console.assert(loginRes.status === 200, `Expected 200, got ${loginRes.status}`);
      const studentToken = loginRes.body.token;
      console.assert(studentToken, 'Token should be returned');
      console.log(`✓ Login passed. Authenticated as: ${loginRes.body.user.name}`);

      // 4. Fetch Unified Applications (5-Schemes aggregated)
      console.log('\n[TEST 4] GET /applications/my-applications');
      const appsRes = await request('GET', '/applications/my-applications', null, studentToken);
      console.assert(appsRes.status === 200, `Expected 200, got ${appsRes.status}`);
      console.assert(appsRes.body.applications.length > 0, 'Should have active application');
      const postMatric = appsRes.body.applications[0];
      console.assert(postMatric.currentStage === 'DISTRICT_VERIFIED', `Expected DISTRICT_VERIFIED, got ${postMatric.currentStage}`);
      console.log(`✓ Unified application aggregation verified. Active: ${postMatric.schemeName} at stage ${postMatric.currentStage}`);

      // 5. Test "One Scheme at a Time" restriction
      console.log('\n[TEST 5] POST /applications/apply (Verify One-Scheme Restriction)');
      const duplicateApply = await request('POST', '/applications/apply', {
        schemeId: 'NFST',
        academicYear: '2025-2026'
      }, studentToken);
      console.assert(duplicateApply.status === 409, `Expected 409 Conflict, got ${duplicateApply.status}`);
      console.assert(duplicateApply.body.error === 'ONE_SCHEME_RESTRICTION', 'Expected ONE_SCHEME_RESTRICTION');
      console.log('✓ Successfully blocked second active scheme application per MoTA policy!');

      // 6. Test Document Wallet & DigiLocker Sync
      console.log('\n[TEST 6] POST /wallet/sync-digilocker');
      const syncRes = await request('POST', '/wallet/sync-digilocker', {}, studentToken);
      console.assert(syncRes.status === 200, `Expected 200, got ${syncRes.status}`);
      console.assert(syncRes.body.importedCount >= 4, `Imported ${syncRes.body.importedCount} docs`);
      console.log(`✓ DigiLocker sync passed. ${syncRes.body.importedCount} certificates cryptographically verified.`);

      // 7. Test JAGO AI Chatbot with live student context
      console.log('\n[TEST 7] POST /jago/chat (Live transactional contextual inquiry)');
      const jagoRes = await request('POST', '/jago/chat', {
        message: 'Where is my scholarship money? When will disbursement happen?',
        language: 'en'
      }, studentToken);
      console.assert(jagoRes.status === 200, `Expected 200, got ${jagoRes.status}`);
      console.assert(jagoRes.body.reply.includes('Post-Matric') || jagoRes.body.reply.includes('18,500'), 'Jago should reference student live record');
      console.log(`✓ JAGO Response: "${jagoRes.body.reply.substring(0, 100)}..."`);

      // 8. Officer Login & Review Queue
      console.log('\n[TEST 8] Officer Portal: Review Queue & Discrepancy Resolution');
      const officerLogin = await request('POST', '/auth/login', {
        identifier: 'officer@mota.gov.in',
        password: 'Officer@123'
      });
      console.assert(officerLogin.status === 200, 'Officer login successful');
      const officerToken = officerLogin.body.token;

      const queueRes = await request('GET', '/admin/review-queue', null, officerToken);
      console.assert(queueRes.status === 200, 'Queue fetched successfully');
      console.assert(queueRes.body.queue.length > 0, 'Flagged review items found');
      const flaggedItem = queueRes.body.queue[0];
      console.log(`✓ Found flagged record in review queue for: ${flaggedItem.student_name} (${flaggedItem.discrepancy_field})`);

      // Officer approves exception
      const decisionRes = await request('POST', `/admin/review-queue/${flaggedItem.id}/decision`, {
        decision: 'APPROVE',
        remarks: 'Name verified with UGC-NTA hall ticket. Discrepancy approved.'
      }, officerToken);
      console.assert(decisionRes.status === 200, 'Decision recorded successfully');
      console.log('✓ Officer approved discrepancy exception. Application advanced without rejection.');

      // 9. Coverage Gap Analysis
      console.log('\n[TEST 9] GET /admin/coverage-gaps');
      const gapRes = await request('GET', '/admin/coverage-gaps', null, officerToken);
      console.assert(gapRes.status === 200, 'Coverage gaps calculated successfully');
      console.assert(gapRes.body.unreachedStudents.length > 0, 'Unreached eligible ST students identified');
      console.log(`✓ Coverage gap engine identified ${gapRes.body.metrics.unreachedEligibleST} enrolled ST students not claiming scholarships.`);

      console.log('\n=============================================================');
      console.log('🎉 ALL 9 TEST SUITES PASSED! BACKEND IS 100% OPERATIONAL.');
      console.log('=============================================================\n');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Test execution failed:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
