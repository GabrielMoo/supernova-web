document.addEventListener('DOMContentLoaded', () => {
    cargarTodo();
    // Actualizar cada 5 minutos
    setInterval(cargarTodo, 300000);
});

async function cargarTodo() {
    try {
        // 1. Obtener todos los pedidos
        const response = await fetch('/api/pedidos/admin/todos');
        if (!response.ok) throw new Error('Error al obtener pedidos');
        const pedidos = await response.json();

        // 2. Calcular KPIs + datos para gráficos
        const { totalVentas, totalPedidos, pendientes, ventasPorProducto, ventasUltimos7Dias } = procesarPedidos(pedidos);

        // 3. Actualizar KPIs
        actualizarKPIs(totalVentas, totalPedidos, pendientes);

        // 4. Gráfico de Dona
        renderizarDona(ventasPorProducto);

        // 5. Gráfico de Líneas
        renderizarLineas(ventasUltimos7Dias);

        // --- EL PASO QUE FALTABA ---
        // 6. Renderizar la lista de la tarjeta 6
        renderizarProximosEnvios(pedidos); 

        // 7. Cargar alertas de inventario
        await cargarAlertasInventario();

    } catch (error) {
        console.error('Error en dashboard:', error);
    }
}

function procesarPedidos(pedidos) {
    let totalVentas = 0;
    let totalPedidos = pedidos.length;
    let pendientes = 0;
    const ventasPorProducto = {}; // { nombre: cantidad }
    const ventasPorFecha = {};    // { fecha: total }

    pedidos.forEach(pedido => {
        // Monto total
        let monto = 0;
        if (pedido.total?.$numberDecimal) {
            monto = parseFloat(pedido.total.$numberDecimal);
        } else if (pedido.total) {
            monto = parseFloat(pedido.total);
        }
        totalVentas += monto;

        // Pendientes
        if (pedido.estado === 'Pendiente') pendientes++;

        // Items para gráfico de dona
        if (pedido.items && Array.isArray(pedido.items)) {
            pedido.items.forEach(item => {
                const nombre = item.productoSnapshot?.nombre || 'Sin nombre';
                const cantidad = item.cantidad || 0;
                ventasPorProducto[nombre] = (ventasPorProducto[nombre] || 0) + cantidad;
            });
        }

        // Ventas por día para gráfico de líneas (solo últimos 7 días)
        const fecha = new Date(pedido.createdAt).toISOString().split('T')[0]; // yyyy-mm-dd
        ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + monto;
    });

    // Obtener últimos 7 días (incluyendo hoy)
    const hoy = new Date();
    const ventasUltimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
        const dia = new Date(hoy);
        dia.setDate(hoy.getDate() - i);
        const clave = dia.toISOString().split('T')[0];
        ventasUltimos7Dias.push({
            fecha: clave,
            total: ventasPorFecha[clave] || 0
        });
    }

    return { totalVentas, totalPedidos, pendientes, ventasPorProducto, ventasUltimos7Dias };
}

function actualizarKPIs(totalVentas, totalPedidos, pendientes) {
    const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    document.getElementById('kpi-ventas').textContent = formatoMXN.format(totalVentas);
    document.getElementById('kpi-pedidos-totales').textContent = totalPedidos;
    document.getElementById('kpi-pendientes').textContent = `${pendientes} por enviar`;
}

// ---------- Gráfico de Dona ----------
let donaChart = null;
function renderizarDona(ventasPorProducto) {
    const ctx = document.getElementById('grafico-dona')?.getContext('2d');
    if (!ctx) return;

    // Top 5 productos más vendidos + "Otros"
    const ordenados = Object.entries(ventasPorProducto).sort((a, b) => b[1] - a[1]);
    const top = ordenados.slice(0, 5);
    const otrosTotal = ordenados.slice(5).reduce((sum, [, cant]) => sum + cant, 0);

    const labels = top.map(([nombre]) => nombre);
    const data = top.map(([, cant]) => cant);
    if (otrosTotal > 0) {
        labels.push('Otros');
        data.push(otrosTotal);
    }

    if (donaChart) donaChart.destroy();
    donaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#030303', '#e67e22', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { family: 'Open Sans', size: 12 },
                        color: '#333'
                    }
                }
            }
        }
    });
}

// ---------- Gráfico de Líneas ----------
let lineasChart = null;
function renderizarLineas(ventasUltimos7Dias) {
    const ctx = document.getElementById('grafico-lineas')?.getContext('2d');
    if (!ctx) return;

    const labels = ventasUltimos7Dias.map(d => {
        const partes = d.fecha.split('-');
        return `${partes[2]}/${partes[1]}`; // dd/mm
    });
    const datos = ventasUltimos7Dias.map(d => d.total);

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

// ---------- Alertas de Inventario (se mantiene igual) ----------
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

    // Filtramos solo los pedidos pendientes
    const pendientes = pedidos
        .filter(p => p.estado === 'Pendiente')
        // Ordenamos del más antiguo al más nuevo (createdAt ascendente)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Mostramos los 5 más antiguos
    const proximos = pendientes.slice(0, 5);

    if (proximos.length === 0) {
        contenedor.innerHTML = '<p style="color: #27ae60; padding: 1rem 0;">¡Todos los pedidos están al día! 🎉</p>';
        return;
    }

    contenedor.innerHTML = proximos.map(pedido => {
        const id = pedido._id ? pedido._id.slice(-6).toUpperCase() : 'N/A';
        const cliente = pedido.usuario?.nombre || 'Sin nombre';
        const fecha = new Date(pedido.createdAt).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short'
        });
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