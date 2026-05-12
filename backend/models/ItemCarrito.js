const mongoose = require('mongoose');

const itemCarritoSchema = new mongoose.Schema({

    carrito: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrito',
        required: true
    },

    stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
    },

    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
});

module.exports = mongoose.model('ItemCarrito', itemCarritoSchema);