const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dxod1bojz', // Thay bằng Cloud Name của bạn
  api_key: '331986172858248',       // Thay bằng API Key của bạn
  api_secret: 'D9LtHepuqnW63VmJ2eeMbiFFPJA'  // Thay bằng API Secret của bạn
});

module.exports = cloudinary;