const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const formRegister = document.getElementById('form-registro');
const formLogin = document.getElementById('form-sesion');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

formRegister.addEventListener('submit', function(evento){
    evento.preventDefault();
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const contrasena = document.getElementById('reg-contrasena').value;

    // ==========================================
    // NUEVA VALIDACIÓN DE CONTRASEÑA
    // ==========================================
    // Esta expresión regular verifica:
    // (?=.*[a-z]) -> Al menos una minúscula
    // (?=.*[A-Z]) -> Al menos una mayúscula
    // (?=.*\d)    -> Al menos un número
    // .{8,}       -> Mínimo 8 caracteres en total
    const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!regexContrasena.test(contrasena)) {
        // Si la contraseña NO pasa la prueba, reciclamos el modal de registro para avisarle al usuario
        const modalRegistro = document.getElementById('modal-registro');
        const tituloRegistro = document.getElementById('titulo-modal-registro');
        const textoRegistro = document.getElementById('texto-modal-registro');

        tituloRegistro.textContent = "¡CONTRASEÑA DÉBIL!";
        textoRegistro.textContent = "La contraseña es demasiado débil";
        modalRegistro.style.display = 'flex';
        
        return; // ¡SÚPER IMPORTANTE! Esto detiene la ejecución para que NO se envíen los datos al servidor.
    }
    // ==========================================


    // Si pasa la validación, armamos el objeto y hacemos el fetch normalmente
    const usuarioNuevo = {
        nombre: nombre,
        email: email, 
        contrasena: contrasena
    };

    fetch('/api/auth/registro', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(usuarioNuevo)
    })
    .then(async respuesta => {
        const texto = await respuesta.text(); 
        
        const modalRegistro = document.getElementById('modal-registro');
        const tituloRegistro = document.getElementById('titulo-modal-registro');
        const textoRegistro = document.getElementById('texto-modal-registro');

        if (respuesta.ok) {
            tituloRegistro.textContent = "¡REGISTRO EXITOSO!";
            textoRegistro.textContent = texto; 
            formRegister.reset();
            container.classList.remove("active"); 
        } else {
            tituloRegistro.textContent = "¡ERROR AL REGISTRAR!";
            textoRegistro.textContent = texto; 
        }
        
        modalRegistro.style.display = 'flex';
    })
    .catch(error => {
        console.error("Error al enviar:", error);
    });
});

formLogin.addEventListener('submit', function(evento){
    evento.preventDefault();
    const email = document.getElementById('login-email').value
    const contrasena = document.getElementById('login-contrasena').value

    const usuario = {
        email: email, 
        contrasena: contrasena
    };

    fetch('/api/auth/login', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(usuario)
    })
    .then(respuesta => respuesta.json())
    .then(datos => {

        if(datos.exito == true){
            localStorage.setItem('usuarioLogueado', JSON.stringify(datos.usuario));
            if(datos.usuario.rol === 'admin') {
                window.location.href = "../admin/indexAdmin.html"; 
            } else {
                window.location.href = "index.html"; 
            }
        } else {
            // --- NUEVO CÓDIGO PARA EL MODAL ---
            
            // 1. Capturamos el modal y su párrafo de texto
            const modalError = document.getElementById('modal-correo-no-encontrado');
            const textoError = modalError.querySelector('.body-modal-carrito p');
            
            // 2. Le inyectamos el mensaje exacto que viene de tu backend
            textoError.textContent = datos.mensaje; 
            
            // 3. Mostramos el modal
            modalError.style.display = 'flex'; 
        }

    })
    .catch(error => console.error("Error en la petición de login:", error));

});

// Función maestra para ocultar/mostrar cualquier contraseña
function configurarOjo(idInput, idIcono) {
    const input = document.getElementById(idInput);
    const icono = document.getElementById(idIcono);

    icono.addEventListener('click', function() {
        if (input.type === 'password') {
            input.type = 'text';
            icono.innerHTML = '<i class="bi bi-eye-slash"></i>'; 
        } else {
            input.type = 'password';
            icono.innerHTML = '<i class="bi bi-eye"></i>'; 
        }
    });
}

// ==========================================
// CONTROLADORES DE MODALES
// ==========================================

// Capturamos el modal y el botón de confirmar
const modalErrorLogin = document.getElementById('modal-correo-no-encontrado');
const btnConfirmarError = document.getElementById('btn-cerrar-modal-correo');

// Evento para cerrar el modal al hacer clic en "Confirmar"
if (btnConfirmarError && modalErrorLogin) {
    btnConfirmarError.addEventListener('click', () => {
        modalErrorLogin.style.display = 'none'; // Lo volvemos a ocultar
    });
}

// Capturamos el modal de registro y su botón
const modalRegistro = document.getElementById('modal-registro');
const btnCerrarRegistro = document.getElementById('btn-cerrar-modal-registro');

// Evento para cerrar el modal de registro
if (btnCerrarRegistro && modalRegistro) {
    btnCerrarRegistro.addEventListener('click', () => {
        modalRegistro.style.display = 'none'; // Lo ocultamos
    });
}

// ==========================================
// VALIDACIÓN DE CONTRASEÑA EN TIEMPO REAL
// ==========================================
const inputRegistroPass = document.getElementById('reg-contrasena');
const reqLongitud = document.getElementById('req-longitud');
const reqMayuscula = document.getElementById('req-mayuscula');
const reqMinuscula = document.getElementById('req-minuscula');
const reqNumero = document.getElementById('req-numero');

// Función auxiliar para cambiar el estado visual
function validarRequisito(elemento, cumpleRegla) {
    const icono = elemento.querySelector('i');
    if (cumpleRegla) {
        elemento.classList.add('valido');
        icono.classList.replace('bi-x-circle', 'bi-check-circle');
    } else {
        elemento.classList.remove('valido');
        icono.classList.replace('bi-check-circle', 'bi-x-circle');
    }
}

// Evento que se dispara cada vez que el usuario escribe algo
if (inputRegistroPass) {
    inputRegistroPass.addEventListener('input', function() {
        const pass = inputRegistroPass.value;

        // 1. Validar longitud (Mínimo 8)
        validarRequisito(reqLongitud, pass.length >= 8);

        // 2. Validar minúscula (Busca al menos una de la a a la z)
        validarRequisito(reqMinuscula, /[a-z]/.test(pass));

        // 3. Validar mayúscula (Busca al menos una de la A a la Z)
        validarRequisito(reqMayuscula, /[A-Z]/.test(pass));

        // 4. Validar número (Busca al menos un dígito)
        validarRequisito(reqNumero, /\d/.test(pass));
    });
}

// Llamamos a la función para cada formulario
configurarOjo('reg-contrasena', 'icono-ojo'); // Para el de registro
configurarOjo('login-contrasena', 'icono-ojo-login'); // Para el de login