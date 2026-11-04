// Integration tests. Run against a SEPARATE database (kmm_enquiry_test) on the same cluster,
// never the production database. Run: npm test
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_DB_NAME = 'kmm_enquiry_test';
process.env.ADMIN_SETUP_KEY = 'test-setup-key-123';

const { default: mongoose } = await import('mongoose');
const { default: app } = await import('../app.js');
const { connectDB } = await import('../config/db.js');
const { default: Admin } = await import('../models/Admin.js');
const { default: PA } = await import('../models/PA.js');
const { default: Course } = await import('../models/Course.js');
const { default: Enquiry } = await import('../models/Enquiry.js');
const { default: ContactActivity } = await import('../models/ContactActivity.js');

assert.equal(process.env.MONGODB_DB_NAME, 'kmm_enquiry_test');

let server;
let base;
const call = async (method, path, { body, token, headers = {} } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body && !['GET', 'HEAD'].includes(method) ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

const SETUP = { 'x-setup-key': 'test-setup-key-123' };
const ADMIN = { name: 'KMM Administrator', email: 'Admin@KMMcollege.edu.in', password: 'Str0ng!Passw0rd' };
let adminToken;
let paToken;
let paId;
const ctx = {};

before(async () => {
  await connectDB();
  for (const M of [Admin, PA, Course, Enquiry, ContactActivity]) {
    await M.deleteMany({});
    await M.init();
  }
  server = app.listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  for (const M of [Admin, PA, Course, Enquiry, ContactActivity]) await M.deleteMany({});
  server.close();
  await mongoose.disconnect();
});

test('setup-admin: missing / invalid key and weak input rejected', async () => {
  assert.equal((await call('POST', '/auth/setup-admin', { body: ADMIN })).status, 403);
  assert.equal((await call('POST', '/auth/setup-admin', { body: ADMIN, headers: { 'x-setup-key': 'wrong' } })).status, 403);
  const weak = await call('POST', '/auth/setup-admin', { body: { ...ADMIN, password: 'weak' }, headers: SETUP });
  assert.equal(weak.status, 400);
  assert.ok(weak.body.errors.password);
  assert.equal(await Admin.countDocuments({}), 0);
});

test('setup-admin: concurrent requests create exactly one admin', async () => {
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      call('POST', '/auth/setup-admin', { body: { ...ADMIN, email: `admin${i}@kmmcollege.edu.in` }, headers: SETUP })
    )
  );
  const statuses = results.map((r) => r.status);
  assert.equal(statuses.filter((s) => s === 201).length, 1, `statuses: ${statuses}`);
  assert.equal(statuses.filter((s) => s === 403).length, 9, `statuses: ${statuses}`);
  assert.equal(await Admin.countDocuments({}), 1);
  const created = results.find((r) => r.status === 201);
  assert.equal(created.body.data.admin.password, undefined);
  ctx.adminEmail = created.body.data.admin.email;
});

test('setup-admin: second admin rejected', async () => {
  const r = await call('POST', '/auth/setup-admin', { body: ADMIN, headers: SETUP });
  assert.equal(r.status, 403);
  assert.equal(await Admin.countDocuments({}), 1);
});

