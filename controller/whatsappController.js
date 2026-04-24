const {
  createWhatsappService,
  fetchBuilderWhatsappService,
  updateWhatsappService,
  deleteWhatsappService,
  getAllWhatsappForAdminService,
  updateWhatsappStatusService
} = require("../service/whatsapp");

exports.addWhatsapp = async (req, res) => {
  try {
    const builderUserId = req.user.id;
    const whatsapp = await createWhatsappService(builderUserId, req.body);
    res.status(201).json({ success: true, status: "Success", data: whatsapp });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};

exports.getWhatsappList = async (req, res) => {
  try {
    const builderUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    const { totalRecords, whatsappData } = await fetchBuilderWhatsappService(builderUserId, {
      page,
      limit,
      search
    });

    res.status(200).json({
      success: true,
      status: "Success",
      pagination: { 
        totalRecords, 
        currentPage: page, 
        totalPages: Math.ceil(totalRecords / limit), 
        limit 
      },
      data: whatsappData,
    });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};

exports.updateWhatsapp = async (req, res) => {
  try {
    const builderUserId = req.user.id;
    const { id } = req.params;
    const updated = await updateWhatsappService(id, builderUserId, req.body);
    res.status(200).json({ success: true, status: "Success", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};

exports.deleteWhatsapp = async (req, res) => {
  try {
    const builderUserId = req.user.id;
    const { id } = req.params;
    await deleteWhatsappService(id, builderUserId);
    res.status(200).json({ success: true, status: "Success", message: "WhatsApp record deleted" });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};

exports.getAdminWhatsappList = async (req, res) => {
  try {
    const whatsappData = await getAllWhatsappForAdminService();
    res.status(200).json({ success: true, status: "Success", data: whatsappData });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};

exports.updateWhatsappStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateWhatsappStatusService(id, req.body);
    res.status(200).json({ success: true, status: "Success", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};
