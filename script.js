// Variables globales
let playlist = [];
let currentTrackIndex = -1;
let isPlaying = false;
let radioMode = false;
let djEnabled = false;
let currentGenre = 'electronic';
let youtubePlayer = null;
let currentVideoId = null;
let downloads = [];

// Variables para visualización de audio
let audioContext = null;
let analyser = null;
let source = null;
let dataArray = null;
let bufferLength = null;
let animationId = null;
let canvas = null;
let ctx = null;

// Elementos del DOM
const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const radioBtn = document.getElementById('radio-btn');
const djBtn = document.getElementById('dj-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.querySelector('.progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const fileInput = document.getElementById('file-input');
const youtubeBtn = document.getElementById('youtube-btn');
const playlistEl = document.getElementById('playlist');
const currentTrackName = document.getElementById('current-track-name');
const currentGenreEl = document.getElementById('current-genre');
const genreDisplay = document.getElementById('genre-display');
const backgroundAnimation = document.getElementById('background-animation');
const videoPlaceholder = document.getElementById('video-placeholder');
const videoTitle = document.getElementById('video-title');
const shape1 = document.querySelector('.shape-1');
const shape2 = document.querySelector('.shape-2');
const shape3 = document.querySelector('.shape-3');
const downloadsEl = document.getElementById('downloads');
const downloadModal = document.getElementById('download-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalUnderstand = document.getElementById('modal-understand');

// Géneros y sus colores
const genres = {
    electronic: { 
        colors: ['#00ff80', '#00ffff', '#ff0080'], 
        name: 'Electronic' 
    },
    rock: { 
        colors: ['#ff0040', '#ff6b00', '#ffeb3b'], 
        name: 'Rock' 
    },
    pop: { 
        colors: ['#ff69b4', '#ffd700', '#00ffff'], 
        name: 'Pop' 
    },
    hiphop: { 
        colors: ['#9c27b0', '#ff9800', '#4caf50'], 
        name: 'Hip Hop' 
    },
    jazz: { 
        colors: ['#3f51b5', '#ffc107', '#8bc34a'], 
        name: 'Jazz' 
    },
    default: { 
        colors: ['#00ffff', '#ff0080', '#00ff80'], 
        name: 'Mixed' 
    }
};

// Inicializar el reproductor de YouTube
function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'rel': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'iv_load_policy': 3,
            'disablekb': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // El reproductor está listo
}

function onPlayerStateChange(event) {
    // Manejar cambios de estado del reproductor de YouTube
    if (event.data === YT.PlayerState.PLAYING) {
        // Si el video de YouTube está reproduciéndose, pausar el audio local
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            updatePlayButton();
        }
    }
}

// Inicializar visualización de audio
function initAudioVisualization() {
    try {
        // Crear canvas para visualización
        canvas = document.getElementById('audio-visualizer');
        ctx = canvas.getContext('2d');
        
        // Configurar tamaño del canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Inicializar AudioContext
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Conectar el elemento de audio al analizador
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Iniciar animación
        visualize();
    } catch (error) {
        console.error('Error initializing audio visualization:', error);
    }
}

// Función de visualización
function visualize() {
    try {
        animationId = requestAnimationFrame(visualize);
        
        // Obtener datos de frecuencia
        analyser.getByteFrequencyData(dataArray);
        
        // Limpiar canvas
        ctx.fillStyle = 'rgba(10, 10, 20, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcular valores promedio para diferentes rangos de frecuencia
        const bassAvg = getAverage(0, 10);  // Bajos
        const midAvg = getAverage(10, 50);  // Medios
        const trebleAvg = getAverage(50, bufferLength);  // Agudos
        
        // Actualizar formas de fondo según el audio
        updateShapes(bassAvg, midAvg, trebleAvg);
        
        // Dibujar visualización de barras
        drawBars();
        
        // Dibujar partículas reactivas
        drawParticles(bassAvg, midAvg, trebleAvg);
    } catch (error) {
        console.error('Error in visualization:', error);
    }
}

// Obtener promedio de un rango de frecuencias
function getAverage(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += dataArray[i];
    }
    return sum / (end - start);
}

