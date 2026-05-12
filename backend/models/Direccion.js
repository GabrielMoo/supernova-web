const mongoose = require('mongoose');

const direccionSchema = new mongoose.Schema({
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },

    calle: {
        type: String,
        required: true
    },

    referencia: {
        type: String,
        default: 'Casa'
    },

    codigoPostal: {
        type: String,
        required: true
    },

    ciudad: {
        type: String, 
        required: true 
    },

    estado: { 
        type: String,
        required: true 
    },

    telefono: { 
        type: String, 
        required: true 
    },

    esPredeterminada: { 
        type: Boolean, 
        default: false 
    } 
});

module.exports = mongoose.model('Direccion', direccionSchema);