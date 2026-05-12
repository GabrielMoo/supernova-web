const {CATEGORIAS_ARRAY} = require('./Categoria');

const mongoose = require('mongoose')

const shirtSchema = new mongoose.Schema({

    categoria: {
        type: String,
        enum: CATEGORIAS_ARRAY,
        default: 'generico'
    },

    nombre: {
        type: String,
        required: true
    },

    descripcion: {
        type: String,
        required: true
    },

    precio:{
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    imagen_enlace: {
        type: String,
        required: true
    },

    color: {
        type: String,
        enum: ['Blanco', 'Negro'],
        default: 'Blanco'
    }
},
{
    discriminatorKey: 'tipo', collection: 'Playera'
});

const Playera = mongoose.model('Playera', shirtSchema);

const PlayeraPersonalizada = Playera.discriminator('personalizado', new mongoose.Schema({

    diseño: {
        type: String,
        required: true
    },

    posicion: {
        type: String,
        enum: ['Frente', 'Espalda', 'Pectoral'],
        default: 'Espalda'
    },

    especificaciones: {
        type: String,
        required: true
    }

}));

module.exports = {
  Playera,
  PlayeraPersonalizada
};