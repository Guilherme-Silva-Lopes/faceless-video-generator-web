/**
 * Faceless Video Generator - Frontend JavaScript
 * Handles all UI interactions and API calls
 */

// =====================================================
// STATE & CONFIG
// =====================================================

const API_BASE = '';  // Same origin
let currentPage = 'dashboard';
let data = {
    channels: [],
    projects: [],
    settings: [],
    stats: null
};

// Language configuration
const LANGUAGES = {
    'pt-BR': { name: 'Português (BR)', flag: '🇧🇷' },
    'en-US': { name: 'English (US)', flag: '🇺🇸' },
    'es-ES': { name: 'Español', flag: '🇪🇸' },
    'ja-JP': { name: '日本語', flag: '🇯🇵' },
    'it-IT': { name: 'Italiano', flag: '🇮🇹' }
};

// Status configuration
const STATUS_CONFIG = {
    'queued': { label: 'Queued', class: 'status-queued', icon: '⏳' },
    'processing': { label: 'Processing', class: 'status-processing', icon: '🔄' },
    'script_done': { label: 'Script Done', class: 'status-processing', icon: '📝' },
    'packaging_done': { label: 'Packaging Done', class: 'status-processing', icon: '📦' },
    'rendering': { label: 'Rendering', class: 'status-processing', icon: '🎬' },
    'done': { label: 'Done', class: 'status-done', icon: '✅' },
    'error': { label: 'Error', class: 'status-error', icon: '❌' }
};

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadPage('dashboard');
});

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;

            // Update active state
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            loadPage(page);
        });
    });
}

// =====================================================
// PAGE LOADING
// =====================================================

async function loadPage(page) {
    currentPage = page;
    document.getElementById('pageTitle').textContent = getPageTitle(page);

    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        switch (page) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'channels':
                await loadChannels();
                break;
            case 'projects':
                await loadProjects();
                break;
            case 'settings':
                await loadSettings();
                break;
        }
    } catch (error) {
        showToast('Error loading page: ' + error.message, 'error');
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3 class="empty-state-title">Error Loading Data</h3>
                <p class="empty-state-text">${error.message}</p>
                <button class="btn btn-primary" onclick="loadPage('${page}')">Retry</button>
            </div>
        `;
    }
}

function getPageTitle(page) {
    const titles = {
        'dashboard': 'Dashboard',
        'channels': 'Channels',
        'projects': 'Projects',
        'settings': 'Settings'
    };
    return titles[page] || 'Dashboard';
}

function refreshData() {
    loadPage(currentPage);
}

// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {
    const [stats, projects] = await Promise.all([
        fetchAPI('/api/stats'),
        fetchAPI('/api/projects?limit=10')
    ]);

    data.stats = stats;
    data.projects = projects;

    const content = document.getElementById('content');
    content.innerHTML = `
        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.total_channels}</div>
                <div class="stat-label">Total Channels</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.active_channels}</div>
                <div class="stat-label">Active Channels</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.total_projects}</div>
                <div class="stat-label">Total Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.projects_by_status?.done || 0}</div>
                <div class="stat-label">Videos Done</div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="card" style="margin-bottom: 2rem;">
            <div class="card-header">
                <h3 class="card-title">Quick Actions</h3>
            </div>
            <div class="card-body" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="showAddVideoModal()">
                    ➕ Add Video Manually
                </button>
                <button class="btn btn-secondary" onclick="triggerScraper()">
                    🔄 Run Scraper
                </button>
                <button class="btn btn-secondary" onclick="loadPage('channels')">
                    📺 Manage Channels
                </button>
            </div>
        </div>
        
        <!-- Recent Projects -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Recent Projects</h3>
                <button class="btn btn-ghost btn-sm" onclick="loadPage('projects')">View All →</button>
            </div>
            ${renderProjectsTable(projects.slice(0, 5))}
        </div>
    `;
}

// =====================================================
// CHANNELS
// =====================================================

async function loadChannels() {
    data.channels = await fetchAPI('/api/channels');

    const content = document.getElementById('content');

    if (data.channels.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📺</div>
                <h3 class="empty-state-title">No Channels Yet</h3>
                <p class="empty-state-text">Add YouTube channels to monitor for viral videos.</p>
                <button class="btn btn-primary" onclick="showAddChannelModal()">➕ Add Channel</button>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
            <button class="btn btn-primary" onclick="showAddChannelModal()">➕ Add Channel</button>
        </div>
        
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Channel</th>
                        <th>Language</th>
                        <th>Niche</th>
                        <th>Viral Threshold</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.channels.map(ch => `
                        <tr>
                            <td>
                                <div style="display: flex; flex-direction: column;">
                                    <strong>${escapeHtml(ch.channel_name)}</strong>
                                    <span style="color: var(--text-muted); font-size: 0.75rem;">${ch.channel_id}</span>
                                </div>
                            </td>
                            <td>
                                <span class="language-flag">
                                    <span class="flag-icon">${LANGUAGES[ch.language]?.flag || '🌐'}</span>
                                    ${LANGUAGES[ch.language]?.name || ch.language}
                                </span>
                            </td>
                            <td>${escapeHtml(ch.niche || '-')}</td>
                            <td>${ch.viral_threshold_views.toLocaleString()} views</td>
                            <td>
                                <span class="badge ${ch.is_active ? 'badge-success' : 'badge-neutral'}">
                                    ${ch.is_active ? 'Active' : 'Paused'}
                                </span>
                            </td>
                            <td>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-ghost btn-sm" onclick="showEditChannelModal('${ch.id}')" title="Edit">✏️</button>
                                    <button class="btn btn-ghost btn-sm" onclick="toggleChannelStatus('${ch.id}', ${!ch.is_active})" title="${ch.is_active ? 'Pause' : 'Activate'}">
                                        ${ch.is_active ? '⏸️' : '▶️'}
                                    </button>
                                    <button class="btn btn-ghost btn-sm" onclick="deleteChannel('${ch.id}')" title="Delete">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddChannelModal() {
    openModal('Add Channel', `
        <form id="channelForm" onsubmit="submitChannel(event)">
            <div class="form-group">
                <label class="form-label">Channel ID *</label>
                <input type="text" class="form-input" name="channel_id" placeholder="UCxxxxxxxxxx" required>
                <small style="color: var(--text-muted); font-size: 0.75rem;">
                    Find it in the channel URL: youtube.com/channel/<strong>UCxxxxxxxxxx</strong>
                </small>
            </div>
            
            <div class="form-group">
                <label class="form-label">Channel Name *</label>
                <input type="text" class="form-input" name="channel_name" placeholder="My Channel" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Language</label>
                    <select class="form-select" name="language">
                        ${Object.entries(LANGUAGES).map(([code, lang]) =>
        `<option value="${code}">${lang.flag} ${lang.name}</option>`
    ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Niche</label>
                    <input type="text" class="form-input" name="niche" placeholder="Drama, Stories, etc.">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Viral Threshold (views)</label>
                    <input type="number" class="form-input" name="viral_threshold_views" value="7000">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Max Age (hours)</label>
                    <input type="number" class="form-input" name="viral_threshold_hours" value="48">
                </div>
            </div>
            
            <div class="modal-footer" style="margin: 1rem -1.5rem -1.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color);">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Channel</button>
            </div>
        </form>
    `);
}

