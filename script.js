/* ==========================================================================
   PRESET GALLERY CORE JAVASCRIPT
   Fixed: Live Analytics Counter persistence, Dual Format (.DNG & .XMP),
   Search Filtering, Admin Uploads, and Keyboard Shortcuts.
   ========================================================================== */

let presets = [];
let isAdmin = false;

const initialPresets = [
    {
        id: "1",
        title: "Moody Forest",
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
        dngUrl: "#",
        xmpUrl: "#",
        baseDownloads: 1420
    },
    {
        id: "2",
        title: "Sunset Glow",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        dngUrl: "#",
        xmpUrl: "#",
        baseDownloads: 980
    },
    {
        id: "3",
        title: "Urban Vintage",
        image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
        dngUrl: "#",
        xmpUrl: "#",
        baseDownloads: 2150
    }
];

// --- 1. LOAD DATA & INITIALIZE ---

document.addEventListener('DOMContentLoaded', () => {
    const savedPresets = localStorage.getItem('user_presets');
    if (savedPresets) {
        try {
            presets = JSON.parse(savedPresets);
        } catch(e) {
            presets = [...initialPresets];
        }
    } else {
        presets = [...initialPresets];
        localStorage.setItem('user_presets', JSON.stringify(presets));
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'mj123') {
        revealAdminMode();
    } else {
        renderPresets(presets);
    }
});

// --- 2. ANALYTICS & LIVE COUNTER (FIXED PERSISTENCE) ---

function formatCount(count) {
    return count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count;
}

function trackDownload(event, id, btn) {
    const href = btn.getAttribute('href');
    
    // Prevent default jump for placeholder '#' links
    if (!href || href === '#') {
        event.preventDefault();
    }

    const stringId = String(id);
    
    // 1. Find item in memory array & increment
    const targetPreset = presets.find(p => String(p.id) === stringId);
    if (targetPreset) {
        targetPreset.baseDownloads = (targetPreset.baseDownloads || 0) + 1;
    }

    // 2. Save directly to specific preset counter & updated presets list
    const currentDLKey = `preset_dl_${stringId}`;
    let currentDL = parseInt(localStorage.getItem(currentDLKey) || (targetPreset ? targetPreset.baseDownloads : 1), 10);
    if (isNaN(currentDL)) currentDL = 1;
    
    localStorage.setItem(currentDLKey, currentDL + 1);
    localStorage.setItem('user_presets', JSON.stringify(presets));

    // 3. Directly update the DOM counter badge
    const badgeSpan = document.getElementById(`dl-count-${stringId}`);
    if (badgeSpan) {
        badgeSpan.innerText = formatCount(targetPreset ? targetPreset.baseDownloads : currentDL + 1);
    }

    // 4. UI feedback animation
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Downloading...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.pointerEvents = 'auto';
        if (typeof showToast === 'function') {
            showToast('Download started!');
        }
    }, 1000);
}

// --- 3. GALLERY RENDER ENGINE ---

function renderPresets(items) {
    const container = document.getElementById('galleryContainer');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#c0a9e0;">No presets found.</p>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const itemId = String(item.id);
        const storedDL = localStorage.getItem(`preset_dl_${itemId}`);
        const totalCount = storedDL ? parseInt(storedDL, 10) : (item.baseDownloads || 0);

        return `
            <div class="photo-card" id="card-${itemId}">
                ${isAdmin ? `<button class="btn-delete" onclick="deletePreset('${itemId}')">&#128465; Delete</button>` : ''}
                <img src="${item.image}" alt="${item.title}">
                <div class="card-body">
                    <div class="card-header">
                        <h3>${item.title}</h3>
                        <div class="download-badge" title="${totalCount} Downloads">
                            <svg width="12" height="12" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            <span id="dl-count-${itemId}">${formatCount(totalCount)}</span>
                        </div>
                    </div>
                    <div class="download-group">
                        <a href="${item.dngUrl || '#'}" download="${item.title}.dng" class="btn-download" onclick="trackDownload(event, '${itemId}', this)">
                            &#128241; .DNG (Mobile)
                        </a>
                        <a href="${item.xmpUrl || '#'}" download="${item.title}.xmp" class="btn-download btn-download-secondary" onclick="trackDownload(event, '${itemId}', this)">
                            &#128187; .XMP (Desktop)
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- 4. SEARCH FILTER ---

function filterPresets() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase().trim();
    const filtered = presets.filter(preset => preset.title.toLowerCase().includes(query));
    renderPresets(filtered);
}

// --- 5. ADMIN & UPLOAD HANDLERS ---

function deletePreset(id) {
    if (!isAdmin) return;

    if (confirm("Are you sure you want to delete this preset?")) {
        presets = presets.filter(preset => String(preset.id) !== String(id));
        localStorage.setItem('user_presets', JSON.stringify(presets));
        renderPresets(presets);
        if (typeof showToast === 'function') {
            showToast('Preset deleted!');
        }
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('#');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

async function handlePresetUpload(event) {
    event.preventDefault();

    const titleInput = document.getElementById('presetTitle').value;
    const imageInput = document.getElementById('presetImage').files[0];
    const dngInput = document.getElementById('presetFileDng').files[0];
    const xmpInput = document.getElementById('presetFileXmp').files[0];

    if (!imageInput || !dngInput) {
        alert('Please select a preview image and a .DNG mobile file.');
        return;
    }

    try {
        const imageUrl = await readFileAsDataURL(imageInput);
        const dngUrl = await readFileAsDataURL(dngInput);
        const xmpUrl = xmpInput ? await readFileAsDataURL(xmpInput) : '#';

        const newPreset = {
            id: String(Date.now()),
            title: titleInput,
            image: imageUrl,
            dngUrl: dngUrl,
            xmpUrl: xmpUrl,
            baseDownloads: 0
        };

        presets.unshift(newPreset);

        try {
            localStorage.setItem('user_presets', JSON.stringify(presets));
        } catch (err) {
            console.warn('LocalStorage size limit exceeded.');
        }

        renderPresets(presets);

        document.getElementById('uploadForm').reset();
        document.getElementById('uploadModal').classList.remove('active');

        if (typeof showToast === 'function') {
            showToast('New preset uploaded successfully!');
        }
    } catch (err) {
        console.error('Upload Error:', err);
        alert('Failed to process upload files.');
    }
}

// --- 6. HIDDEN ADMIN CONTROLS ---

function revealAdminMode() {
    isAdmin = true;
    const adminBtn = document.getElementById('openUploadModal');
    if (adminBtn) {
        adminBtn.style.display = 'inline-flex';
    }
    renderPresets(presets);
    if (typeof showToast === 'function') {
        showToast('Admin Mode Enabled!');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        revealAdminMode();
    }
});
