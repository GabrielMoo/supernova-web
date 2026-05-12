class WavePassHeader extends HTMLElement {
    connectedCallback() {
        // Verificar si hay un usuario logueado
        const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));

        // Definir el contenido del enlace izquierdo según la sesión
        const enlaceSesion = usuario
            ? `<li><a href="pedidos.html">Mis Pedidos</a></li>`
            : `<li><a href="login-register.html" id="btn-iniciar-sesion">Iniciar sesión / crear cuenta</a></li>`;

        this.innerHTML = `
        <header class="header" id="header">
            <nav>
                <div class="contenedor-nav">
                    <ul class="nav-links">
                        ${enlaceSesion}
                    </ul>

                    <a href="index.html" class="logo">
                        <img src="media/LogoBlanco.png" alt="WavePass* Logo">
                    </a>

                    <ul class="nav-links">
                        <li><button class="btn-busqueda" id="buscarBtn"><i class="bi bi-search"></i></button></li>
                        <li><a href="perfil.html"><i class="bi bi-person"></i></a></li>
                        <li><a href="#" id="btn-abrir-carrito-nav"><i class="bi bi-cart2"></i></a></li>
                    </ul>
                </div>
            </nav>

            <div class="barra-busqueda">
                <a href="index.html" class="logo">
                    <img src="media/LogoNegro.png" alt="Supernova Prints Logo">
                </a>
                <div class="contenedor-input-buscar">
                    <i class="bi bi-search"></i>
                    <input type="text" placeholder="Buscar..." id="inputBuscar">
                </div>
                <button class="btn-busqueda" id="cerrarBusquedaBtn"><i class="bi bi-x-lg"></i></button>
            </div>
        </header>
        `;
    }
}

// Definimos el nombre de la etiqueta personalizada
customElements.define('main-navbar', WavePassHeader);