document.addEventListener('DOMContentLoaded', () => {
    cargarTodo();
    setInterval(cargarTodo, 300000); // cada 5 min
});

let graficoDona;
let datosGlobalesVentas = {};
let pedidosGlobal = [];
let lineasChart = null;
let currentRange = 7; // días por defecto

async function cargarTodo() {
    try {
        const response = await fetch('/api/pedidos/admin/todos');
        if (!response.ok) throw new Error('Error al obtener pedidos');
        pedidosGlobal = await response.json();

        const { totalVentas, totalPedidos, pendientes, ventasDetalladas } = procesarPedidos(pedidosGlobal);
        datosGlobalesVentas = ventasDetalladas;

        actualizarKPIs(totalVentas, totalPedidos, pendientes);
        renderizarDona(ventasDetalladas);
        renderizarProximosEnvios(pedidosGlobal);
        await cargarAlertasInventario();

        actualizarLineas(currentRange);
        agregarControlesRangoYExportacion();

    } catch (error) {
        console.error('Error en dashboard:', error);
    }
}

function procesarPedidos(pedidos) {
    let totalVentas = 0;
    let totalPedidos = pedidos.length;
    let pendientes = 0;
    let ventasDetalladas = {};

    pedidos.forEach(pedido => {
        if (pedido.estado === 'Pendiente') pendientes++;

        const total = parseFloat(pedido.total?.$numberDecimal || pedido.total || 0);
        totalVentas += total;

        if (pedido.items && Array.isArray(pedido.items)) {
            pedido.items.forEach(item => {
                const nombre = item.productoSnapshot.nombre;
                const variante = `${item.productoSnapshot.corte} (${item.productoSnapshot.talla})`;
                const cant = item.cantidad;

                if (!ventasDetalladas[nombre]) {
                    ventasDetalladas[nombre] = { total: 0, detalles: {} };
                }
                ventasDetalladas[nombre].total += cant;
                if (!ventasDetalladas[nombre].detalles[variante]) {
                    ventasDetalladas[nombre].detalles[variante] = 0;
                }
                ventasDetalladas[nombre].detalles[variante] += cant;
            });
        }
    });

    return { totalVentas, totalPedidos, pendientes, ventasDetalladas };
}

function actualizarKPIs(totalVentas, totalPedidos, pendientes) {
    const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    document.getElementById('kpi-ventas').textContent = formatoMXN.format(totalVentas);
    document.getElementById('kpi-pedidos-totales').textContent = totalPedidos;
    document.getElementById('kpi-pendientes').textContent = `${pendientes} por enviar`;
}

// ---------- Gráfico de Dona ----------
function renderizarDona(datos, esDetalle = false) {
    const ctx = document.getElementById('grafico-dona').getContext('2d');
    const btnVolver = document.getElementById('btn-volver-dona');
    const titulo = document.getElementById('titulo-dona');

    if (graficoDona) graficoDona.destroy();

    const labels = Object.keys(datos);
    const valores = esDetalle ? Object.values(datos) : labels.map(l => datos[l].total);

    graficoDona = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: ['#e67e22', '#13213c', '#fca311', '#27ae60', '#8e44ad']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (evento, elementos) => {
                if (!esDetalle && elementos.length > 0) {
                    const indice = elementos[0].index;
                    const nombrePlayera = labels[indice];
                    titulo.innerText = `Ventas: ${nombrePlayera}`;
                    btnVolver.style.display = 'block';
                    renderizarDona(datosGlobalesVentas[nombrePlayera].detalles, true);
                }
            }
        }
    });

    btnVolver.onclick = () => {
        titulo.innerText = "Top Playeras Más Vendidas";
        btnVolver.style.display = 'none';
        renderizarDona(datosGlobalesVentas, false);
    };
}