// Actualizar formas de fondo según el audio
function updateShapes(bass, mid, treble) {
    try {
        // Escalar formas según los bajos
        const bassScale = 1 + (bass / 255) * 0.5;
        shape1.style.transform = `scale(${bassScale})`;
        shape2.style.transform = `scale(${1 + (mid / 255) * 0.3})`;
        shape3.style.transform = `scale(${1 + (treble / 255) * 0.4})`;
        
        // Cambiar opacidad según el audio
        shape1.style.opacity = 0.15 + (bass / 255) * 0.35;
        shape2.style.opacity = 0.15 + (mid / 255) * 0.35;
        shape3.style.opacity = 0.15 + (treble / 255) * 0.35;
        
        // Cambiar colores según el género y el audio
        const colors = genres[currentGenre].colors;
        const bassIntensity = bass / 255;
        const midIntensity = mid / 255;
        const trebleIntensity = treble / 255;
        
        shape1.style.background = interpolateColor(colors[0], colors[1], bassIntensity);
        shape2.style.background = interpolateColor(colors[1], colors[2], midIntensity);
        shape3.style.background = interpolateColor(colors[2], colors[0], trebleIntensity);
    } catch (error) {
        console.error('Error updating shapes:', error);
    }
}

// Interpolar entre dos colores
function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Convertir color hex a RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Dibujar barras de frecuencia
function drawBars() {
    try {
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.7;
            
            // Color basado en la frecuencia
            const hue = (i / bufferLength) * 360;
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
            
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    } catch (error) {
        console.error('Error drawing bars:', error);
    }
}

// Array para partículas
const particles = [];

// Dibujar partículas reactivas
function drawParticles(bass, mid, treble) {
    try {
        // Generar nuevas partículas basadas en el ritmo
        if (bass > 200 && particles.length < 100) {
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: canvas.height,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -Math.random() * 10 - 5,
                    size: Math.random() * 5 + 2,
                    color: genres[currentGenre].colors[Math.floor(Math.random() * 3)],
                    life: 1.0
                });
            }
        }
        
        // Actualizar y dibujar partículas
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Actualizar posición
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravedad
            p.life -= 0.01;
            
            // Eliminar partículas muertas
            if (p.life <= 0 || p.y > canvas.height) {
                particles.splice(i, 1);
                continue;
            }
            
            // Dibujar partícula
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Añadir brillo
            ctx.shadowBlur = 20;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        ctx.globalAlpha = 1;
    } catch (error) {
        console.error('Error drawing particles:', error);
    }
}

// Detectar género por nombre de archivo
function detectGenre(filename) {
    const name = filename.toLowerCase();
    if (name.includes('electro') || name.includes('techno') || name.includes('edm') || name.includes('house')) {
        return 'electronic';
    }
    if (name.includes('rock') || name.includes('metal') || name.includes('guitar')) {
        return 'rock';
    }
    if (name.includes('pop')) {
        return 'pop';
    }
    if (name.includes('hip') || name.includes('rap') || name.includes('trap')) {
        return 'hiphop';
    }
    if (name.includes('jazz') || name.includes('blues')) {
        return 'jazz';
    }
    return 'default';
}

// Cambiar colores del tema según el género
function updateThemeColors(genre) {
    const colors = genres[genre].colors;
    backgroundAnimation.style.background = `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}22, ${colors[2]}22)`;
    genreDisplay.textContent = `.:* NOW PLAYING: ${genres[genre].name.toUpperCase()} VIBES *:.`;
    genreDisplay.style.color = colors[0];
    
    // Actualizar color de la barra de progreso
    progressBar.style.background = `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
    progressBar.style.boxShadow = `0 0 20px ${colors[0]}`;
    
    // Actualizar colores de botones
    prevBtn.style.color = colors[0];
    playBtn.style.color = colors[1];
    nextBtn.style.color = colors[2];
    
    // Actualizar formas de fondo
    shape1.style.background = colors[0];
    shape2.style.background = colors[1];
    shape3.style.background = colors[2];
}

// DJ Virtual - Síntesis de voz
function speakDJ(text) {
    try {
        if (djEnabled && 'speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.pitch = 1.2;
            utterance.volume = 0.8;
            utterance.lang = 'es-ES';
            speechSynthesis.speak(utterance);
        }
    } catch (error) {
        console.error('Error in DJ speech:', error);
    }
}

// Mostrar modal de descarga
function showDownloadModal() {
    downloadModal.style.display = 'flex';
}

// Ocultar modal de descarga
function hideDownloadModal() {
    downloadModal.style.display = 'none';
}

// Simular descarga de YouTube
function simulateYouTubeDownload(videoId, videoTitle) {
    // Crear entrada de descarga
    const downloadId = Date.now();
    const download = {
        id: downloadId,
        videoId: videoId,
        title: videoTitle,
        progress: 0,
        status: 'pending',
        format: 'mp3',
        size: '~3.5 MB'
    };
    
    downloads.push(download);
    renderDownloads();
    
    // Simular progreso de descarga
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Actualizar estado
            download.progress = 100;
            download.status = 'completed';
            download.path = `/downloads/${videoTitle.replace(/[^\w\s]/gi, '')}.mp3`;
            
            renderDownloads();
            speakDJ(`Descarga completada: ${videoTitle}`);
            
            // Simular agregar a la playlist
            setTimeout(() => {
                const track = {
                    id: Date.now(),
                    name: videoTitle,
                    url: download.path,
                    genre: 'default',
                    source: 'local',
                    file: null
                };
                playlist.push(track);
                renderPlaylist();
                speakDJ(`${videoTitle} agregado a la playlist`);
            }, 1000);
        } else {
            download.progress = progress;
            download.status = 'downloading';
            renderDownloads();
        }
    }, 500);
}

// Renderizar lista de descargas
function renderDownloads() {
    if (downloads.length === 0) {
        downloadsEl.innerHTML = '<p class="empty-playlist">No downloads yet... Add a YouTube video! 📺</p>';
        return;
    }
    
    downloadsEl.innerHTML = downloads.map(download => `
        <div class="download-item glass">
            <div class="download-info">
                <span class="download-icon">
                    <i class="material-icons">download</i>
                </span>
                <div>
                    <div class="download-name">${download.title}</div>
                    <div class="download-size">${download.format.toUpperCase()} • ${download.size}</div>
                    <div class="download-progress">
                        <div class="download-progress-bar" style="width: ${download.progress}%"></div>
                    </div>
                    <div class="download-status">
                        ${download.status === 'pending' ? 'Pending...' : 
                          download.status === 'downloading' ? `Downloading... ${Math.round(download.progress)}%` : 
                          download.status === 'completed' ? 'Completed' : 'Failed'}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Cargar archivos locales
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file, idx) => {
        const track = {
            id: Date.now() + idx,
            name: file.name.replace(/\.[^/.]+$/, ''),
            url: URL.createObjectURL(file),
            genre: detectGenre(file.name),
            source: 'local',
            file: file
        };
        playlist.push(track);
    });
    
    renderPlaylist();
    speakDJ(`${files.length} canciones agregadas a la playlist`);
    
    // Inicializar visualización si no está inicializada
    if (!audioContext) {
        initAudioVisualization();
    }
});

