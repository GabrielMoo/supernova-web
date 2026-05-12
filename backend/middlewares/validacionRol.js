
const validarRol = (req, res, next) => {

    if (req.body.rol !== 'admin') {
        return res.status(403).json({
            exito: false,
            mensaje: "El acceso esta restringido a administradores"
        });
    }

    next();
};

module.exports = { validarRol };