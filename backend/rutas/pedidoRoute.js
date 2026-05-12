const express = require('express');
const router = express.Router();
const { crearPedido, obtenerPedidosUsuario, obtenerTodosPedidos, actualizarEstadoPedido } = require('../controllers/pedidoController');

router.post('/crear', crearPedido);
router.get('/admin/todos', obtenerTodosPedidos);
router.put('/admin/estado/:id', actualizarEstadoPedido);
router.get('/:usuarioId', obtenerPedidosUsuario);

module.exports = router;