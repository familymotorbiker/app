// Sistema de autenticación para Inventario de Llantas
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        // Esperar a que window.auth esté disponible
        await this.waitForAuth();
        
        try {
            // Verificar si hay una sesión activa
            const session = await window.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.isAuthenticated = true;
                this.showApp();
            } else {
                this.showLogin();
            }

            // Escuchar cambios de autenticación
            window.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    this.isAuthenticated = true;
                    this.showApp();
                    this.showNotification('¡Bienvenido! Sesión iniciada correctamente', 'success');
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.isAuthenticated = false;
                    this.showLogin();
                    this.showNotification('Sesión cerrada', 'info');
                }
            });
        } catch (error) {
            console.log('Supabase no disponible, mostrando login directo');
            this.showLogin();
        }
    }

    async waitForAuth() {
        // Esperar a que window.auth esté disponible, con timeout
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo
            
            const checkAuth = () => {
                attempts++;
                if (window.auth) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.log('Timeout esperando window.auth, continuando sin Supabase');
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    showLogin() {
        document.body.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-logo">
                            <img src="assets/images/family-motorbiker-logo.svg" alt="Family Motorbiker Logo" class="logo-image">
                        </div>
                        <h1>
                            <span class="brand-text">FAMILY MOTORBIKER</span>
                            <br>
                            <small style="font-size: 0.6em; font-weight: 500; letter-spacing: 2px; opacity: 0.8;">INVENTARIO DE LLANTAS</small>
                        </h1>
                        <p>Inicia sesión para acceder a tu inventario personalizado</p>
                    </div>

                    <div class="auth-tabs">
                        <button class="auth-tab-btn active" data-tab="login">
                            <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                        </button>
                        <button class="auth-tab-btn" data-tab="register">
                            <i class="fas fa-user-plus"></i> Registrarse
                        </button>
                    </div>

                    <!-- Login Tab -->
                    <div id="login-tab" class="auth-tab-content active">
                        <form id="loginForm" class="auth-form">
                            <div class="form-group">
                                <label for="loginEmail">
                                    <i class="fas fa-envelope"></i> Email
                                </label>
                                <input type="email" id="loginEmail" required 
                                       placeholder="tu@email.com">
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">
                                    <i class="fas fa-lock"></i> Contraseña
                                </label>
                                <input type="password" id="loginPassword" required 
                                       placeholder="Tu contraseña">
                            </div>
                            <button type="submit" class="btn btn-primary btn-full">
                                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                            </button>
                        </form>

                        <div class="auth-divider">
                            <span>o</span>
                        </div>

                        <button id="googleSignIn" class="btn btn-google btn-full">
                            <i class="fab fa-google"></i> Continuar con Google
                        </button>
                    </div>

                    <!-- Register Tab -->
                    <div id="register-tab" class="auth-tab-content">
                        <form id="registerForm" class="auth-form">
                            <div class="form-group">
                                <label for="registerEmail">
                                    <i class="fas fa-envelope"></i> Email
                                </label>
                                <input type="email" id="registerEmail" required 
                                       placeholder="tu@email.com">
                            </div>
                            <div class="form-group">
                                <label for="registerPassword">
                                    <i class="fas fa-lock"></i> Contraseña
                                </label>
                                <input type="password" id="registerPassword" required 
                                       placeholder="Mínimo 6 caracteres" minlength="6">
                            </div>
                            <div class="form-group">
                                <label for="registerPasswordConfirm">
                                    <i class="fas fa-lock"></i> Confirmar Contraseña
                                </label>
                                <input type="password" id="registerPasswordConfirm" required 
                                       placeholder="Repite tu contraseña">
                            </div>
                            <button type="submit" class="btn btn-primary btn-full">
                                <i class="fas fa-user-plus"></i> Crear Cuenta
                            </button>
                        </form>

                        <div class="auth-divider">
                            <span>o</span>
                        </div>

                        <button id="googleSignUpBtn" class="btn btn-google btn-full">
                            <i class="fab fa-google"></i> Registrarse con Google
                        </button>
                    </div>

                    <div class="auth-divider">
                        <span>o</span>
                    </div>

                    <button id="demoBtn" class="btn btn-demo btn-full">
                        <i class="fas fa-rocket"></i> Probar Demo (Sin registro)
                    </button>

                    <div class="auth-footer">
                        <p><i class="fas fa-motorcycle"></i> Family Motorbiker - Seguridad Total</p>
                    </div>
                </div>
            </div>
        `;

        this.setupAuthEventListeners();
    }

    showApp() {
        // Restaurar el contenido original de la app
        this.loadOriginalApp();
        
        // Agregar botón de logout al header
        this.addLogoutButton();
        
        // Inicializar la app principal
        if (window.initTireInventoryApp) {
            window.initTireInventoryApp();
        }
    }

    loadOriginalApp() {
        // Si estamos en modo demo, no recargar - restaurar HTML directamente
        if (this.currentUser && this.currentUser.id === 'demo-user') {
            this.restoreAppHTML();
        } else if (document.querySelector('.auth-container')) {
            // Solo recargar si no es demo
            window.location.reload();
        }
    }

    restoreAppHTML() {
        // Restaurar el HTML completo de la app para modo demo
        document.body.innerHTML = `
            <div class="container">
                <header class="header">
                    <div class="header-content">
                        <div class="header-logo">
                            <img src="assets/images/family-motorbiker-logo.svg" alt="Family Motorbiker Logo" class="main-logo">
                        </div>
                        <h1>
                            <span class="brand-text">FAMILY MOTORBIKER</span>
                            <br>
                            <small style="font-size: 0.6em; font-weight: 500; letter-spacing: 2px; opacity: 0.9;">INVENTARIO DE LLANTAS</small>
                        </h1>
                    </div>
                    <nav class="nav">
                        <button class="nav-btn active" data-tab="dashboard">
                            <i class="fas fa-chart-bar"></i>
                            <span>Dashboard</span>
                        </button>
                        <button class="nav-btn" data-tab="inventory">
                            <i class="fas fa-boxes"></i>
                            <span>Inventario</span>
                        </button>
                        <button class="nav-btn" data-tab="movements">
                            <i class="fas fa-exchange-alt"></i>
                            <span>Movimientos</span>
                        </button>
                        <button class="nav-btn" data-tab="history">
                            <i class="fas fa-history"></i>
                            <span>Historial</span>
                        </button>
                    </nav>
                </header>

                <main class="main">
                    <!-- Dashboard Tab -->
                    <section id="dashboard" class="tab-content active">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <i class="fas fa-boxes"></i>
                                <div class="stat-info">
                                    <h3>Total Llantas</h3>
                                    <span class="stat-number" id="totalTires">0</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-dollar-sign"></i>
                                <div class="stat-info">
                                    <h3>Valor Inventario</h3>
                                    <span class="stat-number" id="totalValue">$0.00</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-exchange-alt"></i>
                                <div class="stat-info">
                                    <h3>Movimientos Hoy</h3>
                                    <span class="stat-number" id="todayMovements">0</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-exclamation-triangle"></i>
                                <div class="stat-info">
                                    <h3>Stock Bajo</h3>
                                    <span class="stat-number" id="lowStock">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="dashboard-charts">
                            <div class="chart-card">
                                <h3>Llantas por Categoría</h3>
                                <div id="categoryChart" class="chart"></div>
                            </div>
                            <div class="chart-card">
                                <h3>Stock por Marca</h3>
                                <div id="brandChart" class="chart"></div>
                            </div>
                        </div>
                    </section>

                    <!-- Inventory Tab -->
                    <section id="inventory" class="tab-content">
                        <div class="inventory-header">
                            <h2>Gestión de Inventario</h2>
                            <button id="addTireBtn" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Agregar Llanta
                            </button>
                        </div>

                        <div class="search-filters">
                            <input type="text" id="searchInput" class="search-input" placeholder="Buscar por marca, referencia o medida...">
                            <select id="categoryFilter" class="filter-select">
                                <option value="">Todas las categorías</option>
                                <option value="Deportiva">Deportiva</option>
                                <option value="Trail">Trail</option>
                                <option value="Urbana">Urbana</option>
                                <option value="Cruiser">Cruiser</option>
                            </select>
                            <select id="typeFilter" class="filter-select">
                                <option value="">Todos los tipos</option>
                                <option value="Delantera">Delantera</option>
                                <option value="Trasera">Trasera</option>
                            </select>
                        </div>

                        <div class="inventory-table-container">
                            <table class="inventory-table">
                                <thead>
                                    <tr>
                                        <th>Medida</th>
                                        <th>Marca</th>
                                        <th>Referencia</th>
                                        <th>Categoría</th>
                                        <th>Tipo</th>
                                        <th>Stock</th>
                                        <th>Precio</th>
                                        <th>Ajustar</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="inventoryTableBody">
                                    <!-- Contenido dinámico -->
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <!-- Movements Tab -->
                    <section id="movements" class="tab-content">
                        <div class="movement-form-card">
                            <h2>Registrar Movimiento</h2>
                            <form id="movementForm" class="movement-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="movementTire">Llanta</label>
                                        <select id="movementTire" required>
                                            <option value="">Seleccionar llanta...</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="movementType">Tipo de movimiento</label>
                                        <select id="movementType" required>
                                            <option value="entrada">Entrada</option>
                                            <option value="salida">Salida</option>
                                            <option value="transferencia">Transferencia</option>
                                            <option value="ajuste">Ajuste de inventario</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="movementQuantity">Cantidad</label>
                                        <input type="number" id="movementQuantity" min="1" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="movementReason">Razón (opcional)</label>
                                        <input type="text" id="movementReason" placeholder="Motivo del movimiento">
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Registrar Movimiento
                                </button>
                            </form>
                        </div>
                    </section>

                    <!-- History Tab -->
                    <section id="history" class="tab-content">
                        <div class="history-header">
                            <h2>Historial de Movimientos</h2>
                            <div class="history-filters">
                                <input type="date" id="startDate" class="date-input" placeholder="Fecha inicio">
                                <input type="date" id="endDate" class="date-input" placeholder="Fecha fin">
                                <select id="historyTypeFilter" class="filter-select">
                                    <option value="">Todos los tipos</option>
                                    <option value="entrada">Entradas</option>
                                    <option value="salida">Salidas</option>
                                    <option value="transferencia">Transferencias</option>
                                    <option value="ajuste">Ajustes</option>
                                </select>
                                <button id="filterHistoryBtn" class="btn btn-secondary">
                                    <i class="fas fa-filter"></i> Filtrar
                                </button>
                            </div>
                        </div>

                        <div class="history-table-container">
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Llanta</th>
                                        <th>Tipo</th>
                                        <th>Cantidad</th>
                                        <th>Stock Anterior</th>
                                        <th>Stock Nuevo</th>
                                        <th>Razón</th>
                                    </tr>
                                </thead>
                                <tbody id="historyTableBody">
                                    <!-- Contenido dinámico -->
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>

                <!-- Modal para agregar/editar llanta -->
                <div id="tireModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modalTitle">Agregar Nueva Llanta</h3>
                            <span class="close">&times;</span>
                        </div>
                        
                        <form id="tireForm" class="tire-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tireMeasure">Medida</label>
                                    <input type="text" id="tireMeasure" required placeholder="ej: 120/70-17">
                                </div>
                                <div class="form-group">
                                    <label for="tireBrand">Marca</label>
                                    <input type="text" id="tireBrand" required placeholder="ej: Michelin">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tireReference">Referencia</label>
                                    <input type="text" id="tireReference" required placeholder="ej: Pilot Street">
                                </div>
                                <div class="form-group">
                                    <label for="tireCategory">Categoría</label>
                                    <select id="tireCategory" required>
                                        <option value="">Seleccionar categoría</option>
                                        <option value="Deportiva">Deportiva</option>
                                        <option value="Trail">Trail</option>
                                        <option value="Urbana">Urbana</option>
                                        <option value="Cruiser">Cruiser</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tireType">Tipo</label>
                                    <select id="tireType" required>
                                        <option value="">Seleccionar tipo</option>
                                        <option value="Delantera">Delantera</option>
                                        <option value="Trasera">Trasera</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="tirePrice">Precio</label>
                                    <input type="number" id="tirePrice" step="0.01" min="0" required placeholder="0.00">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tireStock">Stock inicial</label>
                                    <input type="number" id="tireStock" min="0" value="0" required>
                                </div>
                                <div class="form-group">
                                    <label for="tireMinStock">Stock mínimo</label>
                                    <input type="number" id="tireMinStock" min="0" value="5" required>
                                </div>
                            </div>
                        </form>
                        
                        <div class="modal-footer">
                            <button type="button" id="cancelBtn" class="btn btn-secondary">Cancelar</button>
                            <button type="submit" form="tireForm" class="btn btn-primary">
                                <span id="saveButtonText">Guardar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    addLogoutButton() {
        const header = document.querySelector('.header h1');
        if (header && !document.querySelector('.logout-btn')) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span class="user-email">
                    <i class="fas fa-user"></i> ${this.currentUser?.email}
                </span>
                <button class="btn btn-small btn-secondary logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Salir
                </button>
            `;
            header.parentNode.appendChild(userInfo);

            // Event listener para logout
            document.querySelector('.logout-btn').addEventListener('click', () => {
                this.logout();
            });
        }
    }

    setupAuthEventListeners() {
        // Cambiar entre tabs
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Google Sign In
        document.getElementById('googleSignIn').addEventListener('click', () => {
            this.handleGoogleLogin();
        });

        document.getElementById('googleSignUpBtn').addEventListener('click', () => {
            this.handleGoogleLogin();
        });

        // Demo button
        document.getElementById('demoBtn').addEventListener('click', () => {
            this.handleDemoLogin();
        });
    }

    switchAuthTab(tabName) {
        // Actualizar botones
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Mostrar contenido
        document.querySelectorAll('.auth-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        this.setLoadingState(submitBtn, true);

        try {
            const { data, error } = await window.auth.signIn(email, password);
            
            if (error) {
                throw error;
            }

            // La app se mostrará automáticamente por el listener de auth state
        } catch (error) {
            console.error('Error de login:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const submitBtn = document.querySelector('#registerForm button[type="submit"]');

        if (password !== passwordConfirm) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        this.setLoadingState(submitBtn, true);

        try {
            const { data, error } = await window.auth.signUp(email, password);
            
            if (error) {
                throw error;
            }

            this.showNotification('¡Cuenta creada! Revisa tu email para confirmar tu cuenta', 'success');
            this.switchAuthTab('login');
        } catch (error) {
            console.error('Error de registro:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleGoogleLogin() {
        try {
            const { data, error } = await window.auth.signInWithGoogle();
            
            if (error) {
                throw error;
            }

            // La redirección se manejará automáticamente
        } catch (error) {
            console.error('Error de Google login:', error);
            this.showNotification('Error al iniciar sesión con Google', 'error');
        }
    }

    handleDemoLogin() {
        // Simular usuario demo
        this.currentUser = {
            id: 'demo-user',
            email: 'demo@familymotorbiker.com',
            user_metadata: {
                full_name: 'Usuario Demo'
            }
        };
        this.isAuthenticated = true;
        
        // Mostrar notificación
        this.showNotification('¡Bienvenido al modo demo! 🚀', 'success');
        
        // Ir a la app
        this.showApp();
    }

    async logout() {
        try {
            const { error } = await window.auth.signOut();
            
            if (error) {
                throw error;
            }

            // La redirección se manejará automáticamente por el listener
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showNotification('Error al cerrar sesión', 'error');
        }
    }

    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'Email o contraseña incorrectos',
            'User already registered': 'Este email ya está registrado',
            'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
            'User not confirmed': 'Debes confirmar tu email antes de iniciar sesión'
        };

        return errorMessages[error.message] || error.message || 'Ha ocurrido un error';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Ocultar después de 4 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Método para verificar si el usuario está autenticado
    requireAuth() {
        if (!this.isAuthenticated) {
            this.showLogin();
            return false;
        }
        return true;
    }

    // Obtener el usuario actual
    getUser() {
        return this.currentUser;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
