// Safe, non-destructive migration: seeds the Course collection from the old placeholder list
// ONLY when the collection is empty, and backfills Enquiry.courseId / contactedByName snapshots.
// Existing enquiries keep their original course names. Idempotent. Run: npm run migrate
import mongoose from 'mongoose';
import { assertEnv } from '../config/env.js';
import { connectDB } from '../config/db.js';
import Course from '../models/Course.js';
import Enquiry from '../models/Enquiry.js';
import PA from '../models/PA.js';
import Admin from '../models/Admin.js';
import DEFAULT_COURSES from './seedData/defaultCourses.js';

try {
  assertEnv();
  await connectDB();
  await Promise.all([Course.init(), Admin.init(), Enquiry.init(), PA.init()]);

  if ((await Course.countDocuments({})) === 0) {
    for (const name of DEFAULT_COURSES) await Course.create({ name });
    console.log(`Seeded ${DEFAULT_COURSES.length} courses`);
  } else {
    console.log('Courses already exist - seed skipped');
  }

  // Enquiries referencing course names that exist only historically stay untouched; link where possible.
  const courses = await Course.find({}).select('+nameKey').lean();
  let linked = 0;
  for (const c of courses) {
    const r = await Enquiry.updateMany(
      { courseId: null, course: new RegExp(`^${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { $set: { courseId: c._id } }
    );
    linked += r.modifiedCount;
  }
  console.log(`Linked ${linked} enquiries to courses (course name snapshots unchanged)`);

  let named = 0;
  for (const pa of await PA.find({}).select('name')) {
    const r = await Enquiry.updateMany(
      { contactedBy: pa._id, $or: [{ contactedByName: '' }, { contactedByName: { $exists: false } }] },
      { $set: { contactedByName: pa.name } }
    );
    named += r.modifiedCount;
  }
  console.log(`Backfilled contactedByName on ${named} enquiries`);
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