// ---------- Gráfico de Líneas con rango dinámico ----------
function actualizarLineas(rangoDias) {
    if (!pedidosGlobal.length) return;

    const ctx = document.getElementById('grafico-lineas')?.getContext('2d');
    if (!ctx) return;

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const fechas = [];
    for (let i = rangoDias - 1; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setUTCDate(hoy.getUTCDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        const label = `${fecha.getUTCDate()}/${fecha.getUTCMonth() + 1}`;
        fechas.push({ fechaStr, label });
    }

    const ventasPorDia = new Map();
    fechas.forEach(f => ventasPorDia.set(f.fechaStr, 0));

    pedidosGlobal.forEach(pedido => {
        if (!pedido.createdAt) return;
        const fechaPedido = new Date(pedido.createdAt).toISOString().split('T')[0];
        if (ventasPorDia.has(fechaPedido)) {
            const total = parseFloat(pedido.total?.$numberDecimal || pedido.total || 0);
            ventasPorDia.set(fechaPedido, ventasPorDia.get(fechaPedido) + total);
        }
    });

    const labels = fechas.map(f => f.label);
    const datos = fechas.map(f => ventasPorDia.get(f.fechaStr));

    if (lineasChart) lineasChart.destroy();
    lineasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas (MXN)',
                data: datos,
                borderColor: '#030303',
                backgroundColor: 'rgba(3,3,3,0.05)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#e67e22',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value.toLocaleString('es-MX')
                    }
                }
            }
        }
    });
}

// ---------- Exportación de datos (CSV) ----------
function generarCSVVentas(periodo) {
    // periodo: 'current', 'year', 'all'
    let startDate, endDate;
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    if (periodo === 'current') {
        // Usa el rango actual de la gráfica
        endDate = hoy;
        startDate = new Date(hoy);
        startDate.setUTCDate(hoy.getUTCDate() - (currentRange - 1));
    } else if (periodo === 'year') {
        endDate = hoy;
        startDate = new Date(hoy);
        startDate.setUTCFullYear(hoy.getUTCFullYear() - 1);
        startDate.setUTCDate(startDate.getUTCDate() + 1); // para incluir el día exacto de hace un año
    } else if (periodo === 'all') {
        if (pedidosGlobal.length === 0) return null;
        // Obtener la fecha más antigua
        const fechasPedidos = pedidosGlobal
            .map(p => new Date(p.createdAt))
            .filter(d => !isNaN(d))
            .sort((a, b) => a - b);
        if (fechasPedidos.length === 0) return null;
        startDate = fechasPedidos[0];
        startDate.setUTCHours(0, 0, 0, 0);
        endDate = hoy;
    } else {
        return null;
    }

    // Generar todas las fechas entre startDate y endDate (inclusive)
    const fechas = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        const fechaStr = current.toISOString().split('T')[0];
        const label = `${current.getUTCDate()}/${current.getUTCMonth() + 1}/${current.getUTCFullYear()}`;
        fechas.push({ fechaStr, label });
        current.setUTCDate(current.getUTCDate() + 1);
    }

    // Mapa de ventas
    const ventasMap = new Map();
    fechas.forEach(f => ventasMap.set(f.fechaStr, 0));

    pedidosGlobal.forEach(pedido => {
        if (!pedido.createdAt) return;
        const fechaPedido = new Date(pedido.createdAt).toISOString().split('T')[0];
        if (ventasMap.has(fechaPedido)) {
            const total = parseFloat(pedido.total?.$numberDecimal || pedido.total || 0);
            ventasMap.set(fechaPedido, ventasMap.get(fechaPedido) + total);
        }
    });

    // Construir CSV
    let csvRows = [['Fecha', 'Ventas (MXN)']];
    for (let f of fechas) {
        csvRows.push([f.label, ventasMap.get(f.fechaStr).toFixed(2)]);
    }

    return csvRows.map(row => row.join(',')).join('\n');
}

