const express = require('express');
const router = express.Router();

const { validarRol } = require('../middlewares/validacionRol');
const upload = require('../middlewares/procesarImagen'); 

const {
    registrarPlayera,
    obtenerPlayera,
    obtenerPlayeraCategoria,
    eliminarPlayera,
    editarPlayera
} = require('../controllers/playeraController');

// 2. Inyectamos upload.single('imagen') justo antes de validarRol
// 'imagen' es el nombre exacto que le pusimos en el Frontend: formData.append('imagen', archivo)
router.post('/registro-playera', upload.single('imagen'), validarRol, registrarPlayera);
router.put('/editar-playera/:id',upload.single('imagen'), validarRol, editarPlayera);
router.get('/obtener-playeras', obtenerPlayera);
router.get('/obtener-playeras/:categoria', obtenerPlayeraCategoria);
router.delete('/eliminar-playera/:id', eliminarPlayera);

module.exports = router;