const overlay = document.getElementById('overlay-direccion');
const btnAbrir = document.getElementById('btn-abrir-formulario');
const btnCancelar = document.getElementById('btn-cancelar');
const formDireccion = document.getElementById('form-direccion');
const btnEliminar = document.getElementById('btn-eliminar-direccion');
const modalEliminar = document.getElementById('modal-carrito-vacio');
const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

// CONSTANTES PARA LOS NUEVOS MODALES
const modalGuardar = document.getElementById('modal-guardar-direccion');
const modalEditar = document.getElementById('modal-editar-direccion');
const btnConfirmarGuardado = document.getElementById('btn-confirmar-guardado');
const btnConfirmarEditado = document.getElementById('btn-confirmar-editado');

// VARIABLES GLOBALES NUEVAS
let direccionesLocales = []; 
let editandoId = null;

// EVENTOS PARA CERRAR LOS MODALES CON EL BOTÓN "OK"
btnConfirmarGuardado.addEventListener('click', () => {
    modalGuardar.style.display = 'none';
});

btnConfirmarEditado.addEventListener('click', () => {
    modalEditar.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {

    // 1. Obtener los datos del LocalStorage
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');

    if (usuarioGuardado) {
        // 2. Si existe, lo convertimos de texto de vuelta a un objeto JavaScript
        const usuario = JSON.parse(usuarioGuardado);

        // 3. Inyectamos los valores en los spans que preparamos en el HTML
        document.getElementById('nombre-perfil').textContent = usuario.nombre;
        document.getElementById('email-perfil').textContent = usuario.email;
    } else {
        // Si no hay datos guardados (alguien entró a perfil.html sin iniciar sesión), 
        // lo regresamos a la pantalla de login por seguridad.
        window.location.href = "login-register.html";
    }

    // EXTRA: Lógica para el botón de Cerrar Sesión
    const btnCerrarSesion = document.querySelector('.btn-cerrar-sesion');

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            // Borramos los datos de la memoria
            localStorage.removeItem('usuarioLogueado');
            // Redirigimos al inicio de sesión
            window.location.href = "login-register.html";
        });
    }

    // Al final del DOMContentLoaded de scriptPerfil.js
    if (localStorage.getItem('abrirFormDireccion') === 'true') {
        overlay.style.display = 'flex'; // Abre tu modal/overlay de dirección
        localStorage.removeItem('abrirFormDireccion'); // Limpiamos la bandera
    }

    obtenerDireccionesDeBD();

});

// ABRIR
// REEMPLAZA TU btnAbrir POR ESTE:
btnAbrir.addEventListener('click', () => {
    editandoId = null;
    formDireccion.reset();
    btnEliminar.style.display = 'none'; // No se puede borrar algo que no existe
    if(formDireccion.pais) formDireccion.pais.value = "Mexico";
    overlay.style.display = 'flex';
});

// CANCELAR Y LIMPIAR
btnCancelar.addEventListener('click', () => {
    overlay.style.display = 'none';
    formDireccion.reset(); // Borra todo lo escrito
});

// GUARDAR EN BD
// REEMPLAZA TU EVENTO 'submit' POR ESTE:
formDireccion.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Convertimos el formulario en un objeto JSON
    const formData = new FormData(formDireccion);
    const datos = Object.fromEntries(formData.entries());
    datos.esPredeterminada = formData.has('esPredeterminada');

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioLogueado'))
    datos.usuario = usuarioGuardado.id; // Tú usas "usuario", lo mantenemos igual

    // Decidimos la URL y el Método dependiendo de si estamos editando o creando
    const url = editandoId 
        ? `/direcciones/${editandoId}` 
        : '/direcciones';
    
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (respuesta.ok) {
            // Evaluamos si estábamos editando o creando para mostrar el modal correcto
            if (editandoId) {
                modalEditar.style.display = 'flex'; // Muestra modal de edición
            } else {
                modalGuardar.style.display = 'flex'; // Muestra modal de guardado
            }

            // Cerramos el formulario y limpiamos
            overlay.style.display = 'none';
            formDireccion.reset();
            editandoId = null; // Limpiamos el ID
            
            // Volvemos a pedir las direcciones a la BD para que aparezca la nueva sin recargar la página
            obtenerDireccionesDeBD(); 
        }
    } catch (error) {
        console.error("Error al guardar:", error);
    }
});

// Atrapa el nuevo botón
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

