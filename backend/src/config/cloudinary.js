const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// If using CLOUDINARY_URL env variable, it will auto-configure
if (process.env.CLOUDINARY_URL) {
  // Cloudinary will auto-configure from URL
  console.log('✅ Cloudinary configured from CLOUDINARY_URL');
}

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} file - File buffer or file path
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result
 */
const uploadImage = async (file, options = {}) => {
  try {
    // Convert buffer to base64 data URI if it's a buffer
    let uploadFile = file;
    if (Buffer.isBuffer(file)) {
      const base64String = file.toString('base64');
      uploadFile = `data:image/jpeg;base64,${base64String}`;
    }

    const result = await cloudinary.uploader.upload(uploadFile, {
      folder: options.folder || 'smart-pest-doctor',
      resource_type: 'auto',
      transformation: options.transformation || [
        { width: 1024, height: 1024, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      ...options
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<object>} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Generate signed URL for private images
 * @param {string} publicId - Public ID of the image
 * @param {object} options - Transformation options
 * @returns {string} Signed URL
 */
const getSignedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    ...options
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getSignedUrl
};
