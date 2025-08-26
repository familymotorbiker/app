// Gestión del inventario de llantas
class TireInventoryApp {
    constructor() {
        this.tires = [];
        this.movements = [];
        this.currentEditingTire = null;
        this.isOnline = true;
        this.supabaseReady = false;
        this.authManager = null;
        
        // No inicializar inmediatamente, esperar a la autenticación
        this.waitForAuth();
    }

    waitForAuth() {
        // Esperar a que el auth manager esté disponible
        const checkAuth = () => {
            if (window.authManager) {
                this.authManager = window.authManager;
                
                // Solo inicializar si el usuario está autenticado
                if (this.authManager.isAuthenticated) {
                    this.init();
                } else {
                    // Escuchar cambios de autenticación
                    window.auth.onAuthStateChange((event, session) => {
                        if (event === 'SIGNED_IN' && session && !this.initialized) {
                            this.initialized = true;
                            this.init();
                        }
                    });
                }
            } else {
                // Retry después de 100ms
                setTimeout(checkAuth, 100);
            }
        };
        
        checkAuth();
    }

    async init() {
        this.setupEventListeners();
        await this.initializeSupabase();
        await this.loadData();
        this.renderDashboard();
        this.renderInventoryTable();
        this.renderMovementSelect();
        this.renderHistoryTable();
        this.updateStats();
    }

    async initializeSupabase() {
        try {
            if (typeof window.supabase !== 'undefined') {
                // Probar conexión
                const { data, error } = await window.supabase.from('tires').select('count');
                if (!error) {
                    this.supabaseReady = true;
                    console.log('✅ Supabase conectado correctamente');
                    this.showNotification('Conectado a base de datos', 'success');
                } else {
                    throw error;
                }
            } else {
                throw new Error('Supabase no disponible');
            }
        } catch (error) {
            console.warn('⚠️ Supabase no disponible, usando localStorage:', error);
            this.supabaseReady = false;
            this.isOnline = false;
            this.showNotification('Modo offline activado', 'warning');
        }
    }

    async loadData() {
        if (this.supabaseReady) {
            await this.loadFromSupabase();
        } else {
            this.loadFromLocalStorage();
        }
    }

    async loadFromSupabase() {
        try {
            // Cargar llantas
            const { data: tires, error: tiresError } = await window.supabase
                .from('tires')
                .select('*')
                .order('created_at', { ascending: false });

            if (tiresError) throw tiresError;

            // Cargar movimientos
            const { data: movements, error: movementsError } = await window.supabase
                .from('movements')
                .select('*')
                .order('created_at', { ascending: false });

            if (movementsError) throw movementsError;

            this.tires = tires || [];
            this.movements = movements || [];

            console.log(`✅ Cargados ${this.tires.length} llantas y ${this.movements.length} movimientos desde Supabase`);
        } catch (error) {
            console.error('Error cargando datos de Supabase:', error);
            this.showNotification('Error cargando datos, usando localStorage', 'error');
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        this.tires = JSON.parse(localStorage.getItem('tires')) || [];
        this.movements = JSON.parse(localStorage.getItem('movements')) || [];
        console.log(`📱 Cargados ${this.tires.length} llantas y ${this.movements.length} movimientos desde localStorage`);
    }

    setupEventListeners() {
        // Navegación entre tabs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Modal de agregar/editar llanta
        document.getElementById('addTireBtn').addEventListener('click', () => {
            this.openTireModal();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeTireModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeTireModal();
        });

        // Formulario de llanta
        document.getElementById('tireForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTire();
        });

        // Formulario de movimientos
        document.getElementById('movementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMovement();
        });

