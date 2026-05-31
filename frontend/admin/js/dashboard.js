document.addEventListener('DOMContentLoaded', () => {
    cargarTodo();
    // Actualizar cada 5 minutos
    setInterval(cargarTodo, 300000);
});

let graficoDona; 
let datosGlobalesVentas = {};

async function cargarTodo() {
    try {
        const response = await fetch('/api/pedidos/admin/todos');
        if (!response.ok) throw new Error('Error al obtener pedidos');
        const pedidos = await response.json();

        // 1. Procesar pedidos con profundidad
        const { totalVentas, totalPedidos, pendientes, ventasDetalladas, ventasUltimos7Dias } = procesarPedidos(pedidos);
        
        datosGlobalesVentas = ventasDetalladas;

        actualizarKPIs(totalVentas, totalPedidos, pendientes);
        renderizarDona(ventasDetalladas); // Pasamos el objeto detallado
        renderizarLineas(ventasUltimos7Dias);
        renderizarProximosEnvios(pedidos);
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
        // 1. Monto total
        let monto = 0;
        if (pedido.total?.$numberDecimal) {
            monto = parseFloat(pedido.total.$numberDecimal);
        } else if (pedido.total) {
            monto = parseFloat(pedido.total);
        }
        totalVentas += monto;

        // 2. Pendientes
        if (pedido.estado === 'Pendiente') pendientes++;

        // 3. Items para gráfico de dona
        if (pedido.items && Array.isArray(pedido.items)) {
            pedido.items.forEach(item => {
                const nombre = item.productoSnapshot?.nombre || 'Sin nombre';
                const cantidad = item.cantidad || 0;
                ventasPorProducto[nombre] = (ventasPorProducto[nombre] || 0) + cantidad;
            });
        }

        // 4. Registrar ventas por fecha en un mapa temporal
        if (pedido.createdAt) {
            const fecha = new Date(pedido.createdAt).toISOString().split('T')[0]; // yyyy-mm-dd
            ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + monto;
        }
    });

    // --- LA LÓGICA CORRECTA DE TU RAMA ANTERIOR ---
    // 5. Obtener últimos 7 días fijos (incluyendo hoy) y rellenar con ceros
    const hoy = new Date();
    const ventasUltimos7Dias = [];
    
    for (let i = 6; i >= 0; i--) {
        const dia = new Date(hoy);
        dia.setDate(hoy.getDate() - i);
        const clave = dia.toISOString().split('T')[0];
        
        ventasUltimos7Dias.push({
            fecha: clave,
            total: ventasPorFecha[clave] || 0 // Si no hay ventas, asigna 0
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
function renderizarDona(datos, esDetalle = false) {
    const ctx = document.getElementById('grafico-dona').getContext('2d');
    const btnVolver = document.getElementById('btn-volver-dona');
    const titulo = document.getElementById('titulo-dona');

    if (graficoDona) graficoDona.destroy();

    // Si es detalle, los labels son "Corte (Talla)", si no, son los nombres de las playeras
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
                // Solo permitimos click si estamos en la vista general
                if (!esDetalle && elementos.length > 0) {
                    const indice = elementos[0].index;
                    const nombrePlayera = labels[indice];
                    
                    // Cambiamos a la vista de tallas/cortes
                    titulo.innerText = `Ventas: ${nombrePlayera}`;
                    btnVolver.style.display = 'block';
                    renderizarDona(datosGlobalesVentas[nombrePlayera].detalles, true);
                }
            }
        }
    });

    // Configurar el botón de volver
    btnVolver.onclick = () => {
        titulo.innerText = "Top Playeras Más Vendidas";
        btnVolver.style.display = 'none';
        renderizarDona(datosGlobalesVentas, false);
    };
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