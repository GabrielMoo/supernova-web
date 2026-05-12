const mongoose = require('mongoose');

const itemPedidoSchema = new mongoose.Schema({
    pedido: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pedido',
        required: true
    },
    // Opcional: guardamos el ID original por si queremos hacer métricas después
    stockOriginalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock'
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    // NUEVO: Snapshot inmutable del producto
    productoSnapshot: {
        nombre: { type: String, required: true },
        corte: { type: String, required: true },
        talla: { type: String, required: true },
        precio: { type: mongoose.Schema.Types.Decimal128, required: true },
        imagen_enlace: { type: String, required: true }
    }
});

module.exports = mongoose.model('ItemPedido', itemPedidoSchema);