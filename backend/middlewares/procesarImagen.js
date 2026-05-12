const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Configura tus credenciales de Cloudinary
cloudinary.config({
    cloud_name: 'dx53hzqwa',
    api_key: '414177513223333',
    api_secret: '10ob4DjzfwHQSFDfK-mKjrw5oxs'
});

// 2. Configuramos dónde y cómo se guardará la imagen
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'supernova_playeras', // Así se llamará la carpeta en tu nube
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] // Formatos permitidos
    }
});

// 3. Creamos el middleware que atrapará el archivo
const upload = multer({ storage: storage });

module.exports = upload;