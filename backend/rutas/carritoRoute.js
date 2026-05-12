const express = require('express');
const router = express.Router();
const { 
    agregarProductoAlCarrito, 
    obtenerCarritoUsuario, 
    eliminarItemCarrito,
    actualizarCantidadItem
} = require('../controllers/carritoController');

// Ruta para agregar un producto (POST)
router.post('/agregar', agregarProductoAlCarrito);

// Ruta para obtener el carrito de un usuario (GET)
// Esta es la que tu Script.js llama con fetch(`http://localhost:3000/api/carrito/${usuario.id}`)
router.get('/:usuarioId', obtenerCarritoUsuario);

// Ruta para eliminar un item del carrito (DELETE)
// Esta es la que tu Script.js llama con fetch(`.../eliminar/${itemId}`)
router.delete('/eliminar/:itemId', eliminarItemCarrito);

router.put('/actualizar/:itemId', actualizarCantidadItem);

module.exports = router;