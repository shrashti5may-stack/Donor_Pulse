const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const REQUEST_STATUSES = ['PENDING', 'ACCEPTED', 'FULFILLED', 'EXPIRED'];

const PointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function(val) {
        return Array.isArray(val) && val.length === 2 &&
          val[0] >= -180 && val[0] <= 180 && // lng
          val[1] >= -90 && val[1] <= 90;     // lat
      },
      message: 'Coordinates must be valid [longitude, latitude] values.'
    }
  }
}, { _id: false });

const DonationRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required']
  },
  bloodGroupNeeded: {
    type: String,
    enum: {
      values: BLOOD_GROUPS,
      message: '{VALUE} is not a valid blood group. Allowed: ' + BLOOD_GROUPS.join(', ')
    },
    required: [true, 'Blood group needed is required']
  },
  unitsNeeded: {
    type: Number,
    required: [true, 'Units needed is required'],
    min: [1, 'At least 1 unit must be requested']
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  hospitalAddress: {
    type: String,
    required: [true, 'Hospital address is required'],
    trim: true
  },
  coordinates: {
    type: PointSchema,
    required: [true, 'Hospital GeoJSON coordinates [longitude, latitude] are required']
  },
  prescriptionDocumentUrl: {
    type: String,
    trim: true
  },
  doctorRegNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: REQUEST_STATUSES,
      message: '{VALUE} is not a valid status. Allowed: PENDING, ACCEPTED, FULFILLED, EXPIRED'
    },
    default: 'PENDING',
    required: true
  },
  acceptedDonorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  matchedDonorsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Custom validation ensuring authenticity verification input:
// Requires at least one of prescriptionDocumentUrl or doctorRegNumber
DonationRequestSchema.pre('validate', function(next) {
  const hasPrescription = this.prescriptionDocumentUrl && this.prescriptionDocumentUrl.trim().length > 0;
  const hasDoctorReg = this.doctorRegNumber && this.doctorRegNumber.trim().length > 0;
  if (!hasPrescription && !hasDoctorReg) {
    this.invalidate('doctorRegNumber', 'Medical proof required: Provide either doctorRegNumber or prescriptionDocumentUrl for authenticity verification.');
  }
  next();
});

// 2dsphere index for proximity queries
DonationRequestSchema.index({ coordinates: '2dsphere' });
DonationRequestSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('DonationRequest', DonationRequestSchema);
