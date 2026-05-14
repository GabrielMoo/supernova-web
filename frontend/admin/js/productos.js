// --- 1. LÓGICA DE NAVEGACIÓN Y LIMPIEZA DE FORMULARIO ---
const vistaProductos = document.getElementById('vista-productos');
const vistaAgregarProducto = document.getElementById('vista-agregar-producto');
const btnMostrarFormulario = document.getElementById('btn-mostrar-formulario');
const btnCancelar = document.getElementById('btn-cancelar');
const formulario = document.getElementById('formulario-producto');

// Función para ir al formulario
btnMostrarFormulario.addEventListener('click', () => {
    vistaProductos.style.display = 'none';
    vistaAgregarProducto.style.display = 'block';
});

// Función para cancelar (Regresa a la tabla y limpia todo lo escrito)
function cancelarYVolver(e) {
    if (e) e.preventDefault();
    vistaAgregarProducto.style.display = 'none';
    vistaProductos.style.display = 'block';
    formulario.reset(); // <-- Esta línea borra todo lo que se haya escrito
}

btnCancelar.addEventListener('click', cancelarYVolver);


// --- 2. LÓGICA ORIGINAL DE LA TABLA (Mantenida intacta) ---
let dataBase = [];
let currentPage = 1;
const rowsPerPage = 5;
let totalPages = 1;
let productoEditando = null;

