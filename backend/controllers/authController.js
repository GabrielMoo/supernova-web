const bcrypt = require('bcrypt')
const Usuario = require('../models/Usuario')
const Pedido = require('../models/Pedido');

const registrarUsuario = async (req, res) => {

    try {
        const contrasenaPlana = req.body.contrasena;
        const contrasenaSegura = await bcrypt.hash(contrasenaPlana, 10);

        const usuarioSeguro = new Usuario({
            nombre: req.body.nombre,
            email: req.body.email,
            contrasena: contrasenaSegura
        });

        await usuarioSeguro.save();
        console.log("Usuario guardado en la base de datos");
        res.send("Usuario registrado exitosamente");

    } catch (error) {

        console.error("Error al guardar el usuario:", error);
        res.status(400).send("Hubo un error al registrar el usuario");
    }
};

const loginUsuario = async (req, res) => {
    try {
        const emailLogin = req.body.email;
        const contrasenaLogin = req.body.contrasena;

        const usuarioComparar = await Usuario.findOne({ email: emailLogin });

        if (usuarioComparar == null) {
            // Cambiado a .json()
            return res.status(400).json({ exito: false, mensaje: "Correo no encontrado, verifica que este escrito correctamente." });
        }

        const contrasenaValida = await bcrypt.compare(contrasenaLogin, usuarioComparar.contrasena);

        if (contrasenaValida == false) {
            // Cambiado a .json()
            return res.status(400).json({ exito: false, mensaje: "La contraseña ingresada es incorrecta" });
        } else {
            res.json({
                exito: true, 
                mensaje: "Inicio de sesion exitoso",
                usuario: {
                    id: usuarioComparar._id,
                    nombre: usuarioComparar.nombre,
                    email: usuarioComparar.email,
                    rol: usuarioComparar.rol
                }
            });
        }

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        // Cambiado a .json() y corregí el mensaje (decía "registrar" en vez de "iniciar sesión")
        res.status(500).json({ exito: false, mensaje: "Hubo un error en el servidor al intentar iniciar sesión" });
    }
};

const obtenerClientesAdmin = async (req, res) => {
    try {
        // Usamos aggregate para unir la tabla Usuarios con Pedidos
        const clientesStats = await Usuario.aggregate([
            { 
                $match: { rol: 'cliente' } // Solo traemos a los que son clientes
            },
            {
                $lookup: {
                    from: 'pedidos', // El nombre de la colección en Mongoose (por defecto en minúsculas y plural)
                    localField: '_id',
                    foreignField: 'usuario',
                    as: 'misPedidos'
                }
            },
            {
                $project: {
                    nombre: 1,
                    email: 1,
                    fechaRegistro: 1,
                    cantidadPedidos: { $size: "$misPedidos" }, // Cuenta cuántos pedidos tiene el arreglo
                    totalGastado: { $sum: "$misPedidos.total" } // Suma el campo 'total' de todos sus pedidos
                }
            }
        ]);

        res.json(clientesStats);

    } catch (error) {
        console.error("Error al obtener estadísticas de clientes:", error);
        res.status(500).json({ error: "Error en el servidor al cargar clientes" });
    }
};

module.exports = { registrarUsuario, loginUsuario, obtenerClientesAdmin };