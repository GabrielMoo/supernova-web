document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (!usuarioLogueado) {
        window.location.href = 'login.html';
        return;
    }
    cargarPedidos(usuarioLogueado.id);
});

async function cargarPedidos(usuarioId) {
    const contenedor = document.getElementById('lista-pedidos');
    try {
        const res = await fetch(`/api/pedidos/${usuarioId}`);
        const pedidos = await res.json();

        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p class="sin-pedidos">Aún no tienes pedidos.</p>';
            return;
        }

        // AQUÍ ES DONDE SE DEFINE "pedido" PARA TODO EL BLOQUE
        contenedor.innerHTML = pedidos.map(pedido => {
            const fecha = new Date(pedido.createdAt).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const direccion = pedido.direccionEnvio || {};
            
            // --- BLOQUE ACTUALIZADO DE ITEMS CON SNAPSHOT ---
            const itemsHTML = pedido.items.map(item => {
                const dataProducto = item.productoSnapshot || (item.stock ? {
                    nombre: item.stock.playera.nombre,
                    corte: item.stock.corte,
                    talla: item.stock.talla,
                    precio: item.stock.playera.precio,
                    imagen_enlace: item.stock.playera.imagen_enlace
                } : null);

                if (!dataProducto) {
                    return `
                        <div class="item-miniatura">
                            <div class="info">
                                <p class="nombre" style="color: red;">Producto antiguo no disponible</p>
                                <p class="variante">Cantidad: x${item.cantidad}</p>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="item-miniatura">
                        <img src="${dataProducto.imagen_enlace}" alt="${dataProducto.nombre}">
                        <div class="info">
                            <p class="nombre">${dataProducto.nombre}</p>
                            <p class="variante">${dataProducto.corte} / ${dataProducto.talla} (x${item.cantidad})</p>
                            <p class="precio">$${parseFloat(dataProducto.precio.$numberDecimal || dataProducto.precio).toFixed(2)} c/u</p>
                        </div>
                    </div>
                `;
            }).join('');
            // --- FIN DEL BLOQUE DE ITEMS ---

            // --- RENDERIZADO DE LA TARJETA DEL PEDIDO ---
            return `
                <div class="tarjeta-pedido">
                    <div class="encabezado-pedido">
                        <div>
                            <h3>Pedido #${pedido._id.slice(-6).toUpperCase()}</h3>
                            <span class="fecha">${fecha}</span>
                        </div>
                        <span class="estado ${pedido.estado.toLowerCase().replace(' ', '-')}">${pedido.estado}</span>
                    </div>
                    <div class="cuerpo-pedido">
                        <div class="direccion">
                            <strong>Envío a:</strong>
                            <p>${direccion.calle}, ${direccion.estado}, CP ${direccion.codigoPostal}</p>
                            <p>Tel: ${direccion.telefono}</p>
                        </div>
                        <div class="items-pedido">
                            ${itemsHTML}
                        </div>
                    </div>
                    <div class="footer-pedido">
                        <div class="totales">
                            <span>Subtotal: $${parseFloat(pedido.subtotal.$numberDecimal || pedido.subtotal).toFixed(2)}</span>
                            <span>Envío: $${parseFloat(pedido.envio.$numberDecimal || pedido.envio).toFixed(2)}</span>
                            <strong>Total: $${parseFloat(pedido.total.$numberDecimal || pedido.total).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        contenedor.innerHTML = '<p>Error al cargar los pedidos. Intenta más tarde.</p>';
    }
}