// Agregar URL de YouTube
youtubeBtn.addEventListener('click', () => {
    const url = prompt('Pega la URL de YouTube:');
    if (url) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
        if (videoId) {
            const track = {
                id: Date.now(),
                name: `YouTube: ${videoId}`,
                url: url,
                videoId: videoId,
                genre: 'default',
                source: 'youtube'
            };
            playlist.push(track);
            renderPlaylist();
            speakDJ('Video de YouTube agregado');
        } else {
            alert('URL de YouTube no válida');
        }
    }
});

// Renderizar playlist
function renderPlaylist() {
    if (playlist.length === 0) {
        playlistEl.innerHTML = '<p class="empty-playlist">No tracks loaded yet... Upload some music! 🎵</p>';
        return;
    }
    
    playlistEl.innerHTML = playlist.map((track, index) => `
        <div class="track-item glass ${currentTrackIndex === index ? 'active' : ''}" data-index="${index}">
            <div class="track-info">
                <span class="track-icon">${track.source === 'youtube' ? '📺' : '🎵'}</span>
                <div>
                    <div class="track-name">${track.name}</div>
                    <div class="track-genre" style="color: ${genres[track.genre].colors[1]}">${genres[track.genre].name}</div>
                </div>
            </div>
            <div>
                ${track.source === 'local' ? `
                    <button class="download-btn" data-index="${index}">
                        <i class="material-icons">download</i>
                    </button>
                ` : ''}
                ${track.source === 'youtube' ? `
                    <button class="download-btn youtube-download-btn" data-index="${index}" data-video-id="${track.videoId}" data-video-title="${track.name}">
                        <i class="material-icons">file_download</i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    // Event listeners para las canciones
    document.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.download-btn')) {
                const index = parseInt(item.dataset.index);
                playTrack(index);
            }
        });
    });
    
    // Event listeners para descargas locales
    document.querySelectorAll('.download-btn:not(.youtube-download-btn)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            downloadTrack(index);
        });
    });
    
    // Event listeners para descargas de YouTube
    document.querySelectorAll('.youtube-download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const videoId = btn.dataset.videoId;
            const videoTitle = btn.dataset.videoTitle;
            
            // Mostrar modal informativo
            showDownloadModal();
            
            // Simular descarga después de cerrar el modal
            modalUnderstand.addEventListener('click', function handler() {
                hideDownloadModal();
                simulateYouTubeDownload(videoId, videoTitle);
                modalUnderstand.removeEventListener('click', handler);
            });
        });
    });
}

// Descargar track
function downloadTrack(index) {
    const track = playlist[index];
    if (track.source === 'local') {
        const a = document.createElement('a');
        a.href = track.url;
        a.download = `${track.name}.mp3`;
        a.click();
        speakDJ(`Descargando ${track.name}`);
    }
}

