// VARIABLES Y LÓGICA DEL MODAL DINÁMICO
const modalNotificacion = document.getElementById('modal-notificacion');
const modalTitulo = document.getElementById('modal-titulo');
const modalMensaje = document.getElementById('modal-mensaje');
const btnCerrarNotificacion = document.getElementById('btn-cerrar-notificacion');

let funcionAlCerrar = null; // Guardará una acción si necesitamos redirigir

btnCerrarNotificacion.addEventListener('click', () => {
    modalNotificacion.style.display = 'none';
    if (typeof funcionAlCerrar === 'function') {
        funcionAlCerrar(); // Ejecuta la redirección si existe
        funcionAlCerrar = null; // Limpiamos la variable
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));

    if (!usuarioLogueado) {
        window.location.href = 'login.html';
        return;
    }

    cargarDirecciones(usuarioLogueado.id);
    cargarResumenPedido(usuarioLogueado.id);
});

async function cargarDirecciones(usuarioId) {
    const contenedor = document.getElementById('contenedor-direcciones-pago');
    try {
        const res = await fetch(`http://localhost:3000/direcciones/${usuarioId}`);
        const direcciones = await res.json();

        if (direcciones.length === 0) {
            contenedor.innerHTML = `
                <div class="aviso-sin-direccion">
                    <p>No tienes direcciones registradas.</p>
                    <button class="btn-secundario" onclick="irAPerfil()">+ Agregar dirección</button>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = direcciones.map(dir => `
            <label class="tarjeta-direccion-pago">
                <input type="radio" name="direccion-seleccionada" value="${dir._id}" ${dir.esPredeterminada ? 'checked' : ''}>
                <div class="info-dir">
                    <strong>${dir.calle}</strong>
                    <span>${dir.ciudad}, ${dir.estado}, CP ${dir.codigoPostal}</span>
                </div>
            </label>
        `).join('');

    } catch (error) {
        console.error("Error cargando direcciones:", error);
    }
}

async function cargarResumenPedido(usuarioId) {
    const listaUI = document.getElementById('lista-productos-resumen');
    const subtotalUI = document.getElementById('resumen-subtotal');
    const totalUI = document.getElementById('resumen-total');

    try {
        const res = await fetch(`http://localhost:3000/api/carrito/${usuarioId}`);
        const items = await res.json();

        let subtotal = 0;
        listaUI.innerHTML = '';

        items.forEach(item => {
            const precio = parseFloat(item.stock.playera.precio.$numberDecimal || item.stock.playera.precio);
            subtotal += precio * item.cantidad;

            listaUI.innerHTML += `
                <div class="item-resumen">
                    <img src="${item.stock.playera.imagen_enlace}" alt="${item.stock.playera.nombre}">
                    <div class="detalles">
                        <p class="nombre">${item.stock.playera.nombre}</p>
                        <p class="variante">${item.stock.corte} / ${item.stock.talla} (x${item.cantidad})</p>
                    </div>
                    <span class="precio">$${(precio * item.cantidad).toFixed(2)}</span>
                </div>
            `;
        });

        const envio = 99;
        subtotalUI.innerText = `$${subtotal.toFixed(2)}`;
        totalUI.innerText = `$${(subtotal + envio).toFixed(2)}`;

    } catch (error) {
        console.error("Error cargando resumen:", error);
    }
}

function irAPerfil() {
    // Guardamos una bandera para que al cargar perfil.html se abra el form automáticamente
    localStorage.setItem('abrirFormDireccion', 'true');
    window.location.href = 'perfil.html';
}

const btnPagar = document.getElementById('btn-finalizar-pedido');

if (btnPagar) {
    btnPagar.addEventListener('click', async () => {
        const direccionSeleccionada = document.querySelector('input[name="direccion-seleccionada"]:checked');
        if (!direccionSeleccionada) {
            // REEMPLAZO 1
            mostrarAlertaPersonalizada("¡ATENCIÓN!", "Por favor, selecciona una dirección de envío.");
            return;
        }

        const inputsTarjeta = document.querySelectorAll('.formulario-tarjeta input');
        let formularioValido = true;
        inputsTarjeta.forEach(input => {
            if (input.value.trim() === '') formularioValido = false;
        });
        if (!formularioValido) {
            // REEMPLAZO 2
            mostrarAlertaPersonalizada("¡DATOS INCOMPLETOS!", "Por favor, completa todos los datos de tu tarjeta.");
            return;
        }

        btnPagar.innerHTML = 'Procesando pago... <i class="bi bi-hourglass-split"></i>';
        btnPagar.disabled = true;
        btnPagar.style.backgroundColor = 'var(--gris-texto)';

        // Simular espera de 2.5s
        setTimeout(async () => {
            try {
                const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
                const dirId = direccionSeleccionada.value;
                const subtotalTexto = document.getElementById('resumen-subtotal').innerText.replace('$', '');
                const envioTexto = '99';
                const totalTexto = document.getElementById('resumen-total').innerText.replace('$', '');

                const respuesta = await fetch('http://localhost:3000/api/pedidos/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        usuarioId: usuario.id,
                        direccionId: dirId,
                        subtotal: parseFloat(subtotalTexto),
                        envio: parseFloat(envioTexto),
                        total: parseFloat(totalTexto)
                    })
                });

                const data = await respuesta.json();
                if (data.exito) {
                    // REEMPLAZO 3: Aquí pasamos la redirección como tercer parámetro (el callback)
                    mostrarAlertaPersonalizada("¡PAGO APROBADO!", "Tu pedido ha sido confirmado.", () => {
                        window.location.href = 'pedidos.html';
                    });
                } else {
                    // REEMPLAZO 4
                    mostrarAlertaPersonalizada("¡ERROR!", "Ocurrió un problema: " + data.mensaje);
                    btnPagar.innerText = 'Pagar ahora';
                    btnPagar.disabled = false;
                    btnPagar.style.backgroundColor = '';
                }
            } catch (error) {
                console.error("Error al procesar el pago:", error);
                // REEMPLAZO 5
                mostrarAlertaPersonalizada("¡ERROR!", "Ocurrió un error al procesar el pago.");
                btnPagar.innerText = 'Pagar ahora';
                btnPagar.disabled = false;
                btnPagar.style.backgroundColor = '';
            }
        }, 2500);
    });
}

