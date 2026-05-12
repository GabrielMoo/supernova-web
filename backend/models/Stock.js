const mongoose = require('mongoose')

const stockSchema = new mongoose.Schema({

    playera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playera',
        required: true
    },

    corte: {
        type: String,
        enum: ['Regular', 'Oversize'],
        default: 'Regular'
    },

    talla: {
        type: String,
        enum: ['S', 'M', 'L', 'XL'],
        default: 'M'
    },

    cantidad: {
        type: Number,
        required: true,
        min: 0,
        validate: {
        validator: Number.isInteger,
        message: '{VALUE} no es un número entero'
    }
    }

});

module.exports = mongoose.model('Stock', stockSchema);