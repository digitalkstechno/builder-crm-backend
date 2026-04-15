const CityArea = require("../model/cityArea");
const Builder = require("../model/builder");

const getBuilder = async (userId) => {
  const builder = await Builder.findOne({ userId });
  if (!builder) throw new Error("Builder not found");
  return builder;
};

// Get all cities for a builder
exports.getCitiesService = async (userId) => {
  const builder = await getBuilder(userId);
  const docs = await CityArea.find({ builderId: builder._id }).select("city").sort({ city: 1 });
  return docs.map((d) => d.city);
};

// Get areas for a specific city
exports.getAreasByCityService = async (userId, city) => {
  const builder = await getBuilder(userId);
  const doc = await CityArea.findOne({ builderId: builder._id, city });
  return doc ? doc.areas : [];
};

// Add city (if not exists) and optionally add area
exports.addCityAreaService = async (userId, { city, area }) => {
  const builder = await getBuilder(userId);

  let doc = await CityArea.findOne({ builderId: builder._id, city });

  if (!doc) {
    doc = await CityArea.create({
      builderId: builder._id,
      city,
      areas: area ? [area] : [],
    });
  } else if (area && !doc.areas.includes(area)) {
    doc.areas.push(area);
    await doc.save();
  }

  return doc;
};