async function submitChannel(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const channelData = {
        channel_id: formData.get('channel_id'),
        channel_name: formData.get('channel_name'),
        language: formData.get('language'),
        niche: formData.get('niche') || null,
        viral_threshold_views: parseInt(formData.get('viral_threshold_views')) || 7000,
        viral_threshold_hours: parseInt(formData.get('viral_threshold_hours')) || 48,
        is_active: true
    };

    try {
        await fetchAPI('/api/channels', 'POST', channelData);
        showToast('Channel added successfully!', 'success');
        closeModal();
        loadChannels();
    } catch (error) {
        showToast('Error adding channel: ' + error.message, 'error');
    }
}

async function toggleChannelStatus(id, isActive) {
    try {
        await fetchAPI(`/api/channels/${id}`, 'PATCH', { is_active: isActive });
        showToast(`Channel ${isActive ? 'activated' : 'paused'}`, 'success');
        loadChannels();
    } catch (error) {
        showToast('Error updating channel: ' + error.message, 'error');
    }
}

async function deleteChannel(id) {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
        await fetchAPI(`/api/channels/${id}`, 'DELETE');
        showToast('Channel deleted', 'success');
        loadChannels();
    } catch (error) {
        showToast('Error deleting channel: ' + error.message, 'error');
    }
}

// =====================================================
// PROJECTS
// =====================================================

