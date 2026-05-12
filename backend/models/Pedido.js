const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    // --- NUEVO SUBDOCUMENTO CON LOS CAMPOS DE DIRECCIÓN ---
    direccionEnvio: {
        calle: { type: String, required: true },
        referencia: { type: String, default: '' },
        codigoPostal: { type: String, required: true },
        ciudad: { type: String, required: true },
        estado: { type: String, required: true },
        telefono: { type: String, required: true }
    },
    subtotal: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    envio: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    total: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'En preparacion', 'Enviado', 'Completado'],
        default: 'Pendiente'
    }
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);

