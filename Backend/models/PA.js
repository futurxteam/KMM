import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const paSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['PA'], default: 'PA', immutable: true },
    isActive: { type: Boolean, default: true },
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

paSchema.pre('save', async function hash() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

paSchema.methods.comparePassword = function compare(plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('PA', paSchema);