// Reproducir track
function playTrack(index) {
    const track = playlist[index];
    
    if (track.source === 'youtube') {
        // Cargar video de YouTube
        if (youtubePlayer && track.videoId) {
            videoPlaceholder.style.display = 'none';
            videoTitle.style.display = 'block';
            videoTitle.textContent = track.name;
            youtubePlayer.loadVideoById(track.videoId);
            youtubePlayer.playVideo();
        }
        
        currentTrackIndex = index;
        currentGenre = track.genre;
        
        currentTrackName.textContent = track.name;
        currentGenreEl.textContent = `Genre: ${genres[track.genre].name}`;
        
        updateThemeColors(track.genre);
        renderPlaylist();
        
        speakDJ(`Reproduciendo ${track.name} en YouTube`);
        return;
    }
    
    // Para archivos locales
    currentTrackIndex = index;
    currentGenre = track.genre;
    
    audio.src = track.url;
    audio.play();
    isPlaying = true;
    
    currentTrackName.textContent = track.name;
    currentGenreEl.textContent = `Genre: ${genres[track.genre].name}`;
    
    updateThemeColors(track.genre);
    updatePlayButton();
    renderPlaylist();
    
    // Inicializar visualización si no está inicializada
    if (!audioContext) {
        initAudioVisualization();
    }
    
    speakDJ(`Ahora suena ${track.name}. Género ${genres[track.genre].name}`);
}

// Siguiente track
function nextTrack() {
    if (playlist.length === 0) return;
    
    let nextIndex;
    if (radioMode) {
        // Modo radio: aleatorio
        nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
        // Modo normal: secuencial
        nextIndex = (currentTrackIndex + 1) % playlist.length;
    }
    
    playTrack(nextIndex);
}

// Track anterior
function prevTrack() {
    if (playlist.length === 0) return;
    
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    
    playTrack(prevIndex);
}

// Toggle play/pause
function togglePlay() {
    if (playlist.length === 0) {
        alert('¡Agrega música primero! 🎵');
        return;
    }
    
    if (currentTrackIndex === -1) {
        playTrack(0);
        return;
    }
    
    const track = playlist[currentTrackIndex];
    
    if (track.source === 'youtube') {
        // Para videos de YouTube, usar el reproductor de YouTube
        if (youtubePlayer) {
            if (youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                youtubePlayer.pauseVideo();
                speakDJ('Video pausado');
            } else {
                youtubePlayer.playVideo();
                speakDJ('Reproduciendo video');
            }
        }
        return;
    }
    
    // Para archivos locales
    if (isPlaying) {
        audio.pause();
        speakDJ('Pausado');
    } else {
        audio.play();
        speakDJ('Reproduciendo');
    }
    
    isPlaying = !isPlaying;
    updatePlayButton();
}

// Actualizar botón de play
function updatePlayButton() {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        playBtn.classList.add('playing');
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        playBtn.classList.remove('playing');
    }
}

// Formatear tiempo
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Event Listeners
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

// Modal event listeners
modalClose.addEventListener('click', hideDownloadModal);
modalCancel.addEventListener('click', hideDownloadModal);

// Modo radio
radioBtn.addEventListener('click', () => {
    radioMode = !radioMode;
    radioBtn.innerHTML = radioMode 
        ? '<span>📻</span> RADIO ON' 
        : '<span>📻</span> RADIO OFF';
    radioBtn.classList.toggle('active');
    radioBtn.style.color = radioMode ? genres[currentGenre].colors[0] : '#fff';
    speakDJ(radioMode ? 'Modo radio activado' : 'Modo radio desactivado');
});

// DJ toggle
djBtn.addEventListener('click', () => {
    djEnabled = !djEnabled;
    djBtn.innerHTML = djEnabled 
        ? '<span>🎤</span> DJ LIVE' 
        : '<span>🎤</span> DJ OFF';
    djBtn.classList.toggle('active');
    djBtn.style.color = djEnabled ? genres[currentGenre].colors[1] : '#fff';
    speakDJ(djEnabled ? 'DJ en vivo activado, qué onda mi gente' : 'DJ apagado');
});

// Control de volumen
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audio.volume = volume;
    const color = genres[currentGenre].colors[0];
    e.target.style.background = `linear-gradient(90deg, ${color} ${e.target.value}%, rgba(255,255,255,0.1) ${e.target.value}%)`;
});

// Actualizar progreso
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
});

// Cuando termina la canción
audio.addEventListener('ended', nextTrack);

// Clic en barra de progreso
progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

// Inicializar
updateThemeColors('electronic');
renderPlaylist();
renderDownloads();

console.log('🎵 MEGA PLAYER 2000 iniciado correctamente! 🎵');