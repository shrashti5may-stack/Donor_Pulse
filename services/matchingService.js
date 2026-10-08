/**
 * Medical Compatibility Matrix & Proximity Matching Service
 * Enforces strict haemovigilance matching, 25km radius limit, and 90-day recovery cutoff.
 */

// Exact Medical Compatibility Matrix (Who recipient can receive from)
const COMPATIBILITY_MATRIX = {
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-']
};

/**
 * Returns array of compatible donor blood groups for a given recipient need.
 * @param {string} bloodGroupNeeded - Recipient's blood group
 * @returns {string[]} Compatible donor blood groups
 */
function getCompatibleBloodGroups(bloodGroupNeeded) {
  if (!bloodGroupNeeded) return [];
  const clean = bloodGroupNeeded.trim();
  return COMPATIBILITY_MATRIX[clean] || [];
}

/**
 * Calculates Haversine distance between two sets of coordinates in kilometers.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers (rounded to 1 decimal place)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Queries MongoDB for registered, active, available donors who:
 * 1. Are medically compatible with the needed blood group
 * 2. Are within 25 km of the hospital coordinates (via 2dsphere index)
 * 3. Have NOT donated in the last 90 days (lastDonationDate is null or <= 90 days ago)
 *
 * @param {object} User - Mongoose User Model
 * @param {string} bloodGroupNeeded - Recipient's blood group needed
 * @param {[number, number]} coordinates - Hospital coordinates [longitude, latitude]
 * @param {number} maxRadiusMeters - Maximum radius (default 25000 = 25 km)
 * @returns {Promise<Array>} Matched donors with calculated distance
 */
async function findMatchedDonorsMongo(User, bloodGroupNeeded, coordinates, maxRadiusMeters = 25000) {
  const compatibleGroups = getCompatibleBloodGroups(bloodGroupNeeded);
  if (!compatibleGroups || compatibleGroups.length === 0) {
    return [];
  }

  const [reqLng, reqLat] = coordinates;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Query MongoDB with 2dsphere geospatial $near, compatibility, and availability
  const query = {
    role: 'DONOR',
    isAvailable: true,
    bloodGroup: { $in: compatibleGroups },
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [reqLng, reqLat]
        },
        $maxDistance: maxRadiusMeters
      }
    },
    $or: [
      { lastDonationDate: null },
      { lastDonationDate: { $lte: ninetyDaysAgo } }
    ]
  };

  const donors = await User.find(query).lean();

  return donors.map(donor => {
    const [donorLng, donorLat] = (donor.coordinates && donor.coordinates.coordinates) || [0, 0];
    const distanceKm = calculateDistanceKm(reqLat, reqLng, donorLat, donorLng);
    return {
      ...donor,
      distanceKm
    };
  });
}

module.exports = {
  COMPATIBILITY_MATRIX,
  getCompatibleBloodGroups,
  calculateDistanceKm,
  findMatchedDonorsMongo
};
