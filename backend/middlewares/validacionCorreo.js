
const validarEmail = (req, res, next) => {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(req.body.email)) {
        return res.status(400).send("El formato del correo no es válido");
    }

    next();
};

module.exports = {validarEmail};