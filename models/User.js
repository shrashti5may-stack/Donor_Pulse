const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const USER_ROLES = ['DONOR', 'PATIENT'];

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

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'User phone number is required'],
    trim: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
    required: [true, 'Phone verification status is required']
  },
  bloodGroup: {
    type: String,
    enum: {
      values: BLOOD_GROUPS,
      message: '{VALUE} is not a valid blood group. Allowed: ' + BLOOD_GROUPS.join(', ')
    },
    required: [true, 'Blood group is required']
  },
  role: {
    type: String,
    enum: {
      values: USER_ROLES,
      message: '{VALUE} is not a valid role. Allowed: DONOR, PATIENT'
    },
    required: [true, 'User role is required']
  },
  coordinates: {
    type: PointSchema,
    required: [true, 'GeoJSON location coordinates [longitude, latitude] are required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastDonationDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 2dsphere index for geospatial proximity queries within radius (e.g. $maxDistance: 25000)
UserSchema.index({ coordinates: '2dsphere' });
UserSchema.index({ role: 1, isAvailable: 1, bloodGroup: 1 });

module.exports = mongoose.model('User', UserSchema);