async function cargarProductos() {
    try {

        const response = await fetch('/api/playeras/obtener-playeras');
        const productos = await response.json();

        dataBase = productos.map((producto, index) => {

            // Sumamos todo el stock de todas las tallas
            const stockTotal = producto.stock.reduce((total, item) => {
                return total + item.cantidad;
            }, 0);

            return {
                id: producto._id,
                numero: index + 1,

                nombre: producto.nombre,
                descripcion: producto.descripcion,
                categoria: producto.categoria,
                color: producto.color,
                imagen: producto.imagen_enlace,

                precio: parseFloat(producto.precio.$numberDecimal),

                stock: producto.stock
            };
        });

        totalPages = Math.ceil(dataBase.length / rowsPerPage);

        updateUI();

    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

cargarProductos();

const tableBody = document.getElementById("contenido-tabla");
const pageNumbersContainer = document.getElementById("page-numbers");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");

function renderTable(page) {
    tableBody.innerHTML = "";
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = dataBase.slice(start, end);

    paginatedItems.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${item.numero}</td>
                    <td>${item.nombre}</td>
                    <td>${item.categoria}</td>
                    <td>$${item.precio}</td>
                    <td>
                        ${item.stock.map(s => {

            const bajoStock = s.cantidad <= 3;

            return `
                                <div style="margin-bottom: 4px; 
                                            color: ${bajoStock ? 'red' : 'inherit'};">
                                    ${s.corte} ${s.talla}: ${s.cantidad}
                                </div>
                            `;
        }).join('')}
                    </td>
                    <td class="action-icons">
                        <i class="bi bi-pen btn-editar" data-id="${item.id}"></i>
                        <i class="bi bi-trash3 btn-eliminar" data-id="${item.id}"></i>
                    </td>
                `;

        tr.addEventListener("click", () => {
            document.querySelectorAll("tr.selected").forEach(el => el.classList.remove("selected"));
            tr.classList.toggle("selected");
        });

        tableBody.appendChild(tr);

        const btnEliminar = tr.querySelector('.btn-eliminar');

        // Variables para guardar el ID del producto a eliminar
        let productoAEliminarId = null;

        btnEliminar.addEventListener('click', (e) => {
            e.stopPropagation();
            productoAEliminarId = item.id;
            mostrarModalEliminar();
        });

        // Función para mostrar el modal
        function mostrarModalEliminar() {
            const modal = document.getElementById('modal-eliminar-playera');
            if (modal) modal.style.display = 'flex';
        }

        // Función para ocultar el modal
        function ocultarModalEliminar() {
            const modal = document.getElementById('modal-eliminar-playera');
            if (modal) modal.style.display = 'none';
        }

        // Escuchar el botón "Eliminar" del modal
        const btnConfirmarEliminarModal = document.getElementById('btn-confirmar-eliminar');
        if (btnConfirmarEliminarModal) {
            btnConfirmarEliminarModal.addEventListener('click', async () => {
                if (!productoAEliminarId) return;

                try {
                    const response = await fetch(`/api/playeras/eliminar-playera/${productoAEliminarId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await cargarProductos(); // Recarga la tabla
                        ocultarModalEliminar();
                        productoAEliminarId = null;
                        // Opcional: mostrar un modal de éxito
                    } else {
                        alert("No se pudo eliminar");
                        ocultarModalEliminar();
                    }
                } catch (error) {
                    console.error(error);
                    alert("Error del servidor");
                    ocultarModalEliminar();
                }
            });
        }

        // Escuchar el botón "Cancelar" del modal
        const btnCancelarEliminarModal = document.getElementById('btn-cancelar-eliminar');
        if (btnCancelarEliminarModal) {
            btnCancelarEliminarModal.addEventListener('click', () => {
                ocultarModalEliminar();
                productoAEliminarId = null;
            });
        }

        const btnEditar = tr.querySelector('.btn-editar');

        btnEditar.addEventListener('click', (e) => {

            e.stopPropagation();

            productoEditando = item;

            // Mostrar formulario
            vistaProductos.style.display = 'none';
            vistaAgregarProducto.style.display = 'block';

            // Rellenar campos
            document.getElementById('nombre').value = item.nombre;
            document.getElementById('descripcion').value = item.descripcion;
            document.getElementById('precio').value = item.precio;

            document.getElementById('categoria').value = item.categoria;
            document.getElementById('color').value = item.color;

            if (item.imagen) {

                vistaPrevia.src = item.imagen;
                vistaPrevia.style.display = 'block';
                contenidoSubida.style.display = 'none';

            }

            document.querySelectorAll('.check-corte').forEach(check => {
                check.checked = false;
            });

            document.querySelectorAll('.lista-tallas').forEach(lista => {
                lista.style.display = 'none';
            });

            document.querySelectorAll('.check-talla').forEach(check => {
                check.checked = false;
            });

            document.querySelectorAll('.input-cantidad').forEach(input => {
                input.value = '';
                input.style.display = 'none';
            });

            // =========================
            // CARGAR STOCK REAL
            // =========================

            item.stock.forEach(stockItem => {

                const corte = stockItem.corte;
                const talla = stockItem.talla;
                const cantidad = stockItem.cantidad;

                const esRegular = corte === 'Regular';

                const idContenedor = esRegular
                    ? 'tallas-regular'
                    : 'tallas-oversize';

                const contenedor = document.getElementById(idContenedor);

                contenedor.style.display = 'flex';

                if (esRegular) {
                    document.getElementById('corte-regular').checked = true;
                } else {
                    document.getElementById('corte-oversize').checked = true;
                }

                const checkTalla = contenedor.querySelector(
                    `.check-talla[value="${talla}"]`
                );

                if (checkTalla) {

                    checkTalla.checked = true;

                    const inputCantidad =
                        checkTalla.parentElement.querySelector('.input-cantidad');

                    inputCantidad.style.display = 'block';

                    inputCantidad.value = cantidad;
                }

            });
            // Cambiar texto del botón
            btnPublicar.textContent = 'Guardar Cambios';

        });
    });
}

function renderPagination() {
    pageNumbersContainer.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.classList.add("btn-page");
        if (i === currentPage) btn.classList.add("active");
        btn.innerText = i;

        btn.addEventListener("click", () => {
            currentPage = i;
            updateUI();
        });

        pageNumbersContainer.appendChild(btn);
    }
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
}

function updateUI() {
    renderTable(currentPage);
    renderPagination();
}

