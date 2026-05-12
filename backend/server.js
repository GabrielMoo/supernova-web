console.clear();

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const rutasAuth = require('./rutas/authRoute');
const rutasPlayera = require('./rutas/playeraRoute');
const rutasCarrito = require('./rutas/carritoRoute');
const rutasPedido = require('./rutas/pedidoRoute');

const app = express();

app.use(cors())
app.use(express.json())

const urlDB = "mongodb://GabMoo:G4br13lm00@ac-ksthoc5-shard-00-00.kvtqf2y.mongodb.net:27017,ac-ksthoc5-shard-00-01.kvtqf2y.mongodb.net:27017,ac-ksthoc5-shard-00-02.kvtqf2y.mongodb.net:27017/supernova_db?ssl=true&replicaSet=atlas-mfcvm6-shard-0&authSource=admin&appName=ClusterSupernova"

mongoose.connect(urlDB)
    .then(() => console.log("Base de datos conectada exitosamente"))
    .catch((err) => console.error("Error al conectar con la base de datos", err))
    ;

app.get("/", (req, res) => {
    res.send("El servidor funciona correctamente")
});

app.use('/api/auth', rutasAuth)
app.use('/api/playeras', rutasPlayera);
app.use('/api/carrito', rutasCarrito);
app.use('/api/pedidos', rutasPedido);

const Direccion = require('./models/Direccion');

// RUTA PARA CREAR O ACTUALIZAR CON LÓGICA DE PREDETERMINADA
// 1. REEMPLAZA TU RUTA POST
app.post('/direcciones', async (req, res) => {
    try {
        const { usuario, esPredeterminada } = req.body;

        // Si la nueva es predeterminada, quitamos ese estado a las demás del mismo usuario
        if (esPredeterminada) {
            await Direccion.updateMany({ usuario: usuario }, { esPredeterminada: false });
        }

        const nuevaDireccion = new Direccion(req.body);
        await nuevaDireccion.save();
        res.status(201).json({ mensaje: "Dirección guardada correctamente" });
    } catch (error) {
        res.status(400).json({ error: "Error al guardar la dirección" });
    }
});

// 2. AGREGA ESTA RUTA PUT (Para editar)
app.put('/direcciones/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { usuario, esPredeterminada } = req.body;

        // Si la edición marca como predeterminada, apagamos las demás
        if (esPredeterminada) {
            await Direccion.updateMany({ usuario: usuario }, { esPredeterminada: false });
        }

        await Direccion.findByIdAndUpdate(id, req.body);
        res.json({ mensaje: "Dirección actualizada correctamente" });
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar la dirección" });
    }
});

// RUTA PARA OBTENER LAS DIRECCIONES DE UN USUARIO
app.get('/direcciones/:idUsuario', async (req, res) => {
    try {
        const idUsuario = req.params.idUsuario;
        // Buscamos todas las direcciones que pertenecen a ese ID
        const direccionesDb = await Direccion.find({ usuario: idUsuario });
        res.json(direccionesDb);
    } catch (error) {
        console.error("Error al obtener direcciones:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
});

app.delete('/direcciones/:id', async (req, res) => {
    try {
        const idAEliminar = req.params.id;

        // 1. Buscamos la dirección para saber de quién es y si era la predeterminada
        const direccionABorrar = await Direccion.findById(idAEliminar);
        if (!direccionABorrar) return res.status(404).send("No encontrada");

        const eraPredeterminada = direccionABorrar.esPredeterminada;
        const idUsuario = direccionABorrar.usuario;

        // 2. Eliminamos la dirección
        await Direccion.findByIdAndDelete(idAEliminar);

        // 3. Si era la favorita, buscamos la siguiente disponible para ese usuario
        if (eraPredeterminada) {
            const siguienteDireccion = await Direccion.findOne({ usuario: idUsuario });
            if (siguienteDireccion) {
                siguienteDireccion.esPredeterminada = true;
                await siguienteDireccion.save();
            }
        }

        res.json({ mensaje: "Eliminada con éxito y predeterminada actualizada si aplicaba" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("El servidor se encuentra escuchando")
});