const express = require('express');
const {
  createDonationRequest,
  acceptDonationRequest,
  getDonationRequest,
  cancelDonationRequest,
  declineDonationRequest
} = require('../controllers/requestController');

function createRequestRouter(io) {
  const router = express.Router();

  // POST /api/requests - Create and broadcast authentic request
  router.post('/', (req, res) => createDonationRequest(req, res, io));

  // GET /api/requests/:id - Fetch request details
  router.get('/:id', (req, res) => getDonationRequest(req, res));

  // POST /api/requests/:id/accept - Donor accepts request (locks request)
  router.post('/:id/accept', (req, res) => acceptDonationRequest(req, res, io));

  // POST /api/requests/:id/cancel or DELETE /api/requests/:id - Cancel request
  router.post('/:id/cancel', (req, res) => cancelDonationRequest(req, res, io));
  router.delete('/:id', (req, res) => cancelDonationRequest(req, res, io));

  // POST /api/requests/:id/decline - Donor declines request
  router.post('/:id/decline', (req, res) => declineDonationRequest(req, res, io));

  return router;
}

module.exports = createRequestRouter;