btnPrev.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updateUI();
    }
});

btnNext.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        updateUI();
    }
});


// --- LÓGICA DE STOCK (CORTES Y TALLAS) ---

// 1. Mostrar/Ocultar lista de tallas al seleccionar un Corte
const checksCorte = document.querySelectorAll('.check-corte');

checksCorte.forEach(check => {
    check.addEventListener('change', (e) => {
        const targetId = e.target.getAttribute('data-target');
        const listaTallas = document.getElementById(targetId);

        if (e.target.checked) {
            listaTallas.style.display = 'flex';
        } else {
            listaTallas.style.display = 'none';
            // Si desmarca el corte, limpiamos y ocultamos todo lo de adentro
            const inputsTalla = listaTallas.querySelectorAll('.check-talla');
            inputsTalla.forEach(talla => {
                talla.checked = false;
                const inputCant = talla.parentElement.querySelector('.input-cantidad');
                inputCant.style.display = 'none';
                inputCant.value = '';
            });
        }
    });
});

// 2. Mostrar/Ocultar input de cantidad al seleccionar una Talla
const checksTalla = document.querySelectorAll('.check-talla');

checksTalla.forEach(check => {
    check.addEventListener('change', (e) => {
        const inputCant = e.target.parentElement.querySelector('.input-cantidad');
        if (e.target.checked) {
            inputCant.style.display = 'block';
            inputCant.focus(); // Autoselecciona el input para escribir rápido
        } else {
            inputCant.style.display = 'none';
            inputCant.value = '';
        }
    });
});

// 3. FUNCIÓN EXTRA: Cómo extraer los datos para tu Mongoose Schema
// Llama a esta función cuando presiones el botón "Publicar"
function recolectarStock() {
    let arrayStock = [];
    const tallasSeleccionadas = document.querySelectorAll('.check-talla:checked');

    tallasSeleccionadas.forEach(talla => {
        const inputCant = talla.parentElement.querySelector('.input-cantidad');
        const cantidad = parseInt(inputCant.value);

        // Solo agrega si hay una cantidad válida (mayor o igual a 0)
        if (!isNaN(cantidad) && cantidad >= 0) {
            arrayStock.push({
                corte: talla.getAttribute('data-corte'), // 'Regular' o 'Oversize'
                talla: talla.value, // 'S', 'M', 'L', 'XL'
                cantidad: cantidad // Número entero
            });
        }
    });

    console.log("Datos listos para enviar al backend:", arrayStock);
    return arrayStock;
}

// --- ENVIAR DATOS AL SERVIDOR ---

// 1. Seleccionamos el botón
const btnPublicar = document.querySelector('.btn-publicar');

