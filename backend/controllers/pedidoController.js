const Carrito = require('../models/Carrito');
const ItemCarrito = require('../models/ItemCarrito');
const Pedido = require('../models/Pedido');
const ItemPedido = require('../models/ItemPedido');
const Stock = require('../models/Stock');
const Direccion = require('../models/Direccion');

const crearPedido = async (req, res) => {
    try {
        const { usuarioId, direccionId, subtotal, envio, total } = req.body;

        const dirOriginal = await Direccion.findById(direccionId);
        if (!dirOriginal) {
            return res.status(400).json({ exito: false, mensaje: 'Dirección no encontrada.' });
        }

        // 2. Crear el snapshot con los campos relevantes
        const direccionSnapshot = {
            calle: dirOriginal.calle,
            referencia: dirOriginal.referencia || '',
            codigoPostal: dirOriginal.codigoPostal,
            ciudad: dirOriginal.ciudad,
            estado: dirOriginal.estado,
            telefono: dirOriginal.telefono
        };

        // 1. Buscar el carrito activo del usuario
        const carrito = await Carrito.findOne({ usuario: usuarioId, estado: 'activo' });
        if (!carrito) {
            return res.status(400).json({ exito: false, mensaje: 'No tienes un carrito activo.' });
        }

        // 2. Obtener los ítems del carrito
        const itemsCarrito = await ItemCarrito.find({ carrito: carrito._id }).populate({
            path: 'stock',
            populate: { path: 'playera' }
        });
        if (itemsCarrito.length === 0) {
            return res.status(400).json({ exito: false, mensaje: 'El carrito está vacío.' });
        }

        // 3. Crear el pedido
        const nuevoPedido = new Pedido({
            usuario: usuarioId,
            direccionEnvio: direccionSnapshot,   // <-- snapshot embebido
            subtotal: subtotal,
            envio: envio,
            total: total,
            estado: 'Pendiente'
        });
        await nuevoPedido.save();

        // 4. Crear los ItemPedido y actualizar el stock
        for (const item of itemsCarrito) {
            // Crear el ítem del pedido con el SNAPSHOT
            await new ItemPedido({
                pedido: nuevoPedido._id,
                stockOriginalId: item.stock._id,
                cantidad: item.cantidad,
                productoSnapshot: {
                    nombre: item.stock.playera.nombre,
                    corte: item.stock.corte,
                    talla: item.stock.talla,
                    precio: item.stock.playera.precio,
                    imagen_enlace: item.stock.playera.imagen_enlace
                }
            }).save();

            // Reducir el stock disponible
            await Stock.findByIdAndUpdate(item.stock._id, {
                $inc: { cantidad: -item.cantidad }
            });
        }

        // 5. Eliminar los ítems del carrito
        await ItemCarrito.deleteMany({ carrito: carrito._id });

        // Opcional: cambiar estado del carrito a 'completado' en lugar de eliminarlo
        // await Carrito.findByIdAndUpdate(carrito._id, { estado: 'completado' });

        res.status(201).json({ exito: true, mensaje: 'Pedido creado exitosamente', pedidoId: nuevoPedido._id });

    } catch (error) {
        console.error('Error al crear el pedido:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
};

const obtenerPedidosUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const pedidos = await Pedido.find({ usuario: usuarioId })
            .sort({ createdAt: -1 }); // Más recientes primero

        // Para cada pedido, buscamos sus items y hacemos populate del stock y la playera
        const pedidosConItems = await Promise.all(pedidos.map(async (pedido) => {
            const items = await ItemPedido.find({ pedido: pedido._id })

            return {
                ...pedido.toObject(),
                items: items
            };
        }));

        res.status(200).json(pedidosConItems);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
    }
};

const obtenerTodosPedidos = async (req, res) => {

    try {

        const pedidos = await Pedido.find()
            .populate('usuario')
            .sort({ createdAt: -1 });

        const pedidosCompletos = await Promise.all(

            pedidos.map(async (pedido) => {

                const items = await ItemPedido.find({
                    pedido: pedido._id
                });

                return {
                    ...pedido.toObject(),
                    items
                };

            })

        );

        res.status(200).json(pedidosCompletos);

    } catch (error) {

        console.error("Error obteniendo pedidos:", error);

        res.status(500).json({
            mensaje: "Error obteniendo pedidos"
        });

    }
};

const actualizarEstadoPedido = async (req, res) => {

    try {

        const id = req.params.id;

        const { estado } = req.body;

        await Pedido.findByIdAndUpdate(id, {
            estado
        });

        res.status(200).json({
            mensaje: 'Estado actualizado'
        });

    } catch (error) {

        console.error("Error actualizando estado:", error);

        res.status(500).json({
            mensaje: 'Error actualizando estado'
        });

    }
};

module.exports = { crearPedido, obtenerPedidosUsuario, obtenerTodosPedidos, actualizarEstadoPedido };