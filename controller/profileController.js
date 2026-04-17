const axios = require('axios');
const Profile = require('../model/profile');
const { v7: uuidv7 } = require('uuid');
const { getAgeGroup } = require('../utils/profileUtils');

exports.createProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (name === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name"
      });
    }

    if (typeof name !== "string") {
      return res.status(422).json({
        status: "error",
        message: "Invalid type"
      });
    }

    if (!name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name"
      });
    }

    const cleanName = name.toLowerCase();

    const existing = await Profile.findOne({ name: cleanName });

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing
      });
    }

    const [genderRes, ageRes, nationRes] = await Promise.all([
      axios.get(`https://api.genderize.io?name=${cleanName}`),
      axios.get(`https://api.agify.io?name=${cleanName}`),
      axios.get(`https://api.nationalize.io?name=${cleanName}`)
    ]);

    const gender = genderRes.data;
    const age = ageRes.data;
    const nation = nationRes.data;

    if (!gender.gender || gender.count === 0) {
      return res.status(502).json({
        status: "error",
        message: "Genderize returned an invalid response"
      });
    }

    if (age.age === null) {
      return res.status(502).json({
        status: "error",
        message: "Agify returned an invalid response"
      });
    }

    if (!nation.country.length) {
      return res.status(502).json({
        status: "error",
        message: "Nationalize returned an invalid response"
      });
    }

    const bestCountry = nation.country.sort(
      (a,b)=> b.probability - a.probability
    )[0];

    const newProfile = await Profile.create({
      id: uuidv7(),
      name: cleanName,
      gender: gender.gender,
      gender_probability: gender.probability,
      sample_size: gender.count,
      age: age.age,
      age_group: getAgeGroup(age.age),
      country_id: bestCountry.country_id,
      country_probability: bestCountry.probability,
      created_at: new Date().toISOString()
    });

    res.status(201).json({
      status: "success",
      data: newProfile
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server failure"
    });
  }
};

exports.getProfile = async (req,res)=>{
  const profile = await Profile.findOne({ id:req.params.id });

  if(!profile){
    return res.status(404).json({
      status:"error",
      message:"Profile not found"
    });
  }

  res.json({
    status:"success",
    data:profile
  });
};

exports.getAllProfiles = async (req,res)=>{
  let filter = {};

  if(req.query.gender)
    filter.gender = new RegExp(`^${req.query.gender}$`, 'i');

  if(req.query.country_id)
    filter.country_id = new RegExp(`^${req.query.country_id}$`, 'i');

  if(req.query.age_group)
    filter.age_group = new RegExp(`^${req.query.age_group}$`, 'i');

  const profiles = await Profile.find(filter).select(
    "id name gender age age_group country_id -_id"
  );

  res.json({
    status:"success",
    count: profiles.length,
    data: profiles
  });
};

exports.deleteProfile = async (req,res)=>{
  const deleted = await Profile.findOneAndDelete({ id:req.params.id });

  if(!deleted){
    return res.status(404).json({
      status:"error",
      message:"Profile not found"
    });
  }

  res.status(204).send({
    status : "deleted",
    message : "profile deleted"
  });
};