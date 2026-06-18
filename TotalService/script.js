// API base URL
const API_URL = 'http://localhost:3000';

// ====== Estado de la aplicación ======
let usuarioActual = null;

// ====== Inicialización ======
document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  manejarModal();
  cargarProductos();
  manejarFormularios();
  configurarHamburguesa();
  suavizarScroll();
  actualizarAño();
});

// ====== Verificar sesión al cargar ======
async function verificarSesion() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      usuarioActual = data;
      actualizarUIUsuario();
    }
  } catch (err) {
    console.log('No hay sesión activa');
  }
}

// ====== Actualizar UI según estado de usuario ======
function actualizarUIUsuario() {
  const btnLogin = document.getElementById('btnLogin');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  
  if (usuarioActual) {
    btnLogin.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = `${usuarioActual.rol === 'empleado' ? '👨‍💼' : '👤'} Usuario`;
  } else {
    btnLogin.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

// ====== Modal de Login/Registro ======
function manejarModal() {
  const authModal = document.getElementById('authModal');
  const btnLogin = document.getElementById('btnLogin');
  const closeModal = document.getElementById('closeModal');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  console.log('Inicializando modal...');
  console.log('closeModal existe:', closeModal);

  btnLogin.addEventListener('click', () => {
    authModal.style.setProperty('display', 'flex', 'important');
  });

  closeModal.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    authModal.style.setProperty('display', 'none', 'important');
  });

  authModal.addEventListener('click', (e) => {
    if (e.target.id === 'authModal') {
      console.log('Cerrando por click fuera');
      authModal.style.setProperty('display', 'none', 'important');
    }
  });

  switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  });

  switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  });
}

// ====== Formularios de login/registro ======
function manejarFormularios() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const btnLogout = document.getElementById('btnLogout');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        usuarioActual = { rol: data.rol, nombre: data.nombre };
        actualizarUIUsuario();
        document.getElementById('authModal').style.display = 'none';
        loginForm.reset();
        alert('¡Bienvenido ' + data.nombre + '!');
        cargarProductos(); // Recargar para mostrar opciones según el rol
      } else {
        alert('Email o contraseña incorrectos');
      }
    } catch (err) {
      alert('Error al iniciar sesión: ' + err.message);
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('registerNombre').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const rol = document.getElementById('registerRol').value;

    try {
      const response = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol })
      });

      if (response.ok) {
        alert('¡Cuenta creada! Ahora inicia sesión');
        document.getElementById('registerTab').classList.remove('active');
        document.getElementById('loginTab').classList.add('active');
        registerForm.reset();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      alert('Error al registrarse: ' + err.message);
    }
  });

  btnLogout.addEventListener('click', async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      usuarioActual = null;
      actualizarUIUsuario();
      cargarProductos();
      alert('Sesión cerrada');
    } catch (err) {
      alert('Error al cerrar sesión: ' + err.message);
    }
  });
}

// ====== Cargar productos dinámicamente ======
async function cargarProductos() {
  const productGrid = document.getElementById('productGrid');
  
  try {
    const response = await fetch(`${API_URL}/productos`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const productos = await response.json();
      productGrid.innerHTML = ''; // Limpiar
      
      if (productos.length === 0) {
        productGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">No hay productos disponibles</p>';
        return;
      }

      productos.forEach(producto => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <img src="${producto.img || 'img/default.jpg'}" alt="${producto.titulo}" />
          <div class="body">
            <h4>${producto.titulo}</h4>
            <div class="price">$${producto.precio}</div>
            <p>${producto.descripcion || 'Sin descripción'}</p>
            <div class="tags">
              <span class="tag">Stock: ${producto.stock}</span>
            </div>
            ${usuarioActual && usuarioActual.rol === 'cliente' ? `
              <button class="btn btn-primary btn-pedir" data-id="${producto._id}" data-titulo="${producto.titulo}">Pedir</button>
            ` : ''}
          </div>
        `;
        productGrid.appendChild(card);
      });

      // Agregar eventos a botones de pedir
      if (usuarioActual && usuarioActual.rol === 'cliente') {
        document.querySelectorAll('.btn-pedir').forEach(btn => {
          btn.addEventListener('click', (e) => mostrarFormularioPedido(e.target.dataset.id, e.target.dataset.titulo));
        });
      }
    }
  } catch (err) {
    console.error('Error cargando productos:', err);
    productGrid.innerHTML = '<p style="grid-column:1/-1;color:red;">Error al cargar productos</p>';
  }
}

// ====== Mostrar formulario de pedido ======
function mostrarFormularioPedido(productoId, productoTitulo) {
  if (!usuarioActual) {
    alert('Debes iniciar sesión para hacer un pedido');
    document.getElementById('btnLogin').click();
    return;
  }

  const cantidad = prompt(`¿Cuántas unidades de "${productoTitulo}" deseas pedir?`, '1');
  
  if (cantidad && parseInt(cantidad) > 0) {
    crearPedido(productoId, parseInt(cantidad));
  }
}

// ====== Crear pedido ======
async function crearPedido(productoId, cantidad) {
  try {
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ producto: productoId, cantidad })
    });

    if (response.ok) {
      const pedido = await response.json();
      alert('¡Pedido creado exitosamente! ID: ' + pedido._id);
    } else {
      const error = await response.json();
      alert('Error: ' + error.error);
    }
  } catch (err) {
    alert('Error al crear pedido: ' + err.message);
  }
}

// ====== Menú hamburguesa ======
function configurarHamburguesa() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');

  hamburger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
}

// ====== Slider automático ======
function sliderAutomatico() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  let idx = 0;

  if (slides.length === 0) return;

  setInterval(() => {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, 4000);
}

// ====== Suavizar scroll ======
function suavizarScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

// ====== Actualizar año en footer ======
function actualizarAño() {
  document.getElementById('y').textContent = new Date().getFullYear();
}

// Iniciar slider
sliderAutomatico();