// Agrega el evento para la X
btnCerrarModal.addEventListener('click', () => {
    overlay.style.display = 'none';
    formDireccion.reset();
});

async function obtenerDireccionesDeBD() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (!usuarioLogueado) return;

    try {
        const respuesta = await fetch(`/direcciones/${usuarioLogueado.id}`);
        const direcciones = await respuesta.json();
        
        direccionesLocales = direcciones; // <--- AGREGAR ESTO: Guardamos copia en local

        renderizarDirecciones(direcciones);
    } catch (error) {
        console.error("Error al cargar direcciones:", error);
    }
}

// NUEVA FUNCIÓN: Se activa al darle clic al icono del lápiz
window.abrirEdicion = function(id) {
    // Buscamos la dirección en el arreglo que guardamos previamente
    const dir = direccionesLocales.find(d => d._id === id);
    if (!dir) return;

    editandoId = id; // Marcamos que estamos editando esta dirección
    
    // Rellenamos tu formulario de manera automática (asegúrate de que los 'name' coincidan)
    formDireccion.calle.value = dir.calle || "";
    formDireccion.referencia.value = dir.referencia || "";
    formDireccion.codigoPostal.value = dir.codigoPostal || "";
    formDireccion.ciudad.value = dir.ciudad || "";
    formDireccion.estado.value = dir.estado || "";
    if(formDireccion.pais) formDireccion.pais.value = "Mexico";
    formDireccion.telefono.value = dir.telefono || "";
    
    // El checkbox de predeterminada
    const checkPredeterminada = formDireccion.querySelector('[name="esPredeterminada"]');
    if (checkPredeterminada) {
        checkPredeterminada.checked = dir.esPredeterminada;
    }

    btnEliminar.style.display = 'block';
    overlay.style.display = 'flex'; // Abrimos el modal
};

// 1. Al dar clic en el basurero del formulario, SOLO abrimos el modal
btnEliminar.addEventListener('click', () => {
    if (!editandoId) return;
    modalEliminar.style.display = 'flex'; // Mostramos tu modal personalizado
});

// 2. Si el usuario se arrepiente y le da a "Cancelar" en el modal
btnCancelarEliminar.addEventListener('click', () => {
    modalEliminar.style.display = 'none'; // Ocultamos el modal de advertencia
});

// 3. Si el usuario confirma la eliminación dándole al botón rojo/principal del modal
btnConfirmarEliminar.addEventListener('click', async () => {
    if (!editandoId) return;

    try {
        const respuesta = await fetch(`/direcciones/${editandoId}`, {
            method: 'DELETE'
        });

        if (respuesta.ok) {
            modalEliminar.style.display = 'none'; // Cerramos el modal de advertencia
            overlay.style.display = 'none';       // Cerramos también el formulario de edición
            editandoId = null;
            obtenerDireccionesDeBD();             // Recargamos la lista visualmente
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
});

function renderizarDirecciones(lista) {
    const contenedor = document.getElementById('grid-direcciones');
    const estadoVacio = document.querySelector('.caja-vacia');

    // Si no hay direcciones, mostramos el mensaje de "No se agregaron..."
    if (lista.length === 0) {
        estadoVacio.style.display = 'flex';
        contenedor.style.display = 'none';
        return;
    }

    // Si hay direcciones, ocultamos el mensaje vacío y preparamos el grid
    estadoVacio.style.display = 'none';
    contenedor.style.display = 'grid';
    contenedor.innerHTML = ''; // Limpiar previo

    // Ordenar para que la predeterminada salga primero
    lista.sort((a, b) => b.esPredeterminada - a.esPredeterminada);

    lista.forEach(dir => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-direccion'; // Esta clase debe tener el :hover gris en tu CSS

        tarjeta.innerHTML = `
            <div class="contenido-tarjeta">
                <span class="etiqueta-superior">${dir.esPredeterminada ? 'Dirección predeterminada' : ('')}</span>
                
                <button class="btn-editar-lapiz" onclick="abrirEdicion('${dir._id}')">
                    <i class="bi bi-pencil"></i>
                </button>

                <div class="linea-principal">${dir.esPredeterminada ? (dir.calle) : dir.calle}</div>
                <div class="linea-secundaria">${dir.esPredeterminada ? dir.referencia : (dir.referencia || '')}</div>
                
                <div class="datos-localidad">${dir.codigoPostal} ${dir.ciudad}, ${dir.estado}</div>
                <div class="pais">México</div>
                <div class="tel">Tel: ${dir.telefono}</div>

            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}