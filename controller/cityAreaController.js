const { getCitiesService, getAreasByCityService, addCityAreaService } = require("../service/cityArea");

exports.getCities = async (req, res) => {
  try {
    const data = await getCitiesService(req.user.id);
    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.getAreasByCity = async (req, res) => {
  try {
    const data = await getAreasByCityService(req.user.id, req.params.city);
    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.addCityArea = async (req, res) => {
  try {
    const data = await addCityAreaService(req.user.id, req.body);
    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
