const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    nombre:{
        type: String,
        required: true
    },

    email:{
        type: String,
        required: true,
        unique: true
    },

    contrasena:{
        type: String,
        required: true
    },

    rol: {
        type: String,
        enum: ['cliente', 'admin'],
        default: 'cliente'
    },

    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Usuario', userSchema);