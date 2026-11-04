import mongoose from 'mongoose';

export const normalizeCourseName = (name) => String(name ?? '').trim().replace(/\s+/g, ' ');
export const courseKey = (name) => normalizeCourseName(name).toLowerCase();

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Course name is required'], trim: true, maxlength: 120 },
    // Normalised (case/whitespace-insensitive) key used for uniqueness.
    nameKey: { type: String, unique: true, index: true, select: false },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.pre('validate', function setKey() {
  this.name = normalizeCourseName(this.name);
  this.nameKey = courseKey(this.name);
});

export default mongoose.model('Course', courseSchema);