async function loadProjects() {
    data.projects = await fetchAPI('/api/projects?limit=100');

    const content = document.getElementById('content');

    if (data.projects.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎬</div>
                <h3 class="empty-state-title">No Projects Yet</h3>
                <p class="empty-state-text">Projects will appear here when videos are queued for processing.</p>
                <button class="btn btn-primary" onclick="showAddVideoModal()">➕ Add Video Manually</button>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm ${!currentStatusFilter ? 'btn-primary' : 'btn-secondary'}" onclick="filterProjects(null)">All</button>
                <button class="btn btn-sm btn-secondary" onclick="filterProjects('queued')">⏳ Queued</button>
                <button class="btn btn-sm btn-secondary" onclick="filterProjects('processing')">🔄 Processing</button>
                <button class="btn btn-sm btn-secondary" onclick="filterProjects('done')">✅ Done</button>
                <button class="btn btn-sm btn-secondary" onclick="filterProjects('error')">❌ Error</button>
            </div>
            <button class="btn btn-primary" onclick="showAddVideoModal()">➕ Add Video</button>
        </div>
        
        ${renderProjectsTable(data.projects)}
    `;
}

let currentStatusFilter = null;

function filterProjects(status) {
    currentStatusFilter = status;
    const filtered = status
        ? data.projects.filter(p => p.status === status || p.status?.startsWith(status))
        : data.projects;

    document.querySelector('.table-container').outerHTML = renderProjectsTable(filtered);
}

function renderProjectsTable(projects) {
    if (projects.length === 0) {
        return `
            <div class="table-container">
                <div style="padding: 3rem; text-align: center; color: var(--text-secondary);">
                    No projects found
                </div>
            </div>
        `;
    }

    return `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Language</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${projects.map(p => {
        const status = STATUS_CONFIG[p.status] || STATUS_CONFIG['queued'];
        return `
                            <tr>
                                <td>
                                    <div style="display: flex; flex-direction: column; max-width: 400px;">
                                        <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${escapeHtml(p.project_name)}
                                        </strong>
                                        <a href="${p.source_video_url}" target="_blank" 
                                           style="color: var(--text-muted); font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${p.source_video_url}
                                        </a>
                                    </div>
                                </td>
                                <td>
                                    <span class="language-flag">
                                        <span class="flag-icon">${LANGUAGES[p.language]?.flag || '🌐'}</span>
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${status.class}">
                                        ${status.icon} ${status.label}
                                    </span>
                                    ${p.error_message ? `<br><small style="color: var(--error);">${escapeHtml(p.error_message.substring(0, 50))}...</small>` : ''}
                                </td>
                                <td style="white-space: nowrap;">
                                    ${formatDate(p.created_at)}
                                </td>
                                <td>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button class="btn btn-ghost btn-sm" onclick="showProjectDetails('${p.id}')" title="View Details">👁️</button>
                                        ${p.status === 'error' ? `<button class="btn btn-ghost btn-sm" onclick="retryProject('${p.id}')" title="Retry">🔄</button>` : ''}
                                        ${p.final_video_url ? `<a href="${p.final_video_url}" target="_blank" class="btn btn-ghost btn-sm" title="Download">📥</a>` : ''}
                                        <button class="btn btn-ghost btn-sm" onclick="deleteProject('${p.id}')" title="Delete">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddVideoModal() {
    openModal('Add Video Manually', `
        <form id="videoForm" onsubmit="submitVideo(event)">
            <div class="form-group">
                <label class="form-label">YouTube Video URL *</label>
                <input type="url" class="form-input" name="video_url" 
                       placeholder="https://www.youtube.com/watch?v=..." required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Output Language</label>
                <select class="form-select" name="language">
                    ${Object.entries(LANGUAGES).map(([code, lang]) =>
        `<option value="${code}">${lang.flag} ${lang.name}</option>`
    ).join('')}
                </select>
            </div>
            
            <div class="modal-footer" style="margin: 1rem -1.5rem -1.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color);">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Start Processing</button>
            </div>
        </form>
    `);
}

async function submitVideo(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
        await fetchAPI('/api/projects/manual', 'POST', {
            video_url: formData.get('video_url'),
            language: formData.get('language')
        });
        showToast('Video queued for processing!', 'success');
        closeModal();
        loadProjects();
    } catch (error) {
        showToast('Error adding video: ' + error.message, 'error');
    }
}

async function showProjectDetails(id) {
    try {
        const project = await fetchAPI(`/api/projects/${id}`);

        const status = STATUS_CONFIG[project.status] || STATUS_CONFIG['queued'];
        const packaging = typeof project.packaging === 'string'
            ? JSON.parse(project.packaging || '{}')
            : (project.packaging || {});

        openModal('Project Details', `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label class="form-label">Status</label>
                    <span class="badge ${status.class}">${status.icon} ${status.label}</span>
                </div>
                
                <div>
                    <label class="form-label">Project Name</label>
                    <p>${escapeHtml(project.project_name)}</p>
                </div>
                
                <div>
                    <label class="form-label">Source Video</label>
                    <a href="${project.source_video_url}" target="_blank" style="color: var(--accent-primary);">
                        ${project.source_video_url}
                    </a>
                </div>
                
                ${packaging.title ? `
                    <div>
                        <label class="form-label">Generated Title</label>
                        <p>${escapeHtml(packaging.title)}</p>
                    </div>
                ` : ''}
                
                ${packaging.thumbnail_text ? `
                    <div>
                        <label class="form-label">Thumbnail Text</label>
                        <p>${escapeHtml(packaging.thumbnail_text)}</p>
                    </div>
                ` : ''}
                
                ${project.script ? `
                    <div>
                        <label class="form-label">Script Preview</label>
                        <div style="max-height: 200px; overflow-y: auto; background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; font-size: 0.875rem;">
                            ${escapeHtml(project.script.substring(0, 1000))}...
                        </div>
                    </div>
                ` : ''}
                
                ${project.final_video_url ? `
                    <div>
                        <label class="form-label">Final Video</label>
                        <a href="${project.final_video_url}" target="_blank" class="btn btn-primary">
                            📥 Download Video
                        </a>
                    </div>
                ` : ''}
                
                ${project.error_message ? `
                    <div>
                        <label class="form-label" style="color: var(--error);">Error</label>
                        <p style="color: var(--error);">${escapeHtml(project.error_message)}</p>
                    </div>
                ` : ''}
            </div>
        `);
    } catch (error) {
        showToast('Error loading project details: ' + error.message, 'error');
    }
}

async function retryProject(id) {
    try {
        await fetchAPI(`/api/projects/${id}/retry`, 'POST');
        showToast('Project queued for retry', 'success');
        loadProjects();
    } catch (error) {
        showToast('Error retrying project: ' + error.message, 'error');
    }
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
        await fetchAPI(`/api/projects/${id}`, 'DELETE');
        showToast('Project deleted', 'success');
        loadProjects();
    } catch (error) {
        showToast('Error deleting project: ' + error.message, 'error');
    }
}

// =====================================================
// SETTINGS
// =====================================================

async function loadSettings() {
    data.settings = await fetchAPI('/api/settings');

    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">General Settings</h3>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label class="form-label">Auto Scraper Enabled</label>
                    <select class="form-select" onchange="updateSetting('scraper_enabled', this.value)">
                        <option value="true" ${getSettingValue('scraper_enabled') === true ? 'selected' : ''}>Enabled</option>
                        <option value="false" ${getSettingValue('scraper_enabled') === false ? 'selected' : ''}>Disabled</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Scraper Interval (hours)</label>
                    <input type="number" class="form-input" value="${getSettingValue('scraper_interval_hours') || 12}"
                           onchange="updateSetting('scraper_interval_hours', parseInt(this.value))">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Max Concurrent Projects</label>
                    <input type="number" class="form-input" value="${getSettingValue('max_concurrent_projects') || 2}"
                           onchange="updateSetting('max_concurrent_projects', parseInt(this.value))">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Default Language</label>
                    <select class="form-select" onchange="updateSetting('default_language', this.value)">
                        ${Object.entries(LANGUAGES).map(([code, lang]) =>
        `<option value="${code}" ${getSettingValue('default_language') === code ? 'selected' : ''}>
                                ${lang.flag} ${lang.name}
                            </option>`
    ).join('')}
                    </select>
                </div>
            </div>
        </div>
    `;
}

function getSettingValue(key) {
    const setting = data.settings.find(s => s.key === key);
    return setting?.value;
}

async function updateSetting(key, value) {
    try {
        await fetchAPI(`/api/settings/${key}`, 'PATCH', { value: JSON.stringify(value) });
        showToast('Setting updated', 'success');
    } catch (error) {
        showToast('Error updating setting: ' + error.message, 'error');
    }
}

// =====================================================
// WORKFLOW TRIGGERS
// =====================================================

async function triggerScraper() {
    try {
        await fetchAPI('/api/trigger/scraper', 'POST');
        showToast('Scraper triggered! Check Projects for new videos.', 'success');
    } catch (error) {
        showToast('Error triggering scraper: ' + error.message, 'error');
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_BASE + endpoint, options);

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    // Less than 1 hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }

    return date.toLocaleDateString();
}

// =====================================================
// MODAL FUNCTIONS
// =====================================================

function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}
