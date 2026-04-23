const WhatsappConfig = require("../model/whatsappConfig");

exports.updateWhatsappConfig = async (req, res) => {
  try {
    let { number, builderId, accessToken, apiVersion, phoneNumberId } = req.body;
    
    if (!number || !builderId) {
      return res.status(400).json({ status: "Fail", message: "Number and BuilderId are required" });
    }

    // Extract digits from the input (handles "Name (91XXXXXXXXXX)" or just digits)
    let digits = number.replace(/\D/g, "");
    // If 10 digits, prepend 91. If already 12+ digits (like with 91), use as is.
    number = digits.length === 10 ? "91" + digits : digits;

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
    let { number } = req.params;

    // Extract digits from the input (handles "Name (91XXXXXXXXXX)" or just digits)
    let digits = number.replace(/\D/g, "");
    // If 10 digits, prepend 91. If already 12+ digits (like with 91), use as is.
    number = digits.length === 10 ? "91" + digits : digits;

    const config = await WhatsappConfig.findOne({ number, isDeleted: false });
    
    return res.status(200).json({
      status: "Success",
      data: config
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};
