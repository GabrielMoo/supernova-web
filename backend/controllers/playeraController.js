// 1. Importamos AMBOS modelos correctamente
const { Playera } = require('../models/Playera');
const Stock = require('../models/Stock');

const registrarPlayera = async (req, res) => {
    try {
        // 2. Extraer los datos de texto que vienen en el paquete (FormData)
        const { nombre, descripcion, precio, categoria, color } = req.body;

        // El frontend nos envió el stock como texto, aquí lo volvemos a convertir en Arreglo
        const stocksArray = JSON.parse(req.body.stocks);

        // 3. Obtener la URL de la imagen
        // Multer y Cloudinary trabajaron juntos y nos dejaron la URL lista en req.file.path
        if (!req.file) {
            return res.status(400).json({ mensaje: "Por favor, sube una imagen." });
        }
        const imagenUrl = req.file.path;

        // 4. CREAR Y GUARDAR LA PLAYERA
        const nuevaPlayera = new Playera({
            categoria,
            nombre,
            descripcion,
            precio,
            imagen_enlace: imagenUrl, // Guardamos la URL de Cloudinary
            color
        });

        // Guardamos en MongoDB y esperamos a que nos devuelva el objeto (que ya incluye su _id)
        const playeraGuardada = await nuevaPlayera.save();
        console.log("✅ Playera guardada con ID:", playeraGuardada._id);

        // 5. CREAR Y GUARDAR EL STOCK
        // Mapeamos el arreglo de tallas para inyectarle el _id de la playera a cada uno
        const stockParaGuardar = stocksArray.map(item => ({
            playera: playeraGuardada._id, // ¡Aquí está la magia de la relación!
            corte: item.corte,
            talla: item.talla,
            cantidad: item.cantidad
        }));

        // Guardamos todos los registros de stock de un solo golpe
        await Stock.insertMany(stockParaGuardar);
        console.log("✅ Stock guardado exitosamente");

        // 6. Responder al Frontend que todo salió perfecto
        res.status(201).json({ mensaje: "Playera y Stock registrados exitosamente" });

    } catch (error) {
        console.error("❌ Error al guardar la playera y stock:", error);
        res.status(500).json({ mensaje: "Hubo un error interno en el servidor", error: error.message });
    }
};

const obtenerPlayera = async (req, res) => {
    try {
        // .find() sin parámetros le dice a MongoDB: "Tráeme todo"
        const productos = await Playera.aggregate([
            {
                $lookup: {
                    from: "stocks",           // El nombre de la colección de stock en la BD (suele ser el plural)
                    localField: "_id",        // El ID de la playera
                    foreignField: "playera",  // El campo en 'Stock' que referencia a la playera
                    as: "stock"               // El nombre del nuevo campo que contendrá el array de tallas/cortes
                }
            }
        ]);

        // Express convierte automáticamente el resultado a formato JSON
        res.status(200).json(productos);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ mensaje: "Hubo un error en el servidor" });
    }
};

const obtenerPlayeraCategoria = async (req, res) => {
    try {
        // Extraemos la categoría que el usuario escribió en la URL
        const categoriaSolicitada = req.params.categoria;

        // Le decimos a MongoDB: "Tráeme solo los que coincidan con esta categoría"
        const playerasFiltradas = await Playera.aggregate([
            {
                $match: { categoria: categoriaSolicitada } // Filtramos primero por categoría
            },
            {
                $lookup: {
                    from: "stocks",
                    localField: "_id",
                    foreignField: "playera",
                    as: "stock"
                }
            }
        ]);

        res.status(200).json(playerasFiltradas);
    } catch (error) {
        console.error("Error al filtrar por categoría:", error);
        res.status(500).json({ mensaje: "Hubo un error al filtrar los productos" });
    }
};

const eliminarPlayera = async (req, res) => {

    try {

        const id = req.params.id;

        // Eliminamos la playera
        await Playera.findByIdAndDelete(id);

        // Eliminamos también su stock relacionado
        await Stock.deleteMany({ playera: id });

        res.status(200).json({
            mensaje: "Playera eliminada correctamente"
        });

    } catch (error) {

        console.error("Error eliminando playera:", error);

        res.status(500).json({
            mensaje: "Error al eliminar playera"
        });
    }
};

const editarPlayera = async (req, res) => {

    try {

        const id = req.params.id;

        const {
            nombre,
            descripcion,
            precio,
            categoria,
            color
        } = req.body;

        const stocksArray = JSON.parse(req.body.stocks);

        // =========================
        // BUSCAR PLAYERA
        // =========================

        const playera = await Playera.findById(id);

        if (!playera) {
            return res.status(404).json({
                mensaje: "Playera no encontrada"
            });
        }

        // =========================
        // ACTUALIZAR DATOS
        // =========================

        playera.nombre = nombre;
        playera.descripcion = descripcion;
        playera.precio = precio;
        playera.categoria = categoria;
        playera.color = color;

        // =========================
        // IMAGEN (solo si cambió)
        // =========================

        if (req.file) {
            playera.imagen_enlace = req.file.path;
        }

        await playera.save();

        // =========================
        // ACTUALIZAR STOCK
        // =========================

        // Borramos stock anterior
        await Stock.deleteMany({ playera: id });

        // Creamos stock nuevo
        const nuevoStock = stocksArray.map(item => ({
            playera: id,
            corte: item.corte,
            talla: item.talla,
            cantidad: item.cantidad
        }));

        await Stock.insertMany(nuevoStock);

        res.status(200).json({
            mensaje: "Playera actualizada correctamente"
        });

    } catch (error) {

        console.error("Error editando playera:", error);

        res.status(500).json({
            mensaje: "Error al editar playera"
        });

    }
};

// Exportamos la función
module.exports = { registrarPlayera, obtenerPlayera, obtenerPlayeraCategoria, eliminarPlayera, editarPlayera };