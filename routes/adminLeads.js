const express = require('express');
const router = express.Router();
const { createAdminLead, getAllAdminLeads, updateAdminLeadStatus, deleteAdminLead } = require('../controller/adminLeadController');
const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Public — landing page form submission
router.post('/', createAdminLead);

// Admin only
router.get('/', verifyAdmin, getAllAdminLeads);
router.put('/:id', verifyAdmin, updateAdminLeadStatus);
router.delete('/:id', verifyAdmin, deleteAdminLead);

module.exports = router;
