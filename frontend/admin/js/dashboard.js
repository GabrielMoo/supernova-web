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
    let ventasDetalladas = {}; 
    let ventasPorDiaMap = {}; // Mapa temporal para agrupar ventas por fecha

    pedidos.forEach(pedido => {
        if (pedido.estado === 'Pendiente') pendientes++;
        
        // Sumar total de ventas
        const total = parseFloat(pedido.total?.$numberDecimal || pedido.total || 0);
        totalVentas += total;

        // --- LÓGICA PARA VENTAS DE LOS ÚLTIMOS 7 DÍAS ---
        if (pedido.createdAt) {
            // Extraer solo la fecha (YYYY-MM-DD)
            const fechaString = new Date(pedido.createdAt).toISOString().split('T')[0];
            
            if (!ventasPorDiaMap[fechaString]) {
                ventasPorDiaMap[fechaString] = 0;
            }
            ventasPorDiaMap[fechaString] += total;
        }

        // --- LÓGICA PARA EL DRILL-DOWN ---
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

    // Convertir el mapa de fechas a un arreglo, ordenarlo y tomar los últimos 7
    let ventasUltimos7Dias = Object.keys(ventasPorDiaMap)
        .sort() // Orden cronológico
        .slice(-7) // Tomar solo los últimos 7 días
        .map(fecha => ({
            fecha: fecha,
            total: ventasPorDiaMap[fecha]
        }));

    return { totalVentas, totalPedidos, pendientes, ventasDetalladas, ventasUltimos7Dias };
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