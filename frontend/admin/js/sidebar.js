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
                            <a href="billetera.html" class="contenedor-panel">
                                <i class="bi bi-wallet2"></i>
                                <span>Billetera</span>
                            </a>
                        </li>
                        <li>
                            <a href="administracion.html" class="contenedor-panel">
                                <i class="bi bi-person-gear"></i>
                                <span>Administracion</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
        </aside>
        `;
        document.addEventListener("DOMContentLoaded", () => {
            // Obtenemos la ruta de la página actual (ej. /productos.html)
            const currentPath = window.location.pathname;

            // Seleccionamos todos los enlaces dentro del sidebar
            const navLinks = document.querySelectorAll('.nav-links a');

            navLinks.forEach(link => {
                // Obtenemos el valor del href de cada enlace (ej. productos.html)
                const linkPath = link.getAttribute('href');

                // Comparamos si la URL actual termina con el href del enlace
                // También cubrimos el caso de que sea la raíz "/" para el Dashboard
                if (currentPath.endsWith(linkPath) || (currentPath.endsWith('/') && linkPath === 'indexAdmin.html')) {
                    link.classList.add('active'); // Agregamos la clase que lo pone negro
                } else {
                    link.classList.remove('active'); // Nos aseguramos de quitarla de los demás
                }
            });
        });
    }
}

// Definimos el nombre de la etiqueta personalizada
customElements.define('main-sidebar', SupernovaSide);