function mostrarAlertaPersonalizada(titulo, mensaje, callback = null) {
    modalTitulo.innerText = titulo;
    modalMensaje.innerText = mensaje;
    funcionAlCerrar = callback;
    modalNotificacion.style.display = 'flex';
}

// ==========================================
// LÓGICA DE FORMATEO DE TARJETA, FECHA Y CVV
// ==========================================

const inputTarjeta = document.getElementById('input-tarjeta');
const inputFecha = document.getElementById('input-fecha');
const inputCvv = document.getElementById('input-cvv');

// 1. Formato de Tarjeta (Solo números y espacio cada 4 dígitos)
if (inputTarjeta) {
    inputTarjeta.addEventListener('input', (e) => {
        // Elimina cualquier carácter que no sea un número (\D)
        let valor = e.target.value.replace(/\D/g, '');
        
        // Agrega un espacio después de cada bloque de 4 números, 
        // excepto al final si no hay más números (?=\d)
        valor = valor.replace(/(\d{4})(?=\d)/g, '$1 ');
        
        e.target.value = valor;
    });
}

// 2. Formato de Fecha de Expiración (Solo números y "/" después del mes)
if (inputFecha) {
    inputFecha.addEventListener('input', (e) => {
        // Elimina cualquier carácter que no sea un número
        let valor = e.target.value.replace(/\D/g, '');
        
        // Si ya hay 2 o más números, inserta el "/"
        if (valor.length >= 2) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
        }
        
        e.target.value = valor;
    });
}

// 3. Formato de CVV (Únicamente números)
if (inputCvv) {
    inputCvv.addEventListener('input', (e) => {
        // Elimina cualquier carácter que no sea un número instantáneamente
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

const inputNombre = document.getElementById('input-nombre');

// 4. Formato de Nombre (Solo letras y espacios, incluyendo acentos y la ñ)
if (inputNombre) {
    inputNombre.addEventListener('input', (e) => {
        // La expresión regular [^...] significa "todo lo que NO esté en esta lista"
        // a-zA-Z: Letras normales
        // áéíóúÁÉÍÓÚñÑ: Letras con acentos y eñes
        // \s: Espacios
        e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    });
}