const WhatsappConfig = require("../model/whatsappConfig");

exports.updateWhatsappConfig = async (req, res) => {
  try {
    const { number, builderId, accessToken, apiVersion, phoneNumberId } = req.body;
    
    if (!number || !builderId) {
      return res.status(400).json({ status: "Fail", message: "Number and BuilderId are required" });
    }

    const updatedConfig = await WhatsappConfig.findOneAndUpdate(
      { number },
      { 
        $set: { 
          builderId,
          accessToken, 
          apiVersion, 
          phoneNumberId 
        } 
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "Success",
      message: "WhatsApp Configuration updated successfully",
      data: updatedConfig
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.getWhatsappConfigByNumber = async (req, res) => {
  try {
    const { number } = req.params;
    const config = await WhatsappConfig.findOne({ number, isDeleted: false });
    
    return res.status(200).json({
      status: "Success",
      data: config
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};
