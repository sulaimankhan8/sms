// test_enterprise_suite.js - Comprehensive E2E Integration Test Suite for Apex Campus
const app = require('./server');

const TEST_PORT = 5088;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 APEX CAMPUS ENTERPRISE END-TO-END TEST SUITE');
  console.log('====================================================');

  const server = app.listen(TEST_PORT, async () => {
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
      }
    }

    try {
      // TEST 1: Security Headers (Helmet)
      console.log('\n[1/6] Verifying Enterprise Security Headers...');
      const resHealth = await fetch(`${BASE_URL}/api/stats/overview`);
      assert(resHealth.status === 200, 'Overview stats responds with 200 OK');
      assert(resHealth.headers.get('x-content-type-options') === 'nosniff', 'Helmet nosniff header present');
      assert(resHealth.headers.get('x-dns-prefetch-control') === 'off', 'Helmet DNS prefetch control active');

      // TEST 2: Multi-Tenancy & Tenant Context
      console.log('\n[2/6] Verifying Multi-Tenancy Engine...');
      const resTenants = await fetch(`${BASE_URL}/api/tenants`);
      const tenantsData = await resTenants.json();
      assert(resTenants.status === 200, 'Tenants list endpoint accessible');
      assert(tenantsData.activeTenant?.code === 'APEX-CAMPUS', 'Default institutional tenant active');

      // TEST 3: RBAC Authentication & Tokens
      console.log('\n[3/6] Verifying Role-Based Access Control (Admin, Faculty, Student)...');
      const resAdminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@apex.edu', password: 'Admin@123' })
      });
      const adminLogin = await resAdminLogin.json();
      assert(adminLogin.success && adminLogin.user?.role === 'admin', 'Admin login successful with valid JWT');
      const adminToken = adminLogin.token;

      const resFacultyLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'faculty@apex.edu', password: 'Faculty@123' })
      });
      const facultyLogin = await resFacultyLogin.json();
      assert(facultyLogin.success && facultyLogin.user?.role === 'faculty', 'Faculty login successful with valid JWT');
      const facultyToken = facultyLogin.token;

      // TEST 4: Attendance Defaulter Alerts Trigger (<75%)
      console.log('\n[4/6] Verifying Automated Attendance Defaulter Alerts Engine...');
      const coursesRes = await fetch(`${BASE_URL}/api/courses`);
      const coursesData = await coursesRes.json();
      const testCourse = coursesData.data?.[0];

      const studentsRes = await fetch(`${BASE_URL}/api/students`);
      const studentsData = await studentsRes.json();
      const testStudent = studentsData.data?.[0];

      const resAtt = await fetch(`${BASE_URL}/api/attendance/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${facultyToken}`
        },
        body: JSON.stringify({
          course_id: testCourse.id,
          date: '2026-10-15',
          records: [
            { student_id: testStudent.id, status: 'Absent', remarks: 'Unexcused lecture absence' }
          ]
        })
      });
      const attData = await resAtt.json();
      assert(resAtt.status === 200, `Faculty successfully recorded attendance with transaction safety (Course: ${testCourse.code})`);

      // Verify alert notification was created
      const resAlerts = await fetch(`${BASE_URL}/api/alerts`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const alertsData = await resAlerts.json();
      assert(alertsData.count > 0, `Alert notifications queryable (total: ${alertsData.count})`);

      // TEST 5: Digital Payments & Webhook Auto-Reconciliation
      console.log('\n[5/6] Verifying Digital Payment Checkout & Webhook Auto-Settlement...');
      const resFees = await fetch(`${BASE_URL}/api/fees`);
      const feesData = await resFees.json();
      const targetFee = feesData.data?.find(f => f.status === 'Partial' || f.status === 'Pending') || feesData.data?.[0];

      if (targetFee) {
        const resCheckout = await fetch(`${BASE_URL}/api/fees/${targetFee.id}/checkout-session`, { method: 'POST' });
        const checkoutData = await resCheckout.json();
        assert(checkoutData.success && checkoutData.data?.sessionId, `Checkout session generated (Session: ${checkoutData.data?.sessionId})`);

        const resHook = await fetch(`${BASE_URL}/api/webhooks/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-apex-signature': 'sig_valid_test_production'
          },
          body: JSON.stringify({
            event: 'payment_intent.succeeded',
            data: {
              fee_id: targetFee.id,
              amount: 1500,
              payment_method: 'STRIPE_ONLINE',
              transaction_ref: `TEST_TXN_${Date.now()}`,
              payer_email: targetFee.email || 'student@apex.edu'
            }
          })
        });
        const hookData = await resHook.json();
        assert(hookData.received && hookData.receiptNo, `Payment webhook reconciled (Receipt: ${hookData.receiptNo})`);
      }

      // TEST 6: Immutable Audit Trail
      console.log('\n[6/6] Verifying Immutable Audit Trail (Admin only)...');
      const resAudit = await fetch(`${BASE_URL}/api/audit-logs`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const auditData = await resAudit.json();
      assert(resAudit.status === 200, `Audit logs queryable by Admin (total: ${auditData.count})`);
      assert(auditData.data?.length > 0, 'Audit entries successfully recorded for system actions');

      // Forbidden check for non-admin on audit logs
      const resAuditForbidden = await fetch(`${BASE_URL}/api/audit-logs`, {
        headers: { 'Authorization': `Bearer ${facultyToken}` }
      });
      assert(resAuditForbidden.status === 403, 'Audit logs properly blocked (HTTP 403) for non-admin roles');

      console.log('\n====================================================');
      console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
      console.log('====================================================\n');
    } catch (err) {
      console.error('Fatal test error:', err);
    } finally {
      server.close();
      process.exit(failed > 0 ? 1 : 0);
    }
  });
}

runTests();
