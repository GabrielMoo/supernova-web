const tableBody = document.getElementById('contenido-pedidos');
const pageNumbersContainer = document.getElementById('page-numbers');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// Variables de paginación
let pedidosGlobal = [];       // todos los pedidos sin paginar
let currentPage = 1;
const rowsPerPage = 5;        // mismo número que en productos
let totalPages = 1;

// Cargar pedidos desde el servidor
async function cargarPedidos() {
    try {
        const response = await fetch('/api/pedidos/admin/todos');
        const pedidos = await response.json();
        pedidosGlobal = pedidos;
        totalPages = Math.ceil(pedidosGlobal.length / rowsPerPage);
        updateUI();
    } catch (error) {
        console.error("Error cargando pedidos:", error);
    }
}

// Renderizar solo la página actual
function renderPedidos(page) {
    tableBody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pedidosPagina = pedidosGlobal.slice(start, end);

    pedidosPagina.forEach((pedido, index) => {
        // Cálculo del número global en lugar del index local
        const numeroGlobal = start + index + 1;

        const itemsTexto = pedido.items?.length
            ? pedido.items.map(item => {
                const snapshot = item.productoSnapshot;
                return `${snapshot.nombre} (${snapshot.corte} ${snapshot.talla}) x${item.cantidad}`;
            }).join('<br>')
            : 'Sin items';

        const direccion = pedido.direccionEnvio
            ? `${pedido.direccionEnvio.calle}, ${pedido.direccionEnvio.ciudad} CP ${pedido.direccionEnvio.codigoPostal}, ${pedido.direccionEnvio.estado}, Tel: ${pedido.direccionEnvio.telefono}`
            : 'Sin dirección';

        const fecha = new Date(pedido.createdAt).toLocaleDateString();
        const usuario = pedido.usuario?.nombre || 'Usuario';

        let colorEstado = '#999';
        if (pedido.estado === 'Pendiente') colorEstado = 'orange';
        if (pedido.estado === 'En preparacion') colorEstado = '#3498db';
        if (pedido.estado === 'Enviado') colorEstado = 'purple';
        if (pedido.estado === 'Completado') colorEstado = 'green';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${numeroGlobal}</td>
            <td>${usuario}</td>
            <td>${fecha}</td>
            <td>${direccion}</td>
            <td>${itemsTexto}</td>
            <td>$${parseFloat(pedido.total.$numberDecimal).toFixed(2)}</td>
            <td>
                <select class="select-estado" data-id="${pedido._id}" style="
                    padding: 8px;
                    border-radius: 10px;
                    border: none;
                    color: white;
                    background: ${colorEstado};
                    font-weight: bold;
                    cursor: pointer;
                ">
                    <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En preparacion" ${pedido.estado === 'En preparacion' ? 'selected' : ''}>En preparación</option>
                    <option value="Enviado" ${pedido.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Completado" ${pedido.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                </select>
            </td>
        `;
        tableBody.appendChild(tr);

        const selectEstado = tr.querySelector('.select-estado');
        selectEstado.addEventListener('change', async (e) => {
            const nuevoEstado = e.target.value;
            try {
                const response = await fetch(
                    `/api/pedidos/admin/estado/${pedido._id}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: nuevoEstado })
                    }
                );
                if (response.ok) {
                    await cargarPedidos(); // recarga y mantiene la página actual
                } else {
                    alert("No se pudo actualizar");
                }
            } catch (error) {
                console.error(error);
                alert("Error del servidor");
            }
        });
    });
}

// Renderizar los números de página y estado de los botones
function renderPagination() {
    pageNumbersContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.classList.add('btn-page');
        if (i === currentPage) btn.classList.add('active');
        btn.innerText = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            updateUI();
        });
        pageNumbersContainer.appendChild(btn);
    }
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
}

// Actualizar tabla y paginación
function updateUI() {
    renderPedidos(currentPage);
    renderPagination();
}

// Eventos de navegación
btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateUI();
    }
});

btnNext.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        updateUI();
    }
});

// Iniciar la carga
cargarPedidos();