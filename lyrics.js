// ============================================
// SISTEMA DE LETRAS
// ============================================

let currentLyrics = null;
let lyricsCache = {};
const API_URL = 'http://localhost:5000';

// ============================================
// CARGAR LETRAS
// ============================================
async function loadLyrics(trackName, artist = '') {
    const lyricsContent = document.getElementById('lyrics-content');
    const lyricsStatusText = document.getElementById('lyrics-status-text');
    const lyricsStatusDot = document.getElementById('lyrics-status-dot');
    
    lyricsStatusText.textContent = 'Buscando...';
    lyricsStatusDot.style.background = '#FF8C42';
    lyricsContent.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6);">🔍 Buscando letra...</p>';
    
    const cleanTitle = trackName.replace(/\.(mp3|wav|m4a|flac)$/i, '').replace(/[_-]/g, ' ');
    const cacheKey = `${cleanTitle}-${artist}`.toLowerCase();
    
    if (lyricsCache[cacheKey]) {
        displayLyrics(lyricsCache[cacheKey]);
        lyricsStatusText.textContent = 'Cargada (cache)';
        lyricsStatusDot.style.background = '#C5D633';
        return;
    }
    
    try {
        const params = new URLSearchParams({
            title: cleanTitle,
            artist: artist
        });
        
        const response = await fetch(`${API_URL}/api/lyrics?${params}`);
        const data = await response.json();
        
        if (data.success && data.lyrics) {
            lyricsCache[cacheKey] = {
                lyrics: data.lyrics,
                title: data.title,
                artist: data.artist,
                source: data.source
            };
            
            currentLyrics = data.lyrics;
            displayLyrics(lyricsCache[cacheKey]);
            
            lyricsStatusText.textContent = `Desde ${data.source}`;
            lyricsStatusDot.style.background = '#C5D633';
            
            if (typeof speakDJ === 'function' && djEnabled) {
                speakDJ(`Letra encontrada: ${data.title} por ${data.artist}`);
            }
        } else {
            throw new Error(data.error || 'No se encontró la letra');
        }
        
    } catch (error) {
        console.error('Error cargando letra:', error);
        currentLyrics = null;
        lyricsContent.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem;">
                    😔 No se encontró la letra para esta canción
                </p>
                <p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">
                    Intenta agregar el nombre del artista o verifica el título
                </p>
            </div>
        `;
        lyricsStatusText.textContent = 'No encontrada';
        lyricsStatusDot.style.background = '#2B6A7C';
    }
}

// ============================================
// MOSTRAR LETRAS
// ============================================
function displayLyrics(data) {
    const lyricsContent = document.getElementById('lyrics-content');
    
    const lines = data.lyrics.split('\n').filter(line => line.trim() !== '');
    
    const lyricsHTML = lines.map((line, index) => {
        const delay = index * 0.05;
        return `
            <p class="lyrics-line" style="
                opacity: 0;
                animation: fadeInLyrics 0.5s ease forwards;
                animation-delay: ${delay}s;
                margin-bottom: 0.8rem;
                line-height: 1.6;
            ">${line}</p>
        `;
    }).join('');
    
    lyricsContent.innerHTML = `
        <div style="
            text-align: center;
            padding: 1rem;
            border-bottom: 2px solid rgba(255,255,255,0.1);
            margin-bottom: 1rem;
        ">
            <h4 style="
                color: #FF8C42;
                margin-bottom: 0.3rem;
                font-family: 'Bungee', cursive;
            ">${data.title}</h4>
            <p style="
                color: #C5D633;
                font-size: 0.9rem;
                font-family: 'Orbitron', sans-serif;
            ">${data.artist}</p>
            <p style="
                color: rgba(255,255,255,0.5);
                font-size: 0.8rem;
                margin-top: 0.5rem;
            ">Fuente: ${data.source}</p>
        </div>
        <div style="max-height: 400px; overflow-y: auto; padding: 0 0.5rem;">
            ${lyricsHTML}
        </div>
    `;
    
    if (!document.getElementById('lyrics-animation-style')) {
        const style = document.createElement('style');
        style.id = 'lyrics-animation-style';
        style.textContent = `
            @keyframes fadeInLyrics {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .lyrics-line {
                transition: color 0.3s ease;
            }
            
            .lyrics-line:hover {
                color: #FF8C42;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================
// EXTRAER INFORMACIÓN DEL ARCHIVO
// ============================================
function extractArtistFromFilename(filename) {
    const patterns = [
        /^(.+?)\s*-\s*(.+)$/,
        /^(.+?)_(.+)$/,
        /^(.+?)\s+by\s+(.+)$/i
    ];
    
    for (const pattern of patterns) {
        const match = filename.match(pattern);
        if (match) {
            return {
                artist: match[1].trim(),
                title: match[2].trim()
            };
        }
    }
    
    return {
        artist: '',
        title: filename
    };
}

// ============================================
// INTEGRACIÓN CON PLAYTRACK
// ============================================
const originalPlayTrack = window.playTrack;
window.playTrack = function(index) {
    if (originalPlayTrack) {
        originalPlayTrack(index);
    }
    
    if (index >= 0 && index < playlist.length) {
        const track = playlist[index];
        const { artist, title } = extractArtistFromFilename(track.name);
        
        setTimeout(() => {
            loadLyrics(title, artist);
        }, 500);
    }
};

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('lyrics-preview')?.addEventListener('click', function() {
    if (currentLyrics) {
        const lyricsContent = document.getElementById('lyrics-content');
        if (lyricsContent.style.maxHeight === '150px') {
            lyricsContent.style.maxHeight = 'none';
            this.innerHTML = '<i class="material-icons">visibility_off</i><span>Ocultar</span>';
        } else {
            lyricsContent.style.maxHeight = '150px';
            this.innerHTML = '<i class="material-icons">visibility</i><span>Ver letra</span>';
        }
    }
});

document.getElementById('lyrics-toggle')?.addEventListener('click', async function() {
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
        const track = playlist[currentTrackIndex];
        const { artist, title } = extractArtistFromFilename(track.name);
        
        await loadLyrics(title, artist);
        
        this.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 200);
    } else {
        alert('Selecciona una canción primero');
    }
});

// ============================================
// BÚSQUEDA MANUAL
// ============================================
function searchLyricsManually() {
    const title = prompt('Ingresa el título de la canción:');
    if (title) {
        const artist = prompt('Ingresa el artista (opcional):');
        loadLyrics(title, artist || '');
    }
}

function addManualSearchButton() {
    const lyricsHeader = document.querySelector('.lyrics-header');
    if (lyricsHeader && !document.getElementById('lyrics-manual-search')) {
        const searchBtn = document.createElement('button');
        searchBtn.id = 'lyrics-manual-search';
        searchBtn.className = 'lyrics-toggle';
        searchBtn.innerHTML = '<i class="material-icons">search</i><span>Buscar</span>';
        searchBtn.onclick = searchLyricsManually;
        
        const actionsDiv = lyricsHeader.querySelector('.lyrics-actions');
        if (actionsDiv) {
            actionsDiv.appendChild(searchBtn);
        }
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addManualSearchButton();
    });
} else {
    addManualSearchButton();
}

console.log('🎵 Sistema de letras inicializado');