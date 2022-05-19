const Joi = require('joi');

const id = Joi.number().integer();
const name = Joi.string().min(3).max(15);

const createBrandSchema = Joi.object({
  name: name.required(),
});

const updateBrandSchema = Joi.object({
  name: name,
});

const getBrandSchema = Joi.object({
  id: id.required(),
});

module.exports = { createBrandSchema, updateBrandSchema, getBrandSchema }