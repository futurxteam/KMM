import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['ADMIN'], default: 'ADMIN', immutable: true },
    isActive: { type: Boolean, default: true },
    // Bootstrap guard: only the initial admin carries `true`. The partial unique index below
    // makes the database itself reject a second initial admin, even under concurrent requests.
    isInitialAdmin: { type: Boolean, default: undefined, immutable: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

adminSchema.index({ isInitialAdmin: 1 }, { unique: true, partialFilterExpression: { isInitialAdmin: true } });

adminSchema.pre('save', async function hash() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = function compare(plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('Admin', adminSchema);

