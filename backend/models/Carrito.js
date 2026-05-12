const mongoose = require('mongoose');
const { applyTimestamps } = require('./Stock');

const carritoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    estado: {
        type: String,
        enum: ['activo', 'abandonado'],
        default: 'activo'
    },

}, {timestamps: true});

module.exports = mongoose.model('Carrito', carritoSchema);