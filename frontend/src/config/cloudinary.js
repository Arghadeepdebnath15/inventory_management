export const cloudinaryConfig = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dbhl52bav',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'rcwfhnbx',
  uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dbhl52bav'}/image/upload`
}; 