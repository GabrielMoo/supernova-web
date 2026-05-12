let dataBase = [];
let currentPage = 1;
const rowsPerPage = 10;
let totalPages = 1;

const tableBody = document.getElementById("contenido-tabla");
const pageNumbersContainer = document.getElementById("page-numbers");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");

// 1. OBTENER DATOS DE LA BASE DE DATOS
async function cargarClientes() {
    try {
        const respuesta = await fetch('/api/auth/clientes-stats');
        const clientes = await respuesta.json();
        
        dataBase = clientes; // Guardamos los datos
        totalPages = Math.ceil(dataBase.length / rowsPerPage) || 1; // Calculamos páginas
        updateUI(); // Dibujamos la tabla
    } catch (error) {
        console.error("Error al cargar los clientes:", error);
    }
}

// 2. DIBUJAR LA TABLA
function renderTable(page) {
    tableBody.innerHTML = "";
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = dataBase.slice(start, end);

    paginatedItems.forEach((cliente, index) => {
        const tr = document.createElement("tr");

        // Damos formato bonito a la fecha
        const fechaObj = new Date(cliente.fechaRegistro);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

        // Como MongoDB devuelve Decimal128, a veces viene como un objeto {$numberDecimal: "100.50"} o un string
        let total = 0;
        if (cliente.totalGastado && cliente.totalGastado.$numberDecimal) {
            total = parseFloat(cliente.totalGastado.$numberDecimal);
        } else if (cliente.totalGastado) {
            total = parseFloat(cliente.totalGastado);
        }

        tr.innerHTML = `
            <td>${start + index + 1}</td>
            <td>${cliente.nombre}</td>
            <td>${cliente.email}</td>
            <td>${fechaFormateada}</td>
            <td>${cliente.cantidadPedidos}</td>
            <td>$${total.toFixed(2)}</td>
        `;

        // Efecto visual al hacer clic en la fila (igual que en productos)
        tr.addEventListener("click", () => {
            document.querySelectorAll("tr.selected").forEach(el => el.classList.remove("selected"));
            tr.classList.toggle("selected");
        });

        tableBody.appendChild(tr);
    });
}

// 3. DIBUJAR LA PAGINACIÓN
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

// 4. CONTROLADORES
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

// Iniciamos todo al cargar el archivo
cargarClientes();