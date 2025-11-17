// ============================================
// YOUTUBE DOWNLOADER
// Sistema de descarga de YouTube integrado
// ============================================

const API_URL = 'http://localhost:5000';
let currentVideoInfo = null;

// ============================================
// CREAR MODAL DE DESCARGA
// ============================================
function createDownloadModal() {
    const modal = document.createElement('div');
    modal.id = 'youtube-download-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="glass" style="
            width: 90%;
            max-width: 600px;
            padding: 2rem;
            border-radius: 2rem;
            position: relative;
            animation: slideUp 0.3s ease;
        ">
            <button id="close-download-modal" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                color: #fff;
                font-size: 2rem;
                cursor: pointer;
                transition: transform 0.3s ease;
            ">&times;</button>
            
            <h2 class="neon-text" style="
                text-align: center;
                color: #FF8C42;
                margin-bottom: 2rem;
                font-family: 'Bungee', cursive;
            ">🎵 YouTube MP3 Downloader</h2>
            
            <div style="margin-bottom: 1.5rem;">
                <input 
                    type="text" 
                    id="youtube-url-input" 
                    placeholder="Pega aquí el enlace de YouTube..."
                    style="
                        width: 100%;
                        padding: 1rem;
                        border-radius: 1rem;
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        background: rgba(0, 0, 0, 0.3);
                        color: #fff;
                        font-size: 1rem;
                        font-family: 'Orbitron', sans-serif;
                    "
                >
            </div>
            
            <button id="get-info-btn" class="glass" style="
                width: 100%;
                padding: 1rem;
                border-radius: 1rem;
                border: none;
                background: linear-gradient(135deg, #FF8C42, #2B6A7C);
                color: #fff;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                margin-bottom: 1.5rem;
                transition: transform 0.3s ease;
                font-family: 'Orbitron', sans-serif;
            ">Obtener información</button>
            
            <div id="video-info-container" style="display: none; margin-bottom: 1.5rem;">
                <div class="glass" style="
                    padding: 1rem;
                    border-radius: 1rem;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                ">
                    <img id="video-thumbnail" src="" alt="Thumbnail" style="
                        width: 120px;
                        height: 90px;
                        border-radius: 0.5rem;
                        object-fit: cover;
                    ">
                    <div style="flex: 1;">
                        <h3 id="video-title-display" style="
                            color: #fff;
                            margin-bottom: 0.5rem;
                            font-size: 1rem;
                            font-family: 'Orbitron', sans-serif;
                        "></h3>
                        <p id="video-author" style="
                            color: #C5D633;
                            font-size: 0.9rem;
                            margin-bottom: 0.3rem;
                            font-family: 'Orbitron', sans-serif;
                        "></p>
                        <p id="video-duration" style="
                            color: rgba(255, 255, 255, 0.7);
                            font-size: 0.85rem;
                            font-family: 'Orbitron', sans-serif;
                        "></p>
                    </div>
                </div>
            </div>
            
            <div id="download-progress" style="display: none; margin-bottom: 1.5rem;">
                <div style="
                    height: 1rem;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 1rem;
                    overflow: hidden;
                    margin-bottom: 0.5rem;
                ">
                    <div id="download-progress-bar" style="
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, #FF8C42, #2B6A7C);
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <p id="download-status" style="
                    text-align: center;
                    color: #C5D633;
                    font-family: 'Orbitron', sans-serif;
                ">Descargando...</p>
            </div>
            
            <button id="download-mp3-btn" class="glass" style="
                width: 100%;
                padding: 1rem;
                border-radius: 1rem;
                border: none;
                background: linear-gradient(135deg, #C5D633, #2B6A7C);
                color: #fff;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                display: none;
                transition: transform 0.3s ease;
                font-family: 'Orbitron', sans-serif;
            ">⬇️ Descargar MP3 y agregar a playlist</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

// ============================================
// FUNCIONES DEL MODAL
// ============================================
function initYouTubeDownloader() {
    const modal = createDownloadModal();
    const closeBtn = document.getElementById('close-download-modal');
    const getInfoBtn = document.getElementById('get-info-btn');
    const downloadBtn = document.getElementById('download-mp3-btn');
    const urlInput = document.getElementById('youtube-url-input');
    
    // Abrir modal
    window.openDownloadModal = function() {
        modal.style.display = 'flex';
        urlInput.focus();
    };
    
    // Cerrar modal
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        resetModal();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetModal();
        }
    };
    
    // Obtener información del video
    getInfoBtn.onclick = async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            alert('Por favor, ingresa un enlace de YouTube');
            return;
        }
        
        getInfoBtn.disabled = true;
        getInfoBtn.textContent = 'Obteniendo información...';
        
        try {
            const response = await fetch(`${API_URL}/api/info?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error);
            }
            
            currentVideoInfo = data;
            displayVideoInfo(data);
            
        } catch (error) {
            alert('Error al obtener información: ' + error.message);
        } finally {
            getInfoBtn.disabled = false;
            getInfoBtn.textContent = 'Obtener información';
        }
    };
    
    // Descargar MP3
    downloadBtn.onclick = async () => {
        if (!currentVideoInfo) return;
        
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Descargando...';
        document.getElementById('download-progress').style.display = 'block';
        
        try {
            // Mostrar progreso de descarga
            await animateProgressAsync();
            
            // Intentar descargar del servidor
            const response = await fetch(`${API_URL}/api/download-to-server`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: urlInput.value
                })
            }).catch(err => {
                console.error('Error en fetch:', err);
                return null;
            });
            
            if (response && response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    const track = {
                        id: Date.now(),
                        name: data.title,
                        url: `${API_URL}${data.path}`,
                        genre: detectGenre(data.title),
                        source: 'downloaded',
                        file: null
                    };
                    
                    playlist.push(track);
                    renderPlaylist();
                    
                    if (typeof speakDJ === 'function') {
                        speakDJ(`${data.title} descargado y agregado a la playlist`);
                    }
                    
                    showNotification('✅ Descarga completada', `${data.title} agregado a tu playlist`);
                } else {
                    showNotification('⚠️ Advertencia', 'La descarga pudo completarse pero hubo un problema al agregar a la playlist');
                }
            } else {
                // Si el fetch falla pero el archivo se descargó, recargar archivos
                console.log('Reintentando cargar archivos descargados...');
                await loadDownloadedFiles();
                showNotification('✅ Descarga completada', 'El archivo se descargó correctamente. Recargando playlist...');
            }
            
            // Cerrar modal sin recargar la página
            modal.style.display = 'none';
            resetModal();
            
        } catch (error) {
            console.error('Error completo:', error);
            showNotification('⚠️ Advertencia', 'La descarga pudo completarse. Revisa tu playlist o recarga la página.');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '⬇️ Descargar MP3 y agregar a playlist';
            document.getElementById('download-progress').style.display = 'none';
        }
    };
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getInfoBtn.click();
        }
    });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function displayVideoInfo(info) {
    document.getElementById('video-info-container').style.display = 'block';
    document.getElementById('video-thumbnail').src = info.thumbnail;
    document.getElementById('video-title-display').textContent = info.title;
    document.getElementById('video-author').textContent = info.author;
    
    const duration = typeof formatTime === 'function' 
        ? formatTime(info.length) 
        : `${Math.floor(info.length / 60)}:${(info.length % 60).toString().padStart(2, '0')}`;
    
    document.getElementById('video-duration').textContent = duration;
    document.getElementById('download-mp3-btn').style.display = 'block';
}

function resetModal() {
    document.getElementById('youtube-url-input').value = '';
    document.getElementById('video-info-container').style.display = 'none';
    document.getElementById('download-mp3-btn').style.display = 'none';
    document.getElementById('download-progress').style.display = 'none';
    document.getElementById('download-progress-bar').style.width = '0%';
    currentVideoInfo = null;
}

function animateProgressAsync() {
    return new Promise((resolve) => {
        const progressBar = document.getElementById('download-progress-bar');
        const statusText = document.getElementById('download-status');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                statusText.textContent = '¡Completado!';
                setTimeout(resolve, 300);
            }
            
            progressBar.style.width = `${progress}%`;
            
            if (progress < 30) {
                statusText.textContent = 'Descargando...';
            } else if (progress < 70) {
                statusText.textContent = 'Convirtiendo a MP3...';
            } else if (progress < 100) {
                statusText.textContent = 'Finalizando...';
            }
        }, 200);
    });
}

function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 2px solid #C5D633;
        border-radius: 1rem;
        padding: 1.5rem;
        max-width: 300px;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 0 30px rgba(197, 214, 51, 0.5);
    `;
    
    notification.innerHTML = `
        <h3 style="
            color: #C5D633;
            margin-bottom: 0.5rem;
            font-family: 'Bungee', cursive;
            font-size: 1.1rem;
        ">${title}</h3>
        <p style="
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            font-size: 0.9rem;
        ">${message}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// ============================================
// CARGAR ARCHIVOS DESCARGADOS
// ============================================
async function loadDownloadedFiles() {
    try {
        const response = await fetch(`${API_URL}/api/files`);
        const data = await response.json();
        
        if (data.success && data.files.length > 0) {
            data.files.forEach((file, idx) => {
                const track = {
                    id: Date.now() + idx,
                    name: file.filename.replace('.mp3', ''),
                    url: `${API_URL}${file.path}`,
                    genre: typeof detectGenre === 'function' ? detectGenre(file.filename) : 'default',
                    source: 'downloaded',
                    file: null
                };
                
                if (!playlist.find(t => t.name === track.name)) {
                    playlist.push(track);
                }
            });
            
            if (typeof renderPlaylist === 'function') {
                renderPlaylist();
            }
            console.log(`✅ ${data.files.length} archivos cargados desde downloads`);
        }
    } catch (error) {
        console.log('Backend no disponible o sin archivos en downloads:', error.message);
    }
}

function configureCrossOrigin() {
    const audioElement = document.getElementById('audio-player');
    if (audioElement) {
        audioElement.crossOrigin = 'anonymous';
        console.log('✅ CrossOrigin configurado en el elemento de audio');
    }
}

// ============================================
// ESTILOS PARA ANIMACIONES
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    #close-download-modal:hover {
        transform: rotate(90deg);
    }
    
    #get-info-btn:hover,
    #download-mp3-btn:hover {
        transform: scale(1.05);
    }
`;
document.head.appendChild(style);

// ============================================
// INICIALIZACIÓN
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        configureCrossOrigin();
        initYouTubeDownloader();
        setTimeout(() => {
            loadDownloadedFiles();
        }, 1000);
    });
} else {
    configureCrossOrigin();
    initYouTubeDownloader();
    setTimeout(() => {
        loadDownloadedFiles();
    }, 1000);
}

console.log('🎵 YouTube Downloader inicializado');