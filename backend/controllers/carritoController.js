const Carrito = require('../models/Carrito');
const ItemCarrito = require('../models/ItemCarrito');
const Stock = require('../models/Stock');

const agregarProductoAlCarrito = async (req, res) => {
    try {
        // Ahora recibimos el stockId (que representa la combinación talla/corte)
        const { usuarioId, stockId, cantidad } = req.body;

        const stockDisponible = await Stock.findById(stockId);
        if (!stockDisponible) return res.status(404).json({ exito: false, mensaje: "Stock no encontrado" });

        // 1. Buscar si el usuario ya tiene un carrito activo
        let carrito = await Carrito.findOne({ usuario: usuarioId, estado: 'activo' });

        // 2. Si no tiene uno, lo creamos
        if (!carrito) {
            carrito = new Carrito({ usuario: usuarioId, estado: 'activo' });
            await carrito.save();
        }

        // 3. Buscar si el producto ya está en ese carrito
        let item = await ItemCarrito.findOne({ carrito: carrito._id, stock: stockId });

        let cantidadFutura = item ? item.cantidad + parseInt(cantidad) : parseInt(cantidad);

        if (cantidadFutura > stockDisponible.cantidad) {
            return res.status(400).json({ 
                exito: false, 
                mensaje: `Stock insuficiente. Solo hay ${stockDisponible.cantidad} disponibles.` 
            });
        }

        if (item) {
            // Si ya existe, aumentamos la cantidad
            item.cantidad += parseInt(cantidad);
            await item.save();
        } else {
            // Si no existe, creamos el nuevo item
            item = new ItemCarrito({
                carrito: carrito._id,
                stock: stockId,
                cantidad: parseInt(cantidad)
            });
            await item.save();
        }

        res.status(200).json({ exito: true, mensaje: "Producto agregado al carrito", item });

    } catch (error) {
        console.error("Error al agregar al carrito:", error);
        res.status(500).json({ exito: false, mensaje: "Error interno del servidor" });
    }
};

const obtenerCarritoUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const carrito = await Carrito.findOne({ usuario: usuarioId, estado: 'activo' });

        if (!carrito) {
            return res.status(200).json([]);
        }

        // Hacemos populate del stock y de la playera para tener toda la info en el frontend
        const items = await ItemCarrito.find({ carrito: carrito._id })
            .populate({
                path: 'stock',
                populate: { path: 'playera' }
            });

        res.status(200).json(items);
    } catch (error) {
        console.error("Error al obtener el carrito:", error);
        res.status(500).json({ mensaje: "Error al obtener el carrito" });
    }
};

const eliminarItemCarrito = async (req, res) => {
    try {
        const { itemId } = req.params;
        await ItemCarrito.findByIdAndDelete(itemId);
        res.status(200).json({ exito: true, mensaje: "Producto eliminado" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar el producto" });
    }
};

const actualizarCantidadItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { nuevaCantidad } = req.body;

        // Buscamos el item y traemos los datos de su stock
        const item = await ItemCarrito.findById(itemId).populate('stock');
        if (!item) return res.status(404).json({ exito: false, mensaje: "Item no encontrado" });

        // Validaciones
        if (nuevaCantidad < 1) {
            return res.status(400).json({ exito: false, mensaje: "La cantidad no puede ser menor a 1" });
        }
        if (nuevaCantidad > item.stock.cantidad) {
            return res.status(400).json({ exito: false, mensaje: `Solo tenemos ${item.stock.cantidad} en stock.` });
        }

        // Actualizamos y guardamos
        item.cantidad = nuevaCantidad;
        await item.save();

        res.status(200).json({ exito: true, mensaje: "Cantidad actualizada", item });
    } catch (error) {
        console.error("Error al actualizar cantidad:", error);
        res.status(500).json({ exito: false, mensaje: "Error del servidor" });
    }
};

module.exports = { agregarProductoAlCarrito, obtenerCarritoUsuario, eliminarItemCarrito, actualizarCantidadItem };