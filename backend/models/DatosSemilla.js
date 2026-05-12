const mongoose = require('mongoose');

// Importa tus modelos (ajusta las rutas según la estructura de tus carpetas)
const Usuario = require('./Usuario');
const { Playera, PlayeraPersonalizada } = require('./Playera');
const Stock = require('./Stock');
const { CATEGORIAS } = require('./Categoria');

async function poblarBaseDeDatos() {
    try {
        // 1. Conectar a MongoDB (Cambia la URL si usas MongoDB Atlas)
        await mongoose.connect('mongodb://127.0.0.1:27017/supernova_db');
        console.log('🟢 Conectado a la base de datos...');

        // 2. Limpiar colecciones existentes para evitar duplicados
        await Usuario.deleteMany({});
        await Playera.deleteMany({});
        await Stock.deleteMany({});
        console.log('🧹 Limpiando datos antiguos...');

        // 3. Crear Usuarios Semilla
        const admin = await Usuario.create({
            nombre: 'Admin Supremo',
            email: 'admin@tienda.com',
            contrasena: 'admin123', // Recuerda que luego esto deberá estar encriptado
            rol: 'admin'
        });

        const cliente = await Usuario.create({
            nombre: 'Juan Pérez',
            email: 'juan@gmail.com',
            contrasena: 'cliente123'
        });
        console.log('👤 Usuarios creados...');

        // 4. Crear Playeras Semilla
        const playeraBasica = await Playera.create({
            categoria: CATEGORIAS.GENERICO,
            nombre: 'Playera Negra Minimalista',
            descripcion: 'Playera 100% algodón peinado, ideal para cualquier outfit.',
            // Mongoose requiere que casteemos los strings a Decimal128
            precio: mongoose.Types.Decimal128.fromString('250.00'), 
            imagen_enlace: 'https://ejemplo.com/imagenes/playera-negra.jpg',
            color: 'Negro'
        });

        const playeraAnime = await PlayeraPersonalizada.create({
            categoria: CATEGORIAS.ANIME,
            nombre: 'Playera Shingeki no Kyojin',
            descripcion: 'Diseño exclusivo del cuerpo de exploración.',
            precio: mongoose.Types.Decimal128.fromString('350.50'),
            imagen_enlace: 'https://ejemplo.com/imagenes/snk.jpg',
            color: 'Blanco',
            diseño: 'alas_libertad_vector',
            posicion: 'Espalda',
            especificaciones: 'Impresión en serigrafía de alta durabilidad'
        });
        console.log('👕 Playeras creadas...');

        // 5. Crear Stock (Inventario) para las playeras
        await Stock.create([
            { playera: playeraBasica._id, corte: 'Regular', talla: 'M', cantidad: 50 },
            { playera: playeraBasica._id, corte: 'Regular', talla: 'L', cantidad: 30 },
            { playera: playeraAnime._id, corte: 'Oversize', talla: 'XL', cantidad: 15 }
        ]);
        console.log('📦 Inventario inicializado...');

        console.log('✅ ¡Base de datos poblada con éxito!');

    } catch (error) {
        console.error('❌ Error al poblar la base de datos:', error);
    } finally {
        // 6. Desconectar para que el script termine su ejecución
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB.');
    }
}

// Ejecutar la función
poblarBaseDeDatos();