btnPublicar.addEventListener('click', async (e) => {
    e.preventDefault(); // Evita que la página intente recargarse

    // 2. Recolectar datos de texto
    const nombre = document.getElementById('nombre').value;
    const descripcion = document.getElementById('descripcion').value;
    const precio = document.getElementById('precio').value;

    // --> LOS CAMPOS NUEVOS <--
    const categoria = document.getElementById('categoria').value;
    const color = document.getElementById('color').value;

    // 3. Recolectar la imagen
    const inputImagen = document.getElementById('imagen-producto');
    const archivoImagen = inputImagen.files[0]; // Tomamos el primer archivo seleccionado

    // 4. Recolectar el stock (usando la función que ya hicimos)
    const stockData = recolectarStock();

    // Pequeña validación para evitar enviar cosas vacías (Actualizada)
    if (!nombre || !precio || stockData.length === 0 || !categoria || !color) {
        alert("Por favor: llena todos los campos, elige categoría y color, sube una imagen y agrega al menos una talla en stock.");
        return;
    }

    // 5. Empaquetar todo en FormData (¡El formato mágico para enviar archivos!)
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);

    // --> AGREGAMOS LOS NUEVOS AL PAQUETE <--
    formData.append('categoria', categoria);
    formData.append('color', color);

    // Convertimos el arreglo de stock a texto para que pueda viajar por internet
    formData.append('stocks', JSON.stringify(stockData));

    // Agregamos el archivo real de la imagen
    formData.append('imagen', archivoImagen);

    // EXTRA: Tu backend (validacionRol.js) exige que seas 'admin' para guardar. 
    // Por ahora, se lo enviamos directamente para pasar la seguridad.
    formData.append('rol', 'admin');

    try {

        console.log("Empaquetado listo. Intentando enviar al servidor...");

        let response;

        // =========================
        // EDITAR PRODUCTO
        // =========================

        if (productoEditando) {

            console.log("EDITANDO PRODUCTO");

            response = await fetch(
                `/api/playeras/editar-playera/${productoEditando.id}`,
                {
                    method: 'PUT',
                    body: formData
                }
            );

        }

        // =========================
        // CREAR PRODUCTO
        // =========================

        else {

            console.log("CREANDO PRODUCTO");

            response = await fetch(
                '/api/playeras/registro-playera',
                {
                    method: 'POST',
                    body: formData
                }
            );

        }

        const data = await response.json();

        if (response.ok) {

            // BORRAMOS EL ALERT FEO: alert("¡Éxito!...");
            // Y mostramos nuestro modal hermoso:
            document.getElementById('modal-exito').style.display = 'flex';

            await cargarProductos();

            productoEditando = null;

            btnPublicar.textContent = 'Publicar Producto';

        } else {

            alert("Respuesta del servidor: " + (data.mensaje || "Error desconocido"));

        }

    } catch (error) {

        console.error("Error de conexión:", error);

        alert("No se pudo conectar con el servidor. ¿Está encendido?");

    }
});

// Seleccionamos los elementos del DOM
const inputImagen = document.getElementById('imagen-producto');
const vistaPrevia = document.getElementById('image-preview');
const contenidoSubida = document.getElementById('upload-content');

// Escuchamos cuando el usuario selecciona un archivo
inputImagen.addEventListener('change', function (event) {
    // Obtenemos el primer archivo seleccionado
    const archivo = event.target.files[0];

    if (archivo) {
        // Creamos una URL temporal para leer la imagen en el navegador
        const urlImagen = URL.createObjectURL(archivo);

        // Asignamos la URL a la etiqueta img
        vistaPrevia.src = urlImagen;

        // Ocultamos el texto/icono y mostramos la imagen
        contenidoSubida.style.display = 'none';
        vistaPrevia.style.display = 'block';
    } else {
        // Si el usuario cancela la selección, volvemos al estado inicial
        vistaPrevia.src = '';
        vistaPrevia.style.display = 'none';
        contenidoSubida.style.display = 'flex';
    }
});

function resetearFormularioYVista() {
    // 1. Limpiar el formulario (esto limpia nombre, descripción, precio y selects)
    formulario.reset();

    // 2. Limpiar la vista previa de la imagen
    // Usamos las variables que ya tienes definidas arriba en tu archivo
    if (vistaPrevia && contenidoSubida) {
        vistaPrevia.src = '';
        vistaPrevia.style.display = 'none';
        contenidoSubida.style.display = 'flex';
    }

    // 3. Limpiar manualmente los inputs de cantidad del stock
    const inputsCantidad = document.querySelectorAll('.input-cantidad');
    inputsCantidad.forEach(input => {
        input.value = '';
        input.style.display = 'none';
    });

    // 4. Cambiar la vista usando TUS variables reales
    // Esto es lo que estaba fallando
    vistaAgregarProducto.style.display = 'none';
    vistaProductos.style.display = 'block';

    console.log("Vista restablecida y formulario limpio");
}

document.getElementById('btn-modal-ok').addEventListener('click', () => {
    // 1. Ocultamos el modal
    document.getElementById('modal-exito').style.display = 'none';

    // 2. Disparamos la limpieza y el cambio de vista
    resetearFormularioYVista();
});