import mongoose from 'mongoose';

export const ENQUIRY_STATUS = Object.freeze({
  NOT_CONTACTED: 'NOT_CONTACTED',
  CONTACTED: 'CONTACTED',
});

const phoneField = (label) => ({
  type: String,
  required: [true, `${label} is required`],
  trim: true,
  match: [/^[6-9]\d{9}$/, `${label} must be a valid 10-digit Indian mobile number`],
});

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    phone: phoneField('Phone number'),
    secondaryPhone: phoneField('Secondary phone number'),
    // Course NAME SNAPSHOT: stored at submission time and never updated, so renaming,
    // deactivating or deleting a Course does not alter historical enquiries.
    course: { type: String, required: [true, 'Course is required'], trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    email: { type: String, trim: true, lowercase: true, default: '' },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: Object.values(ENQUIRY_STATUS),
      default: ENQUIRY_STATUS.NOT_CONTACTED,
      index: true,
    },
    contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PA', default: null },
    // Audit snapshot of the PA's name at the time of contact (survives PA deletion).
    contactedByName: { type: String, trim: true, default: '' },
    contactedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ course: 1, createdAt: -1 });
enquirySchema.index({ contactedAt: -1 });
enquirySchema.index({ contactedBy: 1, contactedAt: -1 });
enquirySchema.index({ phone: 1 });
enquirySchema.index({ secondaryPhone: 1 });

export default mongoose.model('Enquiry', enquirySchema);
