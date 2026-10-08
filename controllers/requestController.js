const User = require('../models/User');
const DonationRequest = require('../models/DonationRequest');
const { findMatchedDonorsMongo, calculateDistanceKm } = require('../services/matchingService');

/**
 * Handle new authentic donation request submission (POST /api/requests)
 */
async function createDonationRequest(req, res, io) {
  try {
    const {
      patientId,
      bloodGroupNeeded,
      unitsNeeded,
      hospitalName,
      hospitalAddress,
      coordinates, // [lng, lat] or { type: "Point", coordinates: [lng, lat] }
      prescriptionDocumentUrl,
      doctorRegNumber
    } = req.body;

    // 1. Authenticity: Validate that the patient exists and has verified profile & contact
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: patientId is required.'
      });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found in registered database.'
      });
    }

    if (patient.role !== 'PATIENT' && patient.role !== 'DONOR') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only registered patients may raise emergency donation requests.'
      });
    }

    if (!patient.isPhoneVerified) {
      return res.status(403).json({
        success: false,
        error: 'Verification Required: Patient phone number must be verified via OTP (isPhoneVerified: true) before raising emergency requests.'
      });
    }

    // 2. Authenticity: Require medical proof input
    if (!hospitalName || !hospitalName.trim() || !hospitalAddress || !hospitalAddress.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Medical proof required: Hospital Name and Hospital Address are mandatory.'
      });
    }

    const hasPrescription = prescriptionDocumentUrl && typeof prescriptionDocumentUrl === 'string' && prescriptionDocumentUrl.trim().length > 0;
    const hasDoctorReg = doctorRegNumber && typeof doctorRegNumber === 'string' && doctorRegNumber.trim().length > 0;

    if (!hasPrescription && !hasDoctorReg) {
      return res.status(400).json({
        success: false,
        error: 'Medical authenticity proof required: Mandatory Doctor Registration Number (doctorRegNumber) or Prescription Document URL (prescriptionDocumentUrl) must be provided.'
      });
    }

    // 3. Rate-Limit Active Requests Per Patient:
    // Prevent spamming multiple unfulfilled urgent requests while one is PENDING
    const existingActiveRequest = await DonationRequest.findOne({
      patientId,
      status: 'PENDING'
    });

    if (existingActiveRequest) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded: You already have an active unfulfilled emergency request pending. Please wait for fulfillment or resolution before raising another request.',
        activeRequestId: existingActiveRequest._id
      });
    }

    // Parse coordinates format [lng, lat]
    let formattedCoordinates = coordinates;
    if (Array.isArray(coordinates)) {
      formattedCoordinates = { type: 'Point', coordinates };
    } else if (coordinates && coordinates.coordinates) {
      formattedCoordinates = { type: 'Point', coordinates: coordinates.coordinates };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates: Location coordinates [longitude, latitude] are required.'
      });
    }

    // 4. Save to DB with status PENDING
    const newRequest = new DonationRequest({
      patientId,
      bloodGroupNeeded,
      unitsNeeded: parseInt(unitsNeeded, 10) || 1,
      hospitalName: hospitalName.trim(),
      hospitalAddress: hospitalAddress.trim(),
      coordinates: formattedCoordinates,
      prescriptionDocumentUrl: hasPrescription ? prescriptionDocumentUrl.trim() : undefined,
      doctorRegNumber: hasDoctorReg ? doctorRegNumber.trim() : undefined,
      status: 'PENDING'
    });

    // 5. Query DB for registered, active, available donors within 25km, excluding last 90-day donors
    const matchedDonors = await findMatchedDonorsMongo(
      User,
      bloodGroupNeeded,
      formattedCoordinates.coordinates,
      25000 // 25 km max distance
    );

    newRequest.matchedDonorsCount = matchedDonors.length;
    await newRequest.save();

    // 6. Selective Real-Time Event Routing (Socket.io)
    // NOTE: DO NOT broadcast globally to the 'donors' room.
    // Emit new_matched_request ONLY to each matched donor's private room: `user_${matchedDonorId}`
    if (io) {
      const [reqLng, reqLat] = formattedCoordinates.coordinates;
      for (const donor of matchedDonors) {
        const donorId = donor._id ? donor._id.toString() : donor.id;
        const [donorLng, donorLat] = (donor.coordinates && donor.coordinates.coordinates) || [0, 0];
        const distanceKm = donor.distanceKm || calculateDistanceKm(reqLat, reqLng, donorLat, donorLng);

        const requestPayload = {
          requestId: newRequest._id,
          patientId: newRequest.patientId,
          bloodGroupNeeded: newRequest.bloodGroupNeeded,
          unitsNeeded: newRequest.unitsNeeded,
          hospitalName: newRequest.hospitalName,
          hospitalAddress: newRequest.hospitalAddress,
          distanceKm,
          doctorRegNumber: newRequest.doctorRegNumber,
          prescriptionDocumentUrl: newRequest.prescriptionDocumentUrl,
          createdAt: newRequest.createdAt,
          status: newRequest.status
        };

        io.to(`user_${donorId}`).emit('new_matched_request', requestPayload);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Emergency requisition created. Alerted ${matchedDonors.length} verified compatible donors within 25 km.`,
      request: newRequest,
      matchedDonorsCount: matchedDonors.length
    });
  } catch (err) {
    console.error('Error in createDonationRequest:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error: ' + err.message
    });
  }
}

/**
 * Handle donor accepting a request (POST /api/requests/:id/accept)
 * Locks the request and notifies the patient via `request_accepted`
 */
async function acceptDonationRequest(req, res, io) {
  try {
    const { id } = req.params;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({
        success: false,
        error: 'donorId is required to accept this request.'
      });
    }

    const donor = await User.findById(donorId);
    if (!donor || donor.role !== 'DONOR') {
      return res.status(404).json({
        success: false,
        error: 'Registered donor profile not found.'
      });
    }

    const request = await DonationRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Donation request not found.'
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        error: `Request is already locked. Current status: ${request.status}.`
      });
    }

    // Lock request to first accepting donor
    request.status = 'ACCEPTED';
    request.acceptedDonorId = donor._id;
    await request.save();

    const acceptPayload = {
      requestId: request._id,
      patientId: request.patientId,
      donor: {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        phone: donor.phone
      },
      hospitalName: request.hospitalName,
      status: 'ACCEPTED',
      acceptedAt: new Date()
    };

    // Emit request_accepted to the specific patient's private room
    if (io) {
      io.to(`user_${request.patientId}`).emit('request_accepted', acceptPayload);
    }

    return res.status(200).json({
      success: true,
      message: 'Request successfully accepted and locked.',
      request,
      donor: {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup
      }
    });
  } catch (err) {
    console.error('Error in acceptDonationRequest:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error: ' + err.message
    });
  }
}

/**
 * Retrieve a request by ID (GET /api/requests/:id)
 */
async function getDonationRequest(req, res) {
  try {
    const { id } = req.params;
    const request = await DonationRequest.findById(id)
      .populate('patientId', 'name phone isPhoneVerified bloodGroup')
      .populate('acceptedDonorId', 'name phone bloodGroup');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Donation request not found.'
      });
    }

    return res.status(200).json({
      success: true,
      request
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

module.exports = {
  createDonationRequest,
  acceptDonationRequest,
  getDonationRequest
};
