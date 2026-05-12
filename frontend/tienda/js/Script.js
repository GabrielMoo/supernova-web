/* ==========================================================================
   1. ELEMENTOS DEL DOM Y ESTADO GLOBAL
   ========================================================================== */

// -- Barra de Búsqueda --
const header = document.getElementById('header');
const openSearchBtn = document.getElementById('buscarBtn');
const closeSearchBtn = document.getElementById('cerrarBusquedaBtn');
const searchInput = document.getElementById('inputBuscar');

// -- Catálogo y Filtros --
const contenedor = document.getElementById('contenedor-productos');
const botonesFiltro = document.querySelectorAll('.btn-filtro');

// -- Vista de Detalle (PDP) --
const botonesCorte = document.querySelectorAll('.btn-corte');
const botonesTalla = document.querySelectorAll('.btn-talla');
const btnCerrarDetalle = document.getElementById('cerrar-detalle');
const btnAddCarrito = document.getElementById('pdp-add-carrito');

// -- Carrito --
const panelCarrito = document.getElementById('panel-carrito');
const overlayCarrito = document.getElementById('overlay-carrito');
const btnCerrarCarrito = document.getElementById('cerrar-carrito');
const listaCarritoUI = document.getElementById('lista-carrito');
const totalCarritoUI = document.getElementById('suma-total-carrito');

// -- Modales --
const modalAuth = document.getElementById('modal-auth');
const btnCerrarModalAuth = document.getElementById('btn-cerrar-modal');
const modalCarritoVacio = document.getElementById('modal-carrito-vacio');
const btnCerrarModalVacio = document.getElementById('btn-cerrar-modal-vacio');

// -- Variables de Estado Global --
let productosGlobales = [];
let productoSeleccionado = null;
let precioLegible = null;
let corteSeleccionado = null;
let tallaSeleccionada = null;
let stockActualDelProducto = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];


/* ==========================================================================
   2. FUNCIONES DE API / BACKEND
   ========================================================================== */

async function obtenerProductos(categoria = 'todos') {
    try {
        const url = categoria === 'todos'
            ? '/api/playeras/obtener-playeras'
            : `/api/playeras/obtener-playeras/${categoria}`;

        const res = await fetch(url);
        const productos = await res.json();
        productosGlobales = productos;
        renderizarProductos(productos);
    } catch (error) {
        contenedor.innerHTML = '<p>Error al conectar con la tienda.</p>';
    }
}

async function agregarAlCarrito(producto) {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));

    if (!usuario) {
        modalAuth.style.display = 'flex';
        return;
    }

    const infoStock = producto.stock.find(s => s.corte === corteSeleccionado && s.talla === tallaSeleccionada);

    if (!infoStock) {
        alert("Lo sentimos, esta combinación no está disponible.");
        return;
    }

    try {
        const res = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: usuario.id,
                stockId: infoStock._id,
                cantidad: 1
            })
        });

        if (res.ok) {
            actualizarCarrito();
        }
    } catch (error) {
        console.error("Error al guardar en BD:", error);
    }
}

async function actualizarCarrito() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (!usuario) return;

    listaCarritoUI.innerHTML = '';

    try {
        const res = await fetch(`/api/carrito/${usuario.id}`);
        const items = await res.json();

        let total = 0;
        if (items.length === 0) {
            listaCarritoUI.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío.</p>';
            totalCarritoUI.innerText = '$0';
            return;
        }

        items.forEach(item => {
            const playera = item.stock.playera;
            const precio = parseFloat(playera.precio.$numberDecimal || playera.precio);
            total += (precio * item.cantidad);

            const div = document.createElement('div');
            // Mantenemos la clase 'item-carrito' pero añadimos la nueva para el diseño
            div.classList.add('item-carrito', 'card-item-carrito');

            div.innerHTML = `
        <img src="${playera.imagen_enlace}" alt="${playera.nombre}" class="foto-item-carrito">
        <div class="info-item-carrito">
            <div class="titulo-precio-fila">
                <h4>${playera.nombre}</h4>
                <p class="precio-item-v2">$${precio.toFixed(2)} c/u</p>
            </div>
            <p class="variante-info">${item.stock.corte} / ${item.stock.talla}</p>
            <div class="controles-cantidad v2"> <button class="btn-cantidad" onclick="cambiarCantidad('${item._id}', ${item.cantidad - 1}, ${item.stock.cantidad})">-</button>
                <span class="numero-cantidad">${item.cantidad}</span>
                <button class="btn-cantidad" onclick="cambiarCantidad('${item._id}', ${item.cantidad + 1}, ${item.stock.cantidad})">+</button>
            </div>
            <button class="btn-eliminar-item v2" onclick="eliminarItem('${item._id}')">Eliminar</button> 
        </div>
    `;
            listaCarritoUI.appendChild(div);
        });

        totalCarritoUI.innerText = `$${total.toFixed(2)}`;
    } catch (error) {
        console.error("Error al cargar carrito:", error);
    }
}

