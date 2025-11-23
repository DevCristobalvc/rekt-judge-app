/**
 * REKT JUDGE - Main Application
 * Terminal-style interface for human validation
 */

const App = (() => {
    // State
    let state = {
        adminAddress: null,
        isAdmin: false,
        participants: [],
        filteredParticipants: [],
        validatedHumans: [],
        events: [],
        currentFilter: 'all',
        currentTab: 'gallery',
        selectedParticipants: [],
        processingIds: new Set()
    };

    // UI Elements
    const elements = {
        connectBtn: document.getElementById('connectBtn'),
        connectionStatus: document.getElementById('connectionStatus'),
        adminInfo: document.getElementById('adminInfo'),
        adminAddress: document.getElementById('adminAddress'),
        statsSection: document.getElementById('statsSection'),
        tabsSection: document.getElementById('tabsSection'),
        
        // Stats
        totalHumans: document.getElementById('totalHumans'),
        validatedCount: document.getElementById('validatedCount'),
        pendingCount: document.getElementById('pendingCount'),
        totalEvents: document.getElementById('totalEvents'),
        
        // Gallery
        galleryTab: document.getElementById('galleryTab'),
        loadingGallery: document.getElementById('loadingGallery'),
        galleryGrid: document.getElementById('galleryGrid'),
        emptyGallery: document.getElementById('emptyGallery'),
        
        // Events
        eventsTab: document.getElementById('eventsTab'),
        createEventBtn: document.getElementById('createEventBtn'),
        createEventForm: document.getElementById('createEventForm'),
        eventNameInput: document.getElementById('eventNameInput'),
        participantsList: document.getElementById('participantsList'),
        selectedCount: document.getElementById('selectedCount'),
        selectAllBtn: document.getElementById('selectAllBtn'),
        submitEventBtn: document.getElementById('submitEventBtn'),
        cancelEventBtn: document.getElementById('cancelEventBtn'),
        loadingEvents: document.getElementById('loadingEvents'),
        eventsGrid: document.getElementById('eventsGrid'),
        eventsList: document.getElementById('eventsList'),
        emptyEvents: document.getElementById('emptyEvents'),
        
        // Logs
        logsTab: document.getElementById('logsTab'),
        systemLogs: document.getElementById('systemLogs'),
        clearLogsBtn: document.getElementById('clearLogsBtn'),
        
        // Modal
        imageModal: document.getElementById('imageModal'),
        modalImage: document.getElementById('modalImage'),
        modalAddress: document.getElementById('modalAddress'),
        modalIpfs: document.getElementById('modalIpfs'),
        modalStatus: document.getElementById('modalStatus'),
        
        // Toast
        toastContainer: document.getElementById('toastContainer')
    };

    /**
     * Initialize app
     */
    function init() {
        log('info', 'Initializing REKT JUDGE terminal...');
        attachEventListeners();
        checkFreighterInstalled();
    }

    /**
     * Check if Freighter is installed
     */
    function checkFreighterInstalled() {
        if (!window.freighter) {
            log('error', 'Freighter wallet not detected');
            showToast('ERROR: Freighter wallet extension required', 'error');
        } else {
            log('success', 'Freighter wallet detected');
        }
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        // Connection
        elements.connectBtn.addEventListener('click', handleConnect);
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                switchTab(tab);
            });
        });
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                applyFilter(filter);
            });
        });
        
        // Events
        elements.createEventBtn.addEventListener('click', showCreateEventForm);
        elements.cancelEventBtn.addEventListener('click', hideCreateEventForm);
        elements.submitEventBtn.addEventListener('click', handleCreateEvent);
        elements.selectAllBtn.addEventListener('click', selectAllValidated);
        
        // Modal
        elements.imageModal.querySelector('.modal-close').addEventListener('click', closeModal);
        elements.imageModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
        // Logs
        elements.clearLogsBtn.addEventListener('click', clearLogs);
    }

    /**
     * Handle wallet connection
     */
    async function handleConnect() {
        try {
            elements.connectBtn.disabled = true;
            elements.connectBtn.innerHTML = '<span class="btn-icon">⏳</span> CONNECTING...';
            
            log('info', 'Attempting admin wallet connection...');
            
            const address = await ContractService.connectAdminWallet();
            
            log('success', `Connected: ${address}`);
            
            const isAdminUser = await ContractService.isAdmin(address);
            
            if (!isAdminUser) {
                throw new Error('ACCESS_DENIED: Not authorized as admin');
            }
            
            state.adminAddress = address;
            state.isAdmin = true;
            
            // Update UI
            elements.connectionStatus.classList.remove('offline');
            elements.connectionStatus.classList.add('online');
            elements.connectionStatus.querySelector('.status-text').textContent = 'CONNECTED';
            
            elements.adminInfo.style.display = 'flex';
            elements.adminAddress.textContent = formatAddress(address);
            
            elements.connectBtn.style.display = 'none';
            
            elements.statsSection.style.display = 'block';
            elements.tabsSection.style.display = 'flex';
            
            log('success', 'Admin privileges granted');
            showToast('ADMIN_ACCESS_GRANTED', 'success');
            
            // Load initial data
            await Promise.all([
                loadStats(),
                loadParticipants(),
                loadEvents()
            ]);
            
        } catch (error) {
            log('error', error.message);
            showToast(error.message, 'error');
            elements.connectBtn.disabled = false;
            elements.connectBtn.innerHTML = '<span class="btn-icon">▶</span> CONNECT_ADMIN_WALLET';
        }
    }

    /**
     * Load statistics
     */
    async function loadStats() {
        try {
            log('info', 'Loading contract statistics...');
            const stats = await ContractService.getContractStats();
            
            elements.totalHumans.textContent = stats.totalHumans;
            elements.validatedCount.textContent = stats.validatedCount;
            elements.pendingCount.textContent = stats.pendingCount;
            elements.totalEvents.textContent = stats.totalEvents;
            
            updateFilterCounts();
            
            log('success', `Stats loaded: ${stats.totalHumans} humans, ${stats.totalEvents} events`);
        } catch (error) {
            log('error', `Failed to load stats: ${error.message}`);
        }
    }

    /**
     * Load participants
     */
    async function loadParticipants() {
        try {
            log('info', 'Fetching participant data...');
            
            elements.loadingGallery.style.display = 'block';
            elements.galleryGrid.style.display = 'none';
            elements.emptyGallery.style.display = 'none';
            
            const participants = await ContractService.getAllHumans(0, 100);
            state.participants = participants;
            
            log('success', `Loaded ${participants.length} participants`);
            
            applyFilter(state.currentFilter);
            
        } catch (error) {
            log('error', `Failed to load participants: ${error.message}`);
            elements.loadingGallery.style.display = 'none';
            elements.emptyGallery.style.display = 'block';
        }
    }

    /**
     * Apply filter to participants
     */
    function applyFilter(filter) {
        state.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Filter participants
        if (filter === 'all') {
            state.filteredParticipants = state.participants;
        } else if (filter === 'validated') {
            state.filteredParticipants = state.participants.filter(p => p.validated);
        } else if (filter === 'pending') {
            state.filteredParticipants = state.participants.filter(p => !p.validated);
        }
        
        renderGallery();
        updateFilterCounts();
    }

    /**
     * Update filter counts
     */
    function updateFilterCounts() {
        document.getElementById('filterAllCount').textContent = state.participants.length;
        document.getElementById('filterValidatedCount').textContent = 
            state.participants.filter(p => p.validated).length;
        document.getElementById('filterPendingCount').textContent = 
            state.participants.filter(p => !p.validated).length;
    }

    /**
     * Render gallery
     */
    function renderGallery() {
        elements.loadingGallery.style.display = 'none';
        
        if (state.filteredParticipants.length === 0) {
            elements.galleryGrid.style.display = 'none';
            elements.emptyGallery.style.display = 'block';
            return;
        }
        
        elements.emptyGallery.style.display = 'none';
        elements.galleryGrid.style.display = 'grid';
        
        elements.galleryGrid.innerHTML = state.filteredParticipants.map(participant => {
            const isProcessing = state.processingIds.has(participant.address);
            const statusClass = participant.validated ? 'validated' : 'pending';
            const statusIcon = participant.validated ? '✓' : '⏳';
            
            return `
                <div class="participant-card ${statusClass}">
                    <div class="image-container" onclick="App.openImage('${participant.address}')">
                        <img src="${ContractService.getImageDataUrl(participant.imageData)}" 
                             alt="${participant.address}"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect fill=%22%23222%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%2300ff41%22>ERROR</text></svg>'">
                        <div class="status-badge">${statusIcon}</div>
                    </div>
                    <div class="card-info">
                        <div class="address-short">${formatAddress(participant.address)}</div>
                        <div class="card-actions">
                            ${!participant.validated ? `
                                <button class="btn-validate" 
                                        onclick="App.validateParticipant('${participant.address}', true)"
                                        ${isProcessing ? 'disabled' : ''}>
                                    ${isProcessing ? '⏳' : '✓ VALIDATE'}
                                </button>
                            ` : `
                                <button class="btn-reject" 
                                        onclick="App.validateParticipant('${participant.address}', false)"
                                        ${isProcessing ? 'disabled' : ''}>
                                    ${isProcessing ? '⏳' : '✗ REJECT'}
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Validate/reject participant
     */
    async function validateParticipant(address, validated) {
        try {
            state.processingIds.add(address);
            renderGallery();
            
            const action = validated ? 'VALIDATING' : 'REJECTING';
            log('info', `${action} participant: ${formatAddress(address)}`);
            
            const result = await ContractService.updateHumanValidation(
                state.adminAddress,
                address,
                validated
            );
            
            // Update local state
            const participant = state.participants.find(p => p.address === address);
            if (participant) {
                participant.validated = validated;
            }
            
            state.processingIds.delete(address);
            
            const status = validated ? 'VALIDATED' : 'REJECTED';
            log('success', `${status}: ${formatAddress(address)} | TX: ${result.txHash.slice(0, 8)}...`);
            showToast(`${status}: ${formatAddress(address)}`, 'success');
            
            // Refresh display
            applyFilter(state.currentFilter);
            await loadStats();
            
        } catch (error) {
            state.processingIds.delete(address);
            log('error', `Validation failed: ${error.message}`);
            showToast(`ERROR: ${error.message}`, 'error');
            renderGallery();
        }
    }

    /**
     * Open image modal
     */
    function openImage(address) {
        const participant = state.participants.find(p => p.address === address);
        if (!participant) return;
        
        elements.modalImage.src = ContractService.getImageDataUrl(participant.imageData);
        elements.modalAddress.textContent = participant.address;
        elements.modalIpfs.textContent = 'Base64 Image Data';
        elements.modalStatus.innerHTML = participant.validated 
            ? '<span class="badge badge-success">VALIDATED</span>'
            : '<span class="badge" style="background: #ffaa00; color: #000;">PENDING</span>';
        
        elements.imageModal.classList.add('active');
    }

    /**
     * Close modal
     */
    function closeModal() {
        elements.imageModal.classList.remove('active');
    }

    /**
     * Switch tab
     */
    function switchTab(tab) {
        state.currentTab = tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Show/hide content
        elements.galleryTab.classList.toggle('active', tab === 'gallery');
        elements.eventsTab.classList.toggle('active', tab === 'events');
        elements.logsTab.classList.toggle('active', tab === 'logs');
        
        log('info', `Switched to ${tab.toUpperCase()} tab`);
    }

    /**
     * Load events
     */
    async function loadEvents() {
        try {
            log('info', 'Loading events...');
            
            elements.loadingEvents.style.display = 'block';
            elements.eventsGrid.style.display = 'none';
            elements.emptyEvents.style.display = 'none';
            
            const events = await ContractService.getEvents(0, 50);
            state.events = events;
            
            log('success', `Loaded ${events.length} events`);
            
            renderEvents();
            
        } catch (error) {
            log('error', `Failed to load events: ${error.message}`);
            elements.loadingEvents.style.display = 'none';
            elements.emptyEvents.style.display = 'block';
        }
    }

    /**
     * Render events
     */
    function renderEvents() {
        elements.loadingEvents.style.display = 'none';
        
        if (state.events.length === 0) {
            elements.eventsGrid.style.display = 'none';
            elements.emptyEvents.style.display = 'block';
            return;
        }
        
        elements.emptyEvents.style.display = 'none';
        elements.eventsGrid.style.display = 'grid';
        
        elements.eventsGrid.innerHTML = state.events.map(event => `
            <div class="event-card">
                <div class="event-header">
                    <div class="event-name">${event.name}</div>
                    <div class="event-id">ID: ${event.id}</div>
                </div>
                <div class="event-stats">
                    <div>PARTICIPANTS: ${event.participants.length}</div>
                </div>
                <button class="terminal-btn small" onclick="App.viewEventDetails(${event.id})">
                    VIEW_DETAILS
                </button>
            </div>
        `).join('');
    }

    /**
     * Show create event form
     */
    async function showCreateEventForm() {
        try {
            elements.createEventForm.style.display = 'block';
            elements.eventsList.style.display = 'none';
            
            log('info', 'Loading validated humans for event creation...');
            
            // Load validated humans
            const validated = await ContractService.getValidatedHumans();
            state.validatedHumans = validated;
            state.selectedParticipants = [];
            
            renderParticipantsList();
            
        } catch (error) {
            log('error', `Failed to load validated humans: ${error.message}`);
            showToast('ERROR: Failed to load participants', 'error');
        }
    }

    /**
     * Hide create event form
     */
    function hideCreateEventForm() {
        elements.createEventForm.style.display = 'none';
        elements.eventsList.style.display = 'block';
        elements.eventNameInput.value = '';
        state.selectedParticipants = [];
    }

    /**
     * Render participants list for event
     */
    function renderParticipantsList() {
        if (state.validatedHumans.length === 0) {
            elements.participantsList.innerHTML = '<div class="empty-state"><p>NO_VALIDATED_HUMANS_AVAILABLE</p></div>';
            return;
        }
        
        elements.participantsList.innerHTML = state.validatedHumans.map(address => {
            const isSelected = state.selectedParticipants.includes(address);
            return `
                <div class="participant-item ${isSelected ? 'selected' : ''}" 
                     onclick="App.toggleParticipant('${address}')">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="App.toggleParticipant('${address}')">
                    <span class="address">${formatAddress(address)}</span>
                    <span class="badge badge-success">✓</span>
                </div>
            `;
        }).join('');
        
        elements.selectedCount.textContent = state.selectedParticipants.length;
    }

    /**
     * Toggle participant selection
     */
    function toggleParticipant(address) {
        if (state.selectedParticipants.includes(address)) {
            state.selectedParticipants = state.selectedParticipants.filter(a => a !== address);
        } else {
            state.selectedParticipants.push(address);
        }
        
        renderParticipantsList();
    }

    /**
     * Select all validated
     */
    function selectAllValidated() {
        state.selectedParticipants = [...state.validatedHumans];
        renderParticipantsList();
    }

    /**
     * Handle create event
     */
    async function handleCreateEvent() {
        try {
            const eventName = elements.eventNameInput.value.trim();
            
            if (!eventName) {
                showToast('ERROR: Enter event name', 'error');
                return;
            }
            
            if (state.selectedParticipants.length === 0) {
                showToast('ERROR: Select at least one participant', 'error');
                return;
            }
            
            elements.submitEventBtn.disabled = true;
            elements.submitEventBtn.innerHTML = '<span class="btn-icon">⏳</span> CREATING...';
            
            log('info', `Creating event: ${eventName} with ${state.selectedParticipants.length} participants`);
            
            const result = await ContractService.createEvent(
                state.adminAddress,
                eventName,
                state.selectedParticipants
            );
            
            log('success', `Event created! ID: ${result.eventId} | TX: ${result.txHash.slice(0, 8)}...`);
            showToast(`EVENT_CREATED: ${eventName} (ID: ${result.eventId})`, 'success');
            
            // Reset and reload
            hideCreateEventForm();
            await Promise.all([loadEvents(), loadStats()]);
            
        } catch (error) {
            log('error', `Event creation failed: ${error.message}`);
            showToast(`ERROR: ${error.message}`, 'error');
        } finally {
            elements.submitEventBtn.disabled = false;
            elements.submitEventBtn.innerHTML = '<span class="btn-icon">✓</span> CREATE_EVENT';
        }
    }

    /**
     * View event details
     */
    function viewEventDetails(eventId) {
        const event = state.events.find(e => e.id === eventId);
        if (!event) return;
        
        log('info', `Event ${eventId}: ${event.name} - ${event.participants.length} participants`);
        showToast(`Event: ${event.name}`, 'info');
    }

    /**
     * Logging
     */
    function log(type, message) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const typeUpper = type.toUpperCase();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-type">[${typeUpper}]</span>
            <span class="log-message">${message}</span>
        `;
        
        elements.systemLogs.appendChild(logEntry);
        elements.systemLogs.scrollTop = elements.systemLogs.scrollHeight;
    }

    /**
     * Clear logs
     */
    function clearLogs() {
        elements.systemLogs.innerHTML = '';
        log('info', 'Logs cleared');
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    /**
     * Format address
     */
    function formatAddress(address) {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    // Public API
    return {
        init,
        validateParticipant,
        openImage,
        toggleParticipant,
        viewEventDetails
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