test('admin login: valid, invalid, unknown, inactive', async () => {
  const ok = await call('POST', '/auth/admin/login', { body: { username: ctx.adminEmail, password: ADMIN.password } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.user.role, 'ADMIN');
  assert.equal(ok.body.data.user.password, undefined);
  adminToken = ok.body.data.token;
  assert.equal((await call('GET', '/auth/me', { token: adminToken })).body.data.user.role, 'ADMIN');
  assert.equal((await call('POST', '/auth/admin/login', { body: { username: ctx.adminEmail, password: 'Wrong!Pass1234' } })).status, 401);
  assert.equal((await call('POST', '/auth/admin/login', { body: { username: 'nobody@x.com', password: ADMIN.password } })).status, 401);
  assert.equal((await call('POST', '/auth/admin/login', { body: { username: { $ne: '' }, password: { $ne: '' } } })).status, 400);

  await Admin.updateOne({}, { isActive: false });
  assert.equal((await call('POST', '/auth/admin/login', { body: { username: ctx.adminEmail, password: ADMIN.password } })).status, 403);
  assert.equal((await call('GET', '/auth/me', { token: adminToken })).status, 401);
  await Admin.updateOne({}, { isActive: true });
});

test('admin routes reject unauthenticated callers', async () => {
  for (const p of ['/admin/ping', '/admin/pa', '/admin/courses', '/admin/enquiries', '/admin/dashboard/stats']) {
    assert.equal((await call('GET', p)).status, 401, p);
  }
});

test('PA management: create, validate, duplicate, login, role isolation', async () => {
  const bad = await call('POST', '/admin/pa', { token: adminToken, body: { name: '', username: 'a', password: 'x', confirmPassword: 'y' } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.errors.name && bad.body.errors.username && bad.body.errors.password);

  const created = await call('POST', '/admin/pa', {
    token: adminToken, body: { name: 'Anita PA', username: 'Anita.PA', password: 'Passw0rd123', confirmPassword: 'Passw0rd123' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.pa.password, undefined);
  assert.equal(created.body.data.pa.username, 'anita.pa');
  assert.equal(created.body.data.pa.isActive, true);
  paId = created.body.data.pa.id;
  const raw = await PA.findById(paId).select('+password');
  assert.notEqual(raw.password, 'Passw0rd123');

  const dup = await call('POST', '/admin/pa', {
    token: adminToken, body: { name: 'Other', username: 'anita.pa', password: 'Passw0rd123', confirmPassword: 'Passw0rd123' },
  });
  assert.equal(dup.status, 409);

  const login = await call('POST', '/auth/pa/login', { body: { username: 'anita.pa', password: 'Passw0rd123' } });
  assert.equal(login.status, 200);
  paToken = login.body.data.token;

  for (const [m, p] of [['GET', '/admin/pa'], ['POST', '/admin/pa'], ['GET', '/admin/courses'], ['GET', '/admin/enquiries'], ['GET', '/admin/dashboard/stats'], ['DELETE', `/admin/pa/${paId}`]]) {
    assert.equal((await call(m, p, { token: paToken, body: {} })).status, 403, `${m} ${p}`);
  }
  assert.equal((await call('GET', '/pa/ping', { token: paToken })).status, 200);
  assert.equal((await call('GET', '/pa/ping', { token: adminToken })).status, 403);
});

test('PA management: edit keeps password, password reset, deactivate', async () => {
  let r = await call('PUT', `/admin/pa/${paId}`, { token: adminToken, body: { name: 'Anita Renamed' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.pa.name, 'Anita Renamed');
  assert.equal((await call('POST', '/auth/pa/login', { body: { username: 'anita.pa', password: 'Passw0rd123' } })).status, 200);

  r = await call('PUT', `/admin/pa/${paId}`, { token: adminToken, body: { password: 'NewPassw0rd456' } });
  assert.equal(r.status, 200);
  assert.equal((await call('POST', '/auth/pa/login', { body: { username: 'anita.pa', password: 'Passw0rd123' } })).status, 401);
  const relog = await call('POST', '/auth/pa/login', { body: { username: 'anita.pa', password: 'NewPassw0rd456' } });
  assert.equal(relog.status, 200);
  paToken = relog.body.data.token;

  assert.equal((await call('PUT', `/admin/pa/${paId}`, { token: adminToken, body: { password: 'short' } })).status, 400);

  r = await call('PUT', `/admin/pa/${paId}`, { token: adminToken, body: { isActive: false } });
  assert.equal(r.body.data.pa.isActive, false);
  assert.equal((await call('POST', '/auth/pa/login', { body: { username: 'anita.pa', password: 'NewPassw0rd456' } })).status, 403);
  assert.equal((await call('GET', '/auth/me', { token: paToken })).status, 401);
  await call('PUT', `/admin/pa/${paId}`, { token: adminToken, body: { isActive: true } });
});

test('courses: CRUD, duplicate prevention, public visibility', async () => {
  const mk = (name, extra = {}) => call('POST', '/admin/courses', { token: adminToken, body: { name, ...extra } });
  const a = await mk('B.Com', { description: 'Commerce' });
  assert.equal(a.status, 201);
  assert.equal((await mk('  b.com ')).status, 409);
  assert.equal((await mk('B.COM')).status, 409);
  assert.equal((await mk('')).status, 400);
  const b = await mk('BCA');
  const c = await mk('BBA');
  ctx.courseA = a.body.data.course.id;
  ctx.courseB = b.body.data.course.id;
  ctx.courseC = c.body.data.course.id;

  let pub = await call('GET', '/courses');
  assert.deepEqual(pub.body.data.courses.map((x) => x.name).sort(), ['B.Com', 'BBA', 'BCA']);

  await call('PUT', `/admin/courses/${ctx.courseC}`, { token: adminToken, body: { isActive: false } });
  pub = await call('GET', '/courses');
  assert.deepEqual(pub.body.data.courses.map((x) => x.name).sort(), ['B.Com', 'BCA']);
  assert.equal((await call('PUT', `/admin/courses/${ctx.courseB}`, { token: adminToken, body: { name: 'b.com' } })).status, 409);
  assert.equal((await call('GET', '/admin/courses', { token: adminToken })).body.data.courses.length, 3);
});

const enquiry = (course, extra = {}) => ({
  name: 'Student One', phone: '9876543210', secondaryPhone: '9876543211', course, ...extra,
});

test('public enquiry: dynamic course validation, snapshot, mandatory phones', async () => {
  const good = await call('POST', '/enquiries', { body: enquiry('bca') });
  assert.equal(good.status, 201);
  assert.equal(good.body.data.enquiry.course, 'BCA');
  assert.equal(good.body.data.enquiry.status, 'NOT_CONTACTED');
  assert.equal((await call('POST', '/enquiries', { body: enquiry('BBA') })).status, 400); // inactive
  assert.equal((await call('POST', '/enquiries', { body: enquiry('Nonexistent') })).status, 400);
  assert.equal((await call('POST', '/enquiries', { body: enquiry('BCA', { secondaryPhone: '' }) })).status, 400);
  assert.equal((await call('POST', '/enquiries', { body: enquiry('BCA', { phone: '123' }) })).status, 400);
});

test('course rename/deactivate/delete never alter existing enquiries', async () => {
  await call('PUT', `/admin/courses/${ctx.courseB}`, { token: adminToken, body: { name: 'BCA (Renamed)' } });
  assert.ok(await Enquiry.findOne({ course: 'BCA' }));
  assert.equal(await Enquiry.countDocuments({ course: 'BCA (Renamed)' }), 0);
  await call('PUT', `/admin/courses/${ctx.courseB}`, { token: adminToken, body: { isActive: false } });
  let pub = await call('GET', '/courses');
  assert.deepEqual(pub.body.data.courses.map((x) => x.name), ['B.Com']);
  assert.equal((await call('POST', '/enquiries', { body: enquiry('BCA (Renamed)') })).status, 400);
  await call('DELETE', `/admin/courses/${ctx.courseB}`, { token: adminToken });
  assert.equal((await call('DELETE', `/admin/courses/${ctx.courseB}`, { token: adminToken })).status, 404);
  assert.ok(await Enquiry.findOne({ course: 'BCA' }));
  pub = await call('GET', '/courses');
  assert.equal(pub.body.data.courses.length, 1);
});

// IST helpers for seeding
const ist = (iso) => new Date(`${iso}+05:30`);

test('enquiry listing: search, filters, pagination, sorting, contact info', async () => {
  await Enquiry.deleteMany({});
  const docs = [];
  for (let i = 1; i <= 25; i += 1) {
    docs.push({
      name: `Student ${String(i).padStart(2, '0')}`, phone: `98000000${String(i).padStart(2, '0')}`, secondaryPhone: '9111111111',
      course: i % 2 ? 'B.Com' : 'MA English', email: i === 5 ? 'special.person@example.com' : '', notes: 'n'.repeat(i * 10),
      status: 'NOT_CONTACTED', contactedBy: null, contactedByName: '', contactedAt: null,
      createdAt: ist(`2026-02-${String((i % 20) + 1).padStart(2, '0')}T10:00:00`), updatedAt: new Date(),
    });
  }
  docs[0].status = 'CONTACTED';
  docs[0].contactedBy = new mongoose.Types.ObjectId(paId);
  docs[0].contactedByName = 'Anita Renamed';
  docs[0].contactedAt = ist('2026-02-05T12:00:00');
  await Enquiry.collection.insertMany(docs);

  const q = (s) => call('GET', `/admin/enquiries${s}`, { token: adminToken });
  let r = await q('?limit=10&page=1');
  assert.equal(r.body.data.pagination.total, 25);
  assert.equal(r.body.data.pagination.totalPages, 3);
  assert.equal(r.body.data.enquiries.length, 10);
  r = await q('?limit=10&page=3');
  assert.equal(r.body.data.enquiries.length, 5);
  assert.equal((await q('?search=student 07')).body.data.pagination.total, 1);
  assert.equal((await q('?search=special.person')).body.data.pagination.total, 1);
  assert.equal((await q('?search=9800000012')).body.data.pagination.total, 1);
  assert.equal((await q('?search=%2B919800000012')).body.data.pagination.total, 1);
  assert.equal((await q('?search=.*')).body.data.pagination.total, 0); // regex is escaped
  assert.equal((await q('?course=MA%20English')).body.data.pagination.total, 12);
  assert.equal((await q('?status=CONTACTED')).body.data.pagination.total, 1);
  assert.equal((await q('?status=BOGUS')).status, 400);
  assert.equal((await q('?preset=custom&from=2026-02-01&to=2026-02-01')).body.data.enquiries.every((e) => e.createdAt), true);
  const asc = (await q('?sort=asc&limit=100')).body.data.enquiries;
  assert.ok(new Date(asc[0].createdAt) <= new Date(asc[asc.length - 1].createdAt));

  const contacted = (await q('?status=CONTACTED')).body.data.enquiries[0];
  assert.equal(contacted.contactedBy.name, 'Anita Renamed');
  assert.equal(contacted.contactedBy.deleted, false);
  assert.ok(contacted.contactedAt);
});

test('PA deletion preserves enquiry attribution', async () => {
  const before = await call('GET', '/admin/pa', { token: adminToken });
  assert.equal(before.body.data.pas.find((p) => p.id === paId).totalContacted, 1);
  assert.equal((await call('DELETE', `/admin/pa/${paId}`, { token: adminToken })).status, 200);
  assert.equal((await call('DELETE', `/admin/pa/${paId}`, { token: adminToken })).status, 404);
  assert.equal(await PA.countDocuments({}), 0);
  assert.equal((await call('GET', '/auth/me', { token: paToken })).status, 401);
  const r = await call('GET', '/admin/enquiries?status=CONTACTED', { token: adminToken });
  assert.equal(r.body.data.enquiries.length, 1);
  assert.equal(r.body.data.enquiries[0].contactedBy.name, 'Anita Renamed');
  assert.equal(r.body.data.enquiries[0].contactedBy.deleted, true);
  assert.ok(r.body.data.enquiries[0].contactedAt);
});

test('analytics: counts, timezone boundaries, course and contact stats', async () => {
  await Enquiry.deleteMany({});
  const now = new Date();
  const mk = (createdAt, course, contacted = false) => ({
    name: 'X', phone: '9876543210', secondaryPhone: '9876543211', course, email: '', notes: '',
    status: contacted ? 'CONTACTED' : 'NOT_CONTACTED', contactedBy: null, contactedByName: contacted ? 'PA' : '', contactedAt: contacted ? createdAt : null,
    createdAt, updatedAt: createdAt,
  });
  await Enquiry.collection.insertMany([
    mk(now, 'B.Com', true),
    mk(now, 'B.Com'),
    mk(ist('2025-03-31T23:59:59.999'), 'B.Com'), // last ms of Mar 31 IST
    mk(ist('2025-04-01T00:00:00.000'), 'MA English', true), // first ms of Apr 1 IST
    mk(ist('2024-12-31T23:30:00.000'), 'MA English'),
  ]);
  const get = (p) => call('GET', `/admin/dashboard/${p}`, { token: adminToken });

  let s = (await get('stats')).body.data;
  assert.equal(s.overall.total, 5);
  assert.equal(s.overall.today, 2);
  assert.equal(s.overall.contacted, 2);
  assert.equal(s.overall.notContacted, 3);

  s = (await get('stats?year=2025&month=3&day=31')).body.data;
  assert.equal(s.filtered.total, 1);
  s = (await get('stats?year=2025&month=4&day=1')).body.data;
  assert.equal(s.filtered.total, 1);
  s = (await get('stats?year=2025&month=3')).body.data;
  assert.equal(s.filtered.total, 1);
  s = (await get('stats?year=2025')).body.data;
  assert.equal(s.filtered.total, 2);
  s = (await get('stats?year=2024')).body.data;
  assert.equal(s.filtered.total, 1); // Dec 31 23:30 IST belongs to 2024, though it is Jan 1 in some UTC offsets
  s = (await get('stats?preset=custom&from=2025-03-31&to=2025-04-01')).body.data;
  assert.equal(s.filtered.total, 2);
  assert.equal((await get('stats?preset=custom&from=2025-04-02&to=2025-04-01')).status, 400);
  assert.equal((await get('stats?preset=nope')).status, 400);
  assert.equal((await get('stats?preset=today')).body.data.filtered.total, 2);
  assert.equal((await get('stats?preset=yesterday')).body.data.filtered.total, 0);
  assert.equal((await get('stats?preset=today')).body.data.filtered.avgDaily, null); // insufficient data

  s = (await get('stats')).body.data;
  assert.equal(s.filtered.mostPopularCourse.course, 'B.Com');
  assert.equal(s.filtered.mostPopularCourse.count, 3);

  const cs = (await get('course-stats')).body.data.courses;
  assert.equal(cs.find((c) => c.course === 'B.Com').count, 3);
  assert.equal(cs.find((c) => c.course === 'MA English').count, 2);

  const ct = (await get('contact-stats')).body.data;
  assert.deepEqual([ct.total, ct.contacted, ct.notContacted, ct.completionPct], [5, 2, 3, 40]);

  const trend = (await get('enquiries-trend?preset=custom&from=2025-03-30&to=2025-04-02')).body.data;
  assert.equal(trend.unit, 'day');
  assert.deepEqual(trend.series.map((p) => [p.key, p.count]), [['2025-03-30', 0], ['2025-03-31', 1], ['2025-04-01', 1], ['2025-04-02', 0]]);
  const allTrend = (await get('enquiries-trend')).body.data;
  assert.equal(allTrend.unit, 'month');
  assert.equal(allTrend.total, 5);

  const mt = (await get('monthly-trends')).body.data.series;
  assert.equal(mt.length, 12);
  assert.equal(mt[11].count, 2);

  const ra = (await get('recent-activity')).body.data;
  assert.equal(ra.recentEnquiries.length, 5);
  assert.equal(ra.paActivity.length, 0 + 0 + 0); // contactedBy not set in these fixtures
});

test('PA Contact Workflow: mark contacted, revert, audit trail, race protection, and metrics', async () => {
  const paRes = await call('POST', '/admin/pa', {
    token: adminToken,
    body: { name: 'Rahul PA', username: 'rahul.pa', password: 'Password123', confirmPassword: 'Password123' },
  });
  assert.equal(paRes.status, 201);
  const testPaId = paRes.body.data.pa.id;
  const paLoginRes = await call('POST', '/auth/pa/login', {
    body: { username: 'rahul.pa', password: 'Password123' },
  });
  const currentPaToken = paLoginRes.body.data.token;

  const enqRes = await call('POST', '/enquiries', {
    body: { name: 'Kiran Kumar', phone: '9847123456', secondaryPhone: '9847654321', course: 'B.Com' },
  });
  assert.equal(enqRes.status, 201);
  const enqId = enqRes.body.data.enquiry._id;
  assert.equal(enqRes.body.data.enquiry.status, 'NOT_CONTACTED');

  let paStats = await call('GET', '/pa/dashboard/stats', { token: currentPaToken });
  assert.equal(paStats.status, 200);
  assert.ok(paStats.body.data.totals.total >= 1);
  assert.equal(paStats.body.data.mine.contacted, 0);

  let badStatus = await call('PATCH', '/pa/enquiries/' + enqId + '/status', { token: currentPaToken, body: { status: 'INVALID' } });
  assert.equal(badStatus.status, 400);

  let adminBlocked = await call('PATCH', '/pa/enquiries/' + enqId + '/status', { token: adminToken, body: { status: 'CONTACTED' } });
  assert.equal(adminBlocked.status, 403);

  let markRes = await call('PATCH', '/pa/enquiries/' + enqId + '/status', { token: currentPaToken, body: { status: 'CONTACTED' } });
  assert.equal(markRes.status, 200);
  assert.equal(markRes.body.data.enquiry.status, 'CONTACTED');
  assert.equal(markRes.body.data.enquiry.contactedBy.name, 'Rahul PA');
  assert.ok(markRes.body.data.enquiry.contactedAt);

  let conflictRes = await call('PATCH', '/pa/enquiries/' + enqId + '/status', { token: currentPaToken, body: { status: 'CONTACTED' } });
  assert.equal(conflictRes.status, 409);

  let detailRes = await call('GET', '/pa/enquiries/' + enqId, { token: currentPaToken });
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.body.data.enquiry.status, 'CONTACTED');
  assert.equal(detailRes.body.data.history.length, 1);
  assert.equal(detailRes.body.data.history[0].newStatus, 'CONTACTED');
  assert.equal(detailRes.body.data.history[0].previousStatus, 'NOT_CONTACTED');
  assert.equal(detailRes.body.data.history[0].paName, 'Rahul PA');

  let adminDetail = await call('GET', '/admin/enquiries/' + enqId, { token: adminToken });
  assert.equal(adminDetail.status, 200);
  assert.equal(adminDetail.body.data.history.length, 1);

  let revertRes = await call('PATCH', '/pa/enquiries/' + enqId + '/status', { token: currentPaToken, body: { status: 'NOT_CONTACTED' } });
  assert.equal(revertRes.status, 200);
  assert.equal(revertRes.body.data.enquiry.status, 'NOT_CONTACTED');
  assert.equal(revertRes.body.data.enquiry.contactedBy, null);
  assert.equal(revertRes.body.data.enquiry.contactedAt, null);

  detailRes = await call('GET', '/pa/enquiries/' + enqId, { token: currentPaToken });
  assert.equal(detailRes.body.data.history.length, 2);
  assert.equal(detailRes.body.data.history[0].newStatus, 'NOT_CONTACTED');
  assert.equal(detailRes.body.data.history[0].previousStatus, 'CONTACTED');

  markRes = await call('PATCH', '/pa/enquiries/' + enqId + '/status', { token: currentPaToken, body: { status: 'CONTACTED' } });
  assert.equal(markRes.status, 200);
  detailRes = await call('GET', '/pa/enquiries/' + enqId, { token: currentPaToken });
  assert.equal(detailRes.body.data.history.length, 3);

  let perfRes = await call('GET', '/admin/dashboard/pa-performance', { token: adminToken });
  assert.equal(perfRes.status, 200);
  let rahulPerf = perfRes.body.data.performance.find((p) => p.username === 'rahul.pa');
  assert.ok(rahulPerf);
  assert.equal(rahulPerf.totalContacted, 1);
  assert.equal(rahulPerf.contactedToday, 1);

  await call('DELETE', '/admin/pa/' + testPaId, { token: adminToken });
  detailRes = await call('GET', '/admin/enquiries/' + enqId, { token: adminToken });
  assert.equal(detailRes.body.data.history[0].paName, 'Rahul PA');
  assert.equal(detailRes.body.data.history[0].paDeleted, true);
  assert.equal(detailRes.body.data.enquiry.contactedBy.name, 'Rahul PA');
  assert.equal(detailRes.body.data.enquiry.contactedBy.deleted, true);
});