// DELEGACIÓN DE EVENTOS: Escuchamos los clics en toda la página
document.addEventListener('click', (e) => {

    // Verificamos si el clic ocurrió DENTRO del botón del carrito del navbar
    // Usamos closest() por si el usuario le da clic exactamente al icono <i>
    const btnAbrirCarritoNav = e.target.closest('#btn-abrir-carrito-nav');

    if (btnAbrirCarritoNav) {
        e.preventDefault(); // Evita que la página salte

        const panelCarrito = document.getElementById('panel-carrito');
        const overlayCarrito = document.getElementById('overlay-carrito');

        if (panelCarrito && overlayCarrito) {
            // Abrimos el panel
            panelCarrito.classList.add('panel-activo');

            // Mostramos el fondo oscuro
            overlayCarrito.classList.remove('overlay-oculto');
            overlayCarrito.classList.add('overlay-activo');

            // Opcional: Si tienes tu función de actualizar carrito, descomenta esto
            // if (typeof actualizarCarrito === 'function') actualizarCarrito();
        } else {
            console.error("No se encontraron los elementos del carrito en el HTML.");
        }
    }
});
// Globales porque se inyectan como onclick en el HTML renderizado
window.eliminarItem = async function (itemId) {
    try {
        await fetch(`/api/carrito/eliminar/${itemId}`, { method: 'DELETE' });
        actualizarCarrito();
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
};

window.cambiarCantidad = async function (itemId, nuevaCantidad, stockDisponible) {
    if (nuevaCantidad < 1) return;

    if (nuevaCantidad > stockDisponible) {
        alert(`¡Lo sentimos! Solo tenemos ${stockDisponible} unidades de esta talla y corte en stock.`);
        return;
    }

    try {
        const res = await fetch(`/api/carrito/actualizar/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevaCantidad: nuevaCantidad })
        });

        const data = await res.json();
        if (data.exito) {
            actualizarCarrito();
        } else {
            alert(data.mensaje);
        }
    } catch (error) {
        console.error("Error al actualizar la cantidad:", error);
    }
};


/* ==========================================================================
   3. FUNCIONES DE UI Y RENDERIZADO
   ========================================================================== */

function renderizarProductos(lista) {
    contenedor.innerHTML = '';

    lista.forEach(p => {
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta');
        tarjeta.dataset.id = p._id;

        precioLegible = p.precio.$numberDecimal || p.precio;
        let colorCss = p.color === 'Blanco' ? '#ffffff' : (p.color === 'Negro' ? '#000000' : '#ccc');

        tarjeta.innerHTML = `
            <img src="${p.imagen_enlace}" alt="${p.nombre}" class="foto-grid">
            <h3>${p.nombre}</h3>
            <div class="contenedor-colores">
                <p class="color">Color: </p>
                <div class="circulo-color" style="background-color: ${colorCss};" title="${p.color}"></div>
            </div>
            <div class="contenedor-precio">
                <p class="precio">$${precioLegible}</p>
            </div>
        `;
        tarjeta.addEventListener('click', manejarClicEnProducto);
        contenedor.appendChild(tarjeta);
    });
}

async function manejarClicEnProducto(e) {
    const target = e.currentTarget;
    const imagenClickeada = target.querySelector('.foto-grid');
    const id = target.dataset.id;
    const producto = productosGlobales.find(p => p._id === id);

    if (!producto) return;

    if (!document.startViewTransition) {
        mostrarDetalle(producto);
        return;
    }

    imagenClickeada.style.viewTransitionName = 'producto-activo';
    const transition = document.startViewTransition(() => {
        mostrarDetalle(producto);
        imagenClickeada.style.viewTransitionName = '';
    });
}

function mostrarDetalle(producto) {
    productoSeleccionado = producto;
    precioLegible = producto.precio.$numberDecimal || producto.precio;

    document.getElementById('pdp-imagen').src = producto.imagen_enlace;
    document.getElementById('pdp-nombre').innerText = producto.nombre;
    document.getElementById('pdp-precio').innerText = precioLegible;
    document.getElementById('pdp-descripcion').innerText = producto.descripcion || "Whether you're closing deals or attending formal events, its breathable lining and natural stretch keep you comfortable and sharp from day to night.";

    if (producto.stock) {
        cargarStockEnVistaDetalle(producto.stock);
    }

    document.getElementById('vista-detalle-producto').classList.add('vista-activa');
    document.body.style.overflow = 'hidden';
}

function cargarStockEnVistaDetalle(stock) {
    stockActualDelProducto = stock;

    const cortesDisponibles = ['Regular', 'Oversize'].filter(tipoCorte => {
        return stock.some(item => item.corte === tipoCorte && item.cantidad > 0);
    });

    botonesCorte.forEach(btn => {
        const nombreCorte = btn.getAttribute('data-corte');
        if (cortesDisponibles.includes(nombreCorte)) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
            btn.classList.remove('activa');
        }
    });

    if (cortesDisponibles.length > 0) {
        seleccionarCorte(cortesDisponibles[0]);
    } else {
        botonesTalla.forEach(btn => btn.disabled = true);
        corteSeleccionado = null;
        tallaSeleccionada = null;
    }
}

function seleccionarCorte(nombreCorte) {
    corteSeleccionado = nombreCorte;

    botonesCorte.forEach(btn => {
        if (btn.getAttribute('data-corte') === nombreCorte) {
            btn.classList.add('activa');
        } else {
            btn.classList.remove('activa');
        }
    });

    const stockDeEsteCorte = stockActualDelProducto.filter(item => item.corte === nombreCorte);
    let primeraTallaDisponible = null;

    botonesTalla.forEach(btn => {
        const nombreTalla = btn.getAttribute('data-talla');
        const infoTalla = stockDeEsteCorte.find(item => item.talla === nombreTalla);

        if (infoTalla && infoTalla.cantidad > 0) {
            btn.disabled = false;
            if (!primeraTallaDisponible) primeraTallaDisponible = nombreTalla;
        } else {
            btn.disabled = true;
            btn.classList.remove('activa');
        }
    });

    if (primeraTallaDisponible) {
        seleccionarTalla(primeraTallaDisponible);
    } else {
        tallaSeleccionada = null;
    }
}

function seleccionarTalla(nombreTalla) {
    tallaSeleccionada = nombreTalla;
    botonesTalla.forEach(btn => {
        if (btn.getAttribute('data-talla') === nombreTalla && !btn.disabled) {
            btn.classList.add('activa');
        } else {
            btn.classList.remove('activa');
        }
    });
}

function toggleCarrito() {
    panelCarrito.classList.toggle('abierto');
    overlayCarrito.classList.toggle('activo');

    // Comprobamos si el carrito acaba de abrirse o cerrarse
    if (panelCarrito.classList.contains('abierto')) {
        // Bloqueamos el scroll de la página principal
        document.body.style.overflow = 'hidden';
    } else {
        // Restauramos el scroll cuando se cierra
        document.body.style.overflow = '';
    }
}


/* ==========================================================================
   4. EVENT LISTENERS E INICIALIZACIÓN
   ========================================================================== */

// Búsqueda
openSearchBtn?.addEventListener('click', () => {
    header.classList.add('busqueda-activa');
    setTimeout(() => searchInput.focus(), 400);
});

closeSearchBtn?.addEventListener('click', () => {
    header.classList.remove('busqueda-activa');
    setTimeout(() => searchInput.value = '', 400);
});

// Modal de Autenticación
btnCerrarModalAuth?.addEventListener('click', () => {
    modalAuth.style.display = 'none';
});

// Cerrar Modal de Carrito Vacío
btnCerrarModalVacio?.addEventListener('click', () => {
    modalCarritoVacio.style.display = 'none';
});

// Botones de Filtro
botonesFiltro.forEach(boton => {
    boton.addEventListener('click', (e) => {
        botonesFiltro.forEach(b => b.classList.remove('activo'));
        const botonClickeado = e.currentTarget;
        botonClickeado.classList.add('activo');
        const cat = botonClickeado.dataset.categoria;
        obtenerProductos(cat);
    });
});

// Opciones de Producto en PDP (Corte y Talla)
botonesCorte.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!btn.disabled) seleccionarCorte(btn.getAttribute('data-corte'));
    });
});

botonesTalla.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!btn.disabled) seleccionarTalla(btn.getAttribute('data-talla'));
    });
});

// Cerrar Detalle con View Transitions
btnCerrarDetalle.addEventListener('click', async () => {
    document.body.style.overflow = 'auto';

    if (!document.startViewTransition) {
        document.getElementById('vista-detalle-producto').classList.remove('vista-activa');
        return;
    }

    const idActual = productoSeleccionado._id;
    const tarjetaOriginal = document.querySelector(`.tarjeta[data-id="${idActual}"]`);
    const imagenGrid = tarjetaOriginal ? tarjetaOriginal.querySelector('img') : null;

    const transition = document.startViewTransition(() => {
        document.getElementById('vista-detalle-producto').classList.remove('vista-activa');
        if (imagenGrid) imagenGrid.style.viewTransitionName = 'producto-activo';
    });

    await transition.finished;
    if (imagenGrid) imagenGrid.style.viewTransitionName = '';
});

// Eventos del Carrito
btnCerrarCarrito.addEventListener('click', toggleCarrito);
overlayCarrito.addEventListener('click', toggleCarrito);

btnAddCarrito.addEventListener('click', () => {
    if (productoSeleccionado) {
        agregarAlCarrito(productoSeleccionado);
        toggleCarrito();
    }
});

// Dentro de tus event listeners globales
const btnComprar = document.getElementById('btn-comprar');
if (btnComprar) {
    btnComprar.addEventListener('click', () => {
        // Verificamos si el carrito tiene algo antes de ir a pagos
        const total = document.getElementById('suma-total-carrito').innerText;
        if (total === '$0' || total === '$0.00') {
            modalCarritoVacio.style.display = 'flex';
            return;
        }
        window.location.href = 'pagos.html';
    });
}

// --- ABRIR CARRITO DESDE EL NAVBAR ---
document.addEventListener('click', (e) => {
    // Buscamos si el usuario hizo clic en el icono o en el enlace original del Navbar
    // (Buscamos tanto el href original como el id por si lo llegaste a cambiar)
    const btnCarritoNav = e.target.closest('a[href="#Carrito"], #btn-abrir-carrito-nav');

    if (btnCarritoNav) {
        e.preventDefault(); // Evitamos que la página brinque hacia arriba

        // ¡Llamamos a tu propia función que ya hace la magia!
        if (typeof toggleCarrito === 'function') {
            toggleCarrito();
        }
    }
});

// --- BÚSQUEDA FUNCIONAL CON AUTOCOMPLETADO ---

// 1. Crear el contenedor de sugerencias y añadirlo al body
const contenedorSugerencias = document.createElement('div');
contenedorSugerencias.id = 'contenedor-sugerencias';
document.body.appendChild(contenedorSugerencias);

// 2. Escuchar lo que el usuario escribe
searchInput?.addEventListener('input', (e) => {
    const textoBuscado = e.target.value.toLowerCase().trim();
    contenedorSugerencias.innerHTML = ''; // Limpiar resultados anteriores

    // Si no hay texto, ocultar sugerencias
    if (textoBuscado.length === 0) {
        contenedorSugerencias.style.display = 'none';
        return;
    }

    // Filtrar los productos globales que coincidan con la búsqueda
    const coincidencias = productosGlobales.filter(producto => 
        producto.nombre.toLowerCase().includes(textoBuscado)
    );

    // Si hay coincidencias, renderizarlas
    if (coincidencias.length > 0) {
        coincidencias.forEach(producto => {
            const item = document.createElement('div');
            item.classList.add('sugerencia-item');
            item.innerHTML = `
                <img src="${producto.imagen_enlace}" alt="${producto.nombre}" class="sugerencia-img">
                <span class="sugerencia-texto">${producto.nombre}</span>
            `;
            
            // Evento al hacer clic en una sugerencia
            item.addEventListener('click', () => {
                mostrarDetalle(producto); // Abre tu modal PDP existente
                
                // Limpiar y cerrar la barra de búsqueda
                searchInput.value = '';
                contenedorSugerencias.style.display = 'none';
                header.classList.remove('busqueda-activa');
            });
            
            contenedorSugerencias.appendChild(item);
        });

        // Calcular la posición exacta debajo del input y mostrar el contenedor
        const rect = searchInput.getBoundingClientRect();
        contenedorSugerencias.style.top = `${rect.bottom + window.scrollY + 15}px`;
        contenedorSugerencias.style.left = `${rect.left + window.scrollX}px`;
        contenedorSugerencias.style.width = `${searchInput.offsetWidth}px`;
        contenedorSugerencias.style.display = 'block';
    } else {
        // Mensaje opcional de "No hay resultados"
        contenedorSugerencias.innerHTML = `<div class="sugerencia-item">No se encontraron coincidencias...</div>`;
        const rect = searchInput.getBoundingClientRect();
        contenedorSugerencias.style.top = `${rect.bottom + window.scrollY + 15}px`;
        contenedorSugerencias.style.left = `${rect.left + window.scrollX}px`;
        contenedorSugerencias.style.width = `${searchInput.offsetWidth}px`;
        contenedorSugerencias.style.display = 'block';
    }
});

// 3. Ocultar el menú de sugerencias si se hace clic fuera
document.addEventListener('click', (e) => {
    if (e.target !== searchInput && !contenedorSugerencias.contains(e.target)) {
        contenedorSugerencias.style.display = 'none';
    }
});

// 4. (Opcional) Asegurar que se oculta si se presiona el botón de cerrar búsqueda
closeSearchBtn?.addEventListener('click', () => {
    contenedorSugerencias.style.display = 'none';
});

// --- INICIALIZACIÓN AL CARGAR LA PÁGINA ---
obtenerProductos();
actualizarCarrito();