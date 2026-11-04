import mongoose from 'mongoose';
import { ENQUIRY_STATUS } from './Enquiry.js';

// Append-only audit log of contact status changes. Name/PA data are snapshots so the
// history survives deletion of the PA account or the enquiry's later edits.
const contactActivitySchema = new mongoose.Schema(
  {
    enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true },
    enquiryName: { type: String, default: '' },
    course: { type: String, default: '' },
    paId: { type: mongoose.Schema.Types.ObjectId, required: true }, // intentionally not a live ref
    paName: { type: String, required: true },
    previousStatus: { type: String, enum: Object.values(ENQUIRY_STATUS), required: true },
    newStatus: { type: String, enum: Object.values(ENQUIRY_STATUS), required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

contactActivitySchema.index({ enquiryId: 1, createdAt: -1 });
contactActivitySchema.index({ paId: 1, createdAt: -1 });
contactActivitySchema.index({ createdAt: -1 });

export default mongoose.model('ContactActivity', contactActivitySchema);

