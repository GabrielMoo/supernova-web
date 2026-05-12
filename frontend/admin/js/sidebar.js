class SupernovaSide extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <aside class="sidebar" id="sidebar">
            <nav>
                <div class="contenedor-sidebar">
                    <div class="contenedor-logo">
                        <a href="indexAdmin.html" class="logo">
                            <img src="media/LogoBlanco.png" alt="Logo Supernova">
                        </a>

                        <p>Supernova Prints</p>
                    </div>

                    <hr class="divisor">

                    <ul class="nav-links">
                        <li>
                            <a href="indexAdmin.html" class="contenedor-panel">
                                <i class="bi bi-columns-gap"></i>
                                <span>Dashboard</span>
                            </a>
                        </li>
                        <li>
                            <a href="productos.html" class="contenedor-panel">
                                <i class="bi bi-bag"></i>
                                <span>Productos</span>
                            </a>
                        </li>
                        <li>
                            <a href="pedidos.html" class="contenedor-panel">
                                <i class="bi bi-clipboard"></i>
                                <span>Pedidos</span>
                            </a>
                        </li>
                        <li>
                            <a href="clientes.html" class="contenedor-panel">
                                <i class="bi bi-people"></i>
                                <span>Clientes</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="contenedor-panel" id="btn-cerrar-sesion">
                                <i class="bi bi-box-arrow-left"></i>
                                <span>Cerrar sesión</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
        </aside>
        `;
        
        document.addEventListener("DOMContentLoaded", () => {
            // --- 1. Lógica para resaltar la página activa ---
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-links a');

            navLinks.forEach(link => {
                const linkPath = link.getAttribute('href');
                // Ignoramos el botón de cerrar sesión para que no se marque como activo
                if (linkPath !== '#' && (currentPath.endsWith(linkPath) || (currentPath.endsWith('/') && linkPath === 'indexAdmin.html'))) {
                    link.classList.add('active'); 
                } else {
                    link.classList.remove('active'); 
                }
            });

            // --- 2. Lógica para Cerrar Sesión ---
            const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
            if (btnCerrarSesion) {
                btnCerrarSesion.addEventListener('click', (e) => {
                    e.preventDefault(); // Evita que la página suba al inicio por el href="#"
                    
                    // Aquí borramos la sesión del almacenamiento del navegador
                    localStorage.removeItem('usuario'); // Ajusta este nombre si usas otro
                    
                    // Redirigimos al usuario a la vista de login
                    window.location.href = '../tienda/login-register.html';
                });
            }
        });
    }
}

// Definimos el nombre de la etiqueta personalizada
customElements.define('main-sidebar', SupernovaSide);