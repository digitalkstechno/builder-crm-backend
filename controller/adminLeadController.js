const AdminLead = require('../model/adminLead');

exports.createAdminLead = async (req, res) => {
  try {
    const { name, phone, companyName } = req.body;
    if (!name || !phone || !companyName) {
      return res.status(400).json({ success: false, message: 'Name, phone and company name are required' });
    }
    const lead = await AdminLead.create({ name, phone, companyName });
    return res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: lead });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAdminLeads = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { isDeleted: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') query.status = status;

    const [total, leads] = await Promise.all([
      AdminLead.countDocuments(query),
      AdminLead.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    ]);

    return res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdminLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const lead = await AdminLead.findByIdAndUpdate(id, { status, notes }, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdminLead = async (req, res) => {
  try {
    const { id } = req.params;
    await AdminLead.findByIdAndUpdate(id, { isDeleted: true });
    return res.status(200).json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