function descargarCSV(csv, nombreArchivo) {
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para caracteres especiales
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportarDatos() {
    const select = document.getElementById('export-periodo-select');
    const periodo = select.value;
    let nombreArchivo = '';
    let periodoTexto = '';

    switch(periodo) {
        case 'current':
            periodoTexto = `ultimos_${currentRange}_dias`;
            nombreArchivo = `ventas_${periodoTexto}.csv`;
            break;
        case 'year':
            periodoTexto = 'ultimo_ano';
            nombreArchivo = `ventas_${periodoTexto}.csv`;
            break;
        case 'all':
            periodoTexto = 'todos_los_datos';
            nombreArchivo = `ventas_${periodoTexto}.csv`;
            break;
        default:
            return;
    }

    const csv = generarCSVVentas(periodo);
    if (!csv) {
        alert('No hay datos para exportar.');
        return;
    }
    descargarCSV(csv, nombreArchivo);
}

// ---------- Controles de rango y exportación ----------
function agregarControlesRangoYExportacion() {
    const card7Header = document.querySelector('.card7 .kpi-chart-header');
    if (!card7Header) return;

    // Evitar duplicados
    if (document.getElementById('rango-buttons') && document.getElementById('export-controls')) return;

    // Crear contenedor para botones de rango (7,30,90)
    const rangoContainer = document.createElement('div');
    rangoContainer.id = 'rango-buttons';
    rangoContainer.className = 'rango-buttons';
    rangoContainer.innerHTML = `
        <button data-rango="7" class="btn-rango active">7 días</button>
        <button data-rango="30" class="btn-rango">30 días</button>
        <button data-rango="90" class="btn-rango">90 días</button>
    `;

    // Crear contenedor para exportación
    const exportContainer = document.createElement('div');
    exportContainer.id = 'export-controls';
    exportContainer.className = 'export-controls';
    exportContainer.innerHTML = `
        <select id="export-periodo-select" class="export-select">
            <option value="current">Rango actual (${currentRange} días)</option>
            <option value="year">Último año (365 días)</option>
            <option value="all">Todos los datos históricos</option>
        </select>
        <button id="btn-exportar" class="btn-exportar" title="Exportar a CSV">
            <i class="bi bi-download"></i> Exportar
        </button>
    `;

    card7Header.appendChild(rangoContainer);
    card7Header.appendChild(exportContainer);

    // Eventos de los botones de rango
    const buttons = rangoContainer.querySelectorAll('.btn-rango');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = parseInt(btn.getAttribute('data-rango'), 10);
            actualizarLineas(currentRange);
            // Actualizar texto del selector de exportación para reflejar el rango actual
            const select = document.getElementById('export-periodo-select');
            if (select) {
                select.options[0].text = `Rango actual (${currentRange} días)`;
            }
        });
    });

    // Evento del botón exportar
    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarDatos);
    }
}

// ---------- Alertas de inventario y próximos envíos (sin cambios) ----------
async function cargarAlertasInventario() {
    try {
        const response = await fetch('/api/playeras/obtener-playeras');
        const productos = await response.json();
        let totalAlertas = 0;
        productos.forEach(producto => {
            if (producto.stock && Array.isArray(producto.stock)) {
                if (producto.stock.some(item => item.cantidad <= 3)) totalAlertas++;
            }
        });
        document.getElementById('kpi-alertas').textContent = `${totalAlertas} diseños con bajo stock`;
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        document.getElementById('kpi-alertas').textContent = 'Error';
    }
}

function renderizarProximosEnvios(pedidos) {
    const contenedor = document.getElementById('lista-proximos-envios');
    if (!contenedor) return;

    const pendientes = pedidos
        .filter(p => p.estado === 'Pendiente')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, 5);

    if (pendientes.length === 0) {
        contenedor.innerHTML = '<p style="color: #27ae60; padding: 1rem 0;">¡Todos los pedidos están al día! 🎉</p>';
        return;
    }

    contenedor.innerHTML = pendientes.map(pedido => {
        const id = pedido._id ? pedido._id.slice(-6).toUpperCase() : 'N/A';
        const cliente = pedido.usuario?.nombre || 'Sin nombre';
        const fecha = new Date(pedido.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        const monto = parseFloat(pedido.total?.$numberDecimal || pedido.total || 0).toFixed(2);
        return `
            <div class="item-envio">
                <div class="envio-detalle">
                    <span class="envio-cliente">${cliente}</span>
                    <span class="envio-fecha">#${id} · ${fecha}</span>
                </div>
                <span class="envio-total">$${monto}</span>
            </div>
        `;
    }).join('');
}