        // Filtros de inventario
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterInventory();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterInventory();
        });

        document.getElementById('typeFilter').addEventListener('change', () => {
            this.filterInventory();
        });

        // Filtros de historial
        document.getElementById('filterHistoryBtn').addEventListener('click', () => {
            this.filterHistory();
        });

        // Cerrar modal al hacer click fuera
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('tireModal')) {
                this.closeTireModal();
            }
        });
    }

    switchTab(tabName) {
        // Actualizar botones de navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Mostrar contenido del tab
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Actualizar datos si es necesario
        if (tabName === 'dashboard') {
            this.renderDashboard();
            this.updateStats();
        } else if (tabName === 'inventory') {
            this.renderInventoryTable();
        } else if (tabName === 'movements') {
            this.renderMovementSelect();
        } else if (tabName === 'history') {
            this.renderHistoryTable();
        }
    }

    // Gestión de llantas
    openTireModal(tire = null) {
        this.currentEditingTire = tire;
        const modal = document.getElementById('tireModal');
        const modalTitle = document.getElementById('modalTitle');
        const saveButtonText = document.getElementById('saveButtonText');

        if (tire) {
            modalTitle.textContent = 'Editar Llanta';
            saveButtonText.textContent = 'Actualizar';
            this.fillTireForm(tire);
        } else {
            modalTitle.textContent = 'Agregar Nueva Llanta';
            saveButtonText.textContent = 'Guardar';
            document.getElementById('tireForm').reset();
        }

        modal.style.display = 'block';
    }

    closeTireModal() {
        document.getElementById('tireModal').style.display = 'none';
        this.currentEditingTire = null;
    }

    fillTireForm(tire) {
        document.getElementById('tireMeasure').value = tire.measure;
        document.getElementById('tireBrand').value = tire.brand;
        document.getElementById('tireReference').value = tire.reference;
        document.getElementById('tireCategory').value = tire.category;
        document.getElementById('tireType').value = tire.type;
        document.getElementById('tirePrice').value = tire.price;
        document.getElementById('tireStock').value = tire.stock;
        document.getElementById('tireMinStock').value = tire.minStock;
    }

    async saveTire() {
        const formData = {
            measure: document.getElementById('tireMeasure').value,
            brand: document.getElementById('tireBrand').value,
            reference: document.getElementById('tireReference').value,
            category: document.getElementById('tireCategory').value,
            type: document.getElementById('tireType').value,
            price: parseFloat(document.getElementById('tirePrice').value),
            stock: parseInt(document.getElementById('tireStock').value) || 0,
            min_stock: parseInt(document.getElementById('tireMinStock').value) || 5
        };

        try {
            if (this.currentEditingTire) {
                // Editar llanta existente
                await this.updateTire(this.currentEditingTire.id, formData);
            } else {
                // Agregar nueva llanta
                await this.createTire(formData);
            }

            this.closeTireModal();
            await this.loadData();
            this.renderInventoryTable();
            this.renderMovementSelect();
            this.updateStats();
            this.showNotification('Llanta guardada exitosamente', 'success');
        } catch (error) {
            console.error('Error guardando llanta:', error);
            this.showNotification('Error guardando llanta', 'error');
        }
    }

    async createTire(tireData) {
        if (this.supabaseReady) {
            // Agregar user_id automáticamente (el trigger de la DB se encargará)
            const { data, error } = await window.supabase
                .from('tires')
                .insert([tireData])
                .select()
                .single();

            if (error) throw error;

            // Si tiene stock inicial, registrar movimiento
            if (tireData.stock > 0) {
                await this.createMovement({
                    tire_id: data.id,
                    type: 'entrada',
                    quantity: tireData.stock,
                    old_stock: 0,
                    new_stock: tireData.stock,
                    reason: 'Stock inicial'
                });
            }

            return data;
        } else {
            // Fallback a localStorage
            const newTire = {
                id: Date.now().toString(),
                ...tireData,
                created_at: new Date().toISOString()
            };
            this.tires.push(newTire);
            
            if (tireData.stock > 0) {
                this.registerMovement(newTire, 'entrada', tireData.stock, 0, 'Stock inicial');
            }
            
            this.saveToLocalStorage();
            return newTire;
        }
    }

    async updateTire(tireId, tireData) {
        if (this.supabaseReady) {
            const { data, error } = await window.supabase
                .from('tires')
                .update(tireData)
                .eq('id', tireId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Fallback a localStorage
            const index = this.tires.findIndex(t => t.id === tireId);
            if (index !== -1) {
                this.tires[index] = { ...this.tires[index], ...tireData };
                this.saveToLocalStorage();
                return this.tires[index];
            }
        }
    }

    async deleteTire(tireId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta llanta? Esta acción no se puede deshacer.')) {
            try {
                if (this.supabaseReady) {
                    const { error } = await window.supabase
                        .from('tires')
                        .delete()
                        .eq('id', tireId);
                    
                    if (error) throw error;
                } else {
                    this.tires = this.tires.filter(t => t.id !== tireId);
                    this.saveToLocalStorage();
                }

                await this.loadData();
                this.renderInventoryTable();
                this.renderMovementSelect();
                this.updateStats();
                this.showNotification('Llanta eliminada exitosamente', 'success');
            } catch (error) {
                console.error('Error eliminando llanta:', error);
                this.showNotification('Error eliminando llanta', 'error');
            }
        }
    }

    async adjustStock(tireId, change) {
        const tire = this.tires.find(t => t.id === tireId);
        if (!tire) return;

        const oldStock = tire.stock;
        const newStock = oldStock + change;

        // Validar que no sea negativo
        if (newStock < 0) {
            this.showNotification('El stock no puede ser negativo', 'error');
            return;
        }

        try {
            // Actualizar stock
            await this.updateTire(tireId, { stock: newStock });

            // Registrar movimiento
            const movementType = change > 0 ? 'entrada' : 'salida';
            const reason = change > 0 ? 'Ajuste rápido: +1' : 'Ajuste rápido: -1';
            
            await this.createMovement({
                tire_id: tireId,
                type: movementType,
                quantity: Math.abs(change),
                old_stock: oldStock,
                new_stock: newStock,
                reason: reason
            });

            // Actualizar interfaz
            await this.loadData();
            this.renderInventoryTable();
            this.renderMovementSelect();
            this.renderHistoryTable();
            this.updateStats();
        } catch (error) {
            console.error('Error ajustando stock:', error);
            this.showNotification('Error ajustando stock', 'error');
        }
    }

    // Gestión de movimientos
    async saveMovement() {
        const tireId = document.getElementById('movementTire').value;
        const type = document.getElementById('movementType').value;
        const quantity = parseInt(document.getElementById('movementQuantity').value);
        const reason = document.getElementById('movementReason').value;

        const tire = this.tires.find(t => t.id === tireId);
        if (!tire) {
            this.showNotification('Selecciona una llanta válida', 'error');
            return;
        }

        const oldStock = tire.stock;
        let newStock = oldStock;

        if (type === 'entrada') {
            newStock = oldStock + quantity;
        } else if (type === 'salida' || type === 'transferencia') {
            if (quantity > oldStock) {
                this.showNotification('No hay suficiente stock para realizar esta operación', 'error');
                return;
            }
            newStock = oldStock - quantity;
        } else if (type === 'ajuste') {
            newStock = quantity; // Para ajustes, la cantidad es el nuevo stock
        }

        try {
            // Actualizar stock
            await this.updateTire(tireId, { stock: newStock });

            // Registrar movimiento
            await this.createMovement({
                tire_id: tireId,
                type: type,
                quantity: quantity,
                old_stock: oldStock,
                new_stock: newStock,
                reason: reason || ''
            });

            // Limpiar formulario
            document.getElementById('movementForm').reset();

            // Actualizar interfaz
            await this.loadData();
            this.renderInventoryTable();
            this.renderHistoryTable();
            this.renderMovementSelect();
            this.updateStats();

            this.showNotification('Movimiento registrado exitosamente', 'success');
        } catch (error) {
            console.error('Error registrando movimiento:', error);
            this.showNotification('Error registrando movimiento', 'error');
        }
    }

    async createMovement(movementData) {
        if (this.supabaseReady) {
            const { data, error } = await window.supabase
                .from('movements')
                .insert([movementData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Fallback a localStorage
            const tire = this.tires.find(t => t.id === movementData.tire_id);
            const movement = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                tireId: movementData.tire_id,
                tireName: tire ? `${tire.brand} ${tire.reference} ${tire.measure}` : 'Llanta eliminada',
                type: movementData.type,
                quantity: movementData.quantity,
                oldStock: movementData.old_stock,
                newStock: movementData.new_stock,
                reason: movementData.reason || '',
                date: new Date().toISOString()
            };

            this.movements.push(movement);
            this.saveToLocalStorage();
            return movement;
        }
    }

    // Renderizado
    renderDashboard() {
        this.renderCategoryChart();
        this.renderBrandChart();
    }

    renderCategoryChart() {
        const categoryStats = this.tires.reduce((acc, tire) => {
            acc[tire.category] = (acc[tire.category] || 0) + tire.stock;
            return acc;
        }, {});

        const chartContainer = document.getElementById('categoryChart');
        const maxValue = Math.max(...Object.values(categoryStats));
        
        chartContainer.innerHTML = Object.entries(categoryStats)
            .map(([category, stock]) => `
                <div class="chart-item">
                    <span>${category}</span>
                    <span>${stock} unidades</span>
                </div>
                <div class="chart-bar" style="width: ${(stock / maxValue) * 100}%"></div>
            `).join('');
    }

    renderBrandChart() {
        const brandStats = this.tires.reduce((acc, tire) => {
            acc[tire.brand] = (acc[tire.brand] || 0) + tire.stock;
            return acc;
        }, {});

        const chartContainer = document.getElementById('brandChart');
        const maxValue = Math.max(...Object.values(brandStats));
        
        chartContainer.innerHTML = Object.entries(brandStats)
            .map(([brand, stock]) => `
                <div class="chart-item">
                    <span>${brand}</span>
                    <span>${stock} unidades</span>
                </div>
                <div class="chart-bar" style="width: ${(stock / maxValue) * 100}%"></div>
            `).join('');
    }

    renderInventoryTable() {
        const tbody = document.getElementById('inventoryTableBody');
        
        if (this.tires.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No hay llantas registradas</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.tires.map(tire => `
            <tr>
                <td>${tire.measure}</td>
                <td>${tire.brand}</td>
                <td>${tire.reference}</td>
                <td>${tire.category}</td>
                <td>${tire.type}</td>
                <td>
                    <span class="stock-badge ${this.getStockClass(tire.stock, tire.minStock)}">
                        ${tire.stock}
                    </span>
                </td>
                <td>$${tire.price.toFixed(2)}</td>
                <td>
                    <div class="stock-controls">
                        <button class="btn btn-stock btn-minus" onclick="app.adjustStock('${tire.id}', -1)" ${tire.stock <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="stock-display">${tire.stock}</span>
                        <button class="btn btn-stock btn-plus" onclick="app.adjustStock('${tire.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="app.openTireModal(${JSON.stringify(tire).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="app.deleteTire('${tire.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderMovementSelect() {
        const select = document.getElementById('movementTire');
        select.innerHTML = '<option value="">Seleccionar llanta...</option>' +
            this.tires.map(tire => `
                <option value="${tire.id}">${tire.brand} ${tire.reference} ${tire.measure} (Stock: ${tire.stock})</option>
            `).join('');
    }

    renderHistoryTable() {
        const tbody = document.getElementById('historyTableBody');
        
        if (this.movements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No hay movimientos registrados</td>
                </tr>
            `;
            return;
        }

        const sortedMovements = [...this.movements].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sortedMovements.map(movement => `
            <tr>
                <td>${new Date(movement.date).toLocaleString()}</td>
                <td>${movement.tireName}</td>
                <td>
                    <span class="movement-type movement-${movement.type}">
                        ${this.getMovementTypeLabel(movement.type)}
                    </span>
                </td>
                <td>${movement.quantity}</td>
                <td>${movement.oldStock}</td>
                <td>${movement.newStock}</td>
                <td>${movement.reason}</td>
            </tr>
        `).join('');
    }

    // Filtros
    filterInventory() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        const filteredTires = this.tires.filter(tire => {
            const matchesSearch = tire.brand.toLowerCase().includes(searchTerm) ||
                                tire.reference.toLowerCase().includes(searchTerm) ||
                                tire.measure.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || tire.category === categoryFilter;
            const matchesType = !typeFilter || tire.type === typeFilter;

            return matchesSearch && matchesCategory && matchesType;
        });

        this.renderFilteredInventory(filteredTires);
    }

    renderFilteredInventory(filteredTires) {
        const tbody = document.getElementById('inventoryTableBody');
        
        if (filteredTires.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No se encontraron resultados</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredTires.map(tire => `
            <tr>
                <td>${tire.measure}</td>
                <td>${tire.brand}</td>
                <td>${tire.reference}</td>
                <td>${tire.category}</td>
                <td>${tire.type}</td>
                <td>
                    <span class="stock-badge ${this.getStockClass(tire.stock, tire.minStock)}">
                        ${tire.stock}
                    </span>
                </td>
                <td>$${tire.price.toFixed(2)}</td>
                <td>
                    <div class="stock-controls">
                        <button class="btn btn-stock btn-minus" onclick="app.adjustStock('${tire.id}', -1)" ${tire.stock <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="stock-display">${tire.stock}</span>
                        <button class="btn btn-stock btn-plus" onclick="app.adjustStock('${tire.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="app.openTireModal(${JSON.stringify(tire).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="app.deleteTire('${tire.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterHistory() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const typeFilter = document.getElementById('historyTypeFilter').value;

        let filteredMovements = [...this.movements];

        if (startDate) {
            filteredMovements = filteredMovements.filter(movement => 
                new Date(movement.date) >= new Date(startDate)
            );
        }

        if (endDate) {
            filteredMovements = filteredMovements.filter(movement => 
                new Date(movement.date) <= new Date(endDate + 'T23:59:59')
            );
        }

        if (typeFilter) {
            filteredMovements = filteredMovements.filter(movement => 
                movement.type === typeFilter
            );
        }

        this.renderFilteredHistory(filteredMovements);
    }

    renderFilteredHistory(filteredMovements) {
        const tbody = document.getElementById('historyTableBody');
        
        if (filteredMovements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No se encontraron movimientos</td>
                </tr>
            `;
            return;
        }

        const sortedMovements = filteredMovements.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sortedMovements.map(movement => `
            <tr>
                <td>${new Date(movement.date).toLocaleString()}</td>
                <td>${movement.tireName}</td>
                <td>
                    <span class="movement-type movement-${movement.type}">
                        ${this.getMovementTypeLabel(movement.type)}
                    </span>
                </td>
                <td>${movement.quantity}</td>
                <td>${movement.oldStock}</td>
                <td>${movement.newStock}</td>
                <td>${movement.reason}</td>
            </tr>
        `).join('');
    }

    // Estadísticas
    updateStats() {
        const totalTires = this.tires.reduce((sum, tire) => sum + tire.stock, 0);
        const totalValue = this.tires.reduce((sum, tire) => sum + (tire.stock * tire.price), 0);
        const todayMovements = this.movements.filter(movement => {
            const today = new Date().toDateString();
            const movementDate = new Date(movement.date).toDateString();
            return today === movementDate;
        }).length;
        const lowStock = this.tires.filter(tire => tire.stock <= tire.minStock).length;

        document.getElementById('totalTires').textContent = totalTires;
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('todayMovements').textContent = todayMovements;
        document.getElementById('lowStock').textContent = lowStock;
    }

    // Utilidades
    getStockClass(stock, minStock) {
        if (stock <= minStock) return 'stock-low';
        if (stock <= minStock * 2) return 'stock-medium';
        return 'stock-high';
    }

    getMovementTypeLabel(type) {
        const labels = {
            'entrada': 'Entrada',
            'salida': 'Salida',
            'transferencia': 'Transferencia',
            'ajuste': 'Ajuste'
        };
        return labels[type] || type;
    }

    saveToLocalStorage() {
        localStorage.setItem('tires', JSON.stringify(this.tires));
        localStorage.setItem('movements', JSON.stringify(this.movements));
    }

    // Sistema de notificaciones
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Migrar datos de localStorage a Supabase
    async migrateLocalDataToSupabase() {
        if (!this.supabaseReady) return;
        
        const localTires = JSON.parse(localStorage.getItem('tires')) || [];
        const localMovements = JSON.parse(localStorage.getItem('movements')) || [];
        
        if (localTires.length === 0) return;
        
        try {
            // Migrar llantas
            for (const tire of localTires) {
                const tireData = {
                    measure: tire.measure,
                    brand: tire.brand,
                    reference: tire.reference,
                    category: tire.category,
                    type: tire.type,
                    price: tire.price,
                    stock: tire.stock,
                    min_stock: tire.minStock || 5
                };
                
                await this.createTire(tireData);
            }
            
            this.showNotification(`Migrados ${localTires.length} llantas a Supabase`, 'success');
            
            // Limpiar localStorage después de migración exitosa
            localStorage.removeItem('tires');
            localStorage.removeItem('movements');
            
        } catch (error) {
            console.error('Error migrando datos:', error);
            this.showNotification('Error migrando datos locales', 'error');
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const app = new TireInventoryApp();
    window.app = app; // Hacer accesible globalmente para los onclick
});
