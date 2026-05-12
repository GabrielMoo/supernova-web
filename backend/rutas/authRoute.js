const express = require('express');
const router = express.Router();
const {validarEmail} = require('../middlewares/validacionCorreo');
const { registrarUsuario, loginUsuario, obtenerClientesAdmin } = require('../controllers/authController');

router.post('/registro', validarEmail, registrarUsuario);
router.post('/login', loginUsuario);
router.get('/clientes-stats', obtenerClientesAdmin);

module.exports = router;