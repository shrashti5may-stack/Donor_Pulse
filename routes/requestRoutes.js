const express = require('express');
const {
  createDonationRequest,
  acceptDonationRequest,
  getDonationRequest
} = require('../controllers/requestController');

function createRequestRouter(io) {
  const router = express.Router();

  // POST /api/requests - Create and broadcast authentic request
  router.post('/', (req, res) => createDonationRequest(req, res, io));

  // GET /api/requests/:id - Fetch request details
  router.get('/:id', (req, res) => getDonationRequest(req, res));

  // POST /api/requests/:id/accept - Donor accepts request (locks request)
  router.post('/:id/accept', (req, res) => acceptDonationRequest(req, res, io));

  return router;
}

module.exports = createRequestRouter;
