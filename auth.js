// Sistema de autenticación para Inventario de Llantas
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
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
        // Si estamos en la página de auth, recargar para mostrar la app
        if (document.querySelector('.auth-container')) {
            window.location.reload();
        }
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
