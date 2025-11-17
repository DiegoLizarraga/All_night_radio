// ============================================
// VARIABLES GLOBALES
// ============================================
let playlist = [];
let currentTrackIndex = -1;
let isPlaying = false;
let radioMode = false;
let djEnabled = false;
let currentGenre = 'electronic';
let youtubePlayer = null;

// Variables para visualización de audio
let audioContext = null;
let analyser = null;
let source = null;
let dataArray = null;
let bufferLength = null;
let animationId = null;
let canvas = null;
let ctx = null;

// Variables para GIFs
let gifs = [];
let currentGifIndex = 0;
let gifDisplay = document.getElementById('gif-display');
let currentGif = document.getElementById('current-gif');
let gifPlaceholder = document.getElementById('gif-placeholder');
let gifTitle = document.getElementById('gif-title');
let gifList = document.getElementById('gif-list');
let prevGifBtn = document.getElementById('prev-gif-btn');
let nextGifBtn = document.getElementById('next-gif-btn');
let randomGifBtn = document.getElementById('random-gif-btn');
let gifTvContainer = document.querySelector('.gif-tv-container');

// Array de partículas para visualización
const particles = [];

// 🔥 CONFIGURACIÓN DE GIFS - EDITA AQUÍ TUS GIFS 🔥
const gifUrls = [
    {
        name: 'gato',
        url: 'https://th.bing.com/th/id/R.7ca94c0ab58daa52cc8ca8adc6539ee4?rik=CHJN%2fbgbK0WNWg&pid=ImgRaw&r=0'
    },
    {
        name: 'azul ritmo',
        url: 'https://media.tenor.com/fuZLwPX0FpMAAAAd/jet-set-radio-future-jet-set-radio.gif'
    },
    {
        name: 'ritmo rojo',
        url: 'https://i.pinimg.com/originals/45/47/64/454764dc1c3f772dd9957ff1b4d6893c.gif'
    },
    {
        name: 'ritmo gato',
        url: 'https://media.tenor.com/FMGsG1FM67MAAAAM/bomb-rush-cyberfunk.gif'
    },
    {
        name: 'gum',
        url: 'https://64.media.tumblr.com/8ee57945253145d69297afa4c532e498/tumblr_p8ekvmJPtu1xq94wqo1_540.gif'
    },
    { 
        name: 'gato blanco', 
        url: 'https://media.tenor.com/52esqHpENRwAAAAM/cat-dancing.gif'
    }
];

// ============================================
// ELEMENTOS DEL DOM
// ============================================
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
const playlistEl = document.getElementById('playlist');
const currentTrackName = document.getElementById('current-track-name');
const currentGenreEl = document.getElementById('current-genre');
const genreDisplay = document.getElementById('genre-display');
const backgroundAnimation = document.getElementById('background-animation');
const shape1 = document.querySelector('.shape-1');
const shape2 = document.querySelector('.shape-2');
const shape3 = document.querySelector('.shape-3');

// ============================================
// GÉNEROS Y COLORES
// ============================================
const genres = {
    electronic: { 
        colors: ['#FF8C42', '#2B6A7C', '#C5D633'], 
        name: 'Electronic' 
    },
    rock: { 
        colors: ['#F4D03F', '#FF8C42', '#2B6A7C'], 
        name: 'Rock' 
    },
    pop: { 
        colors: ['#C5D633', '#F4D03F', '#2B6A7C'], 
        name: 'Pop' 
    },
    hiphop: { 
        colors: ['#2B6A7C', '#F4D03F', '#FF8C42'], 
        name: 'Hip Hop' 
    },
    jazz: { 
        colors: ['#FF8C42', '#C5D633', '#F4D03F'], 
        name: 'Jazz' 
    },
    default: { 
        colors: ['#FF8C42', '#2B6A7C', '#C5D633'], 
        name: 'Mixed' 
    }
};

// ============================================
// SISTEMA DE GIFS
// ============================================
function loadGifs() {
    gifs = gifUrls.map((gif, index) => ({
        id: index,
        name: gif.name,
        url: gif.url,
        preview: gif.url
    }));
    
    renderGifList();
    if (gifs.length > 0) {
        showGif(0);
    }
}

function renderGifList() {
    if (gifs.length === 0) {
        gifList.innerHTML = '<p class="empty-playlist">No GIFs loaded... Add URLs to gifUrls array! 🎬</p>';
        return;
    }
    
    gifList.innerHTML = gifs.map((gif, index) => `
        <div class="gif-item glass ${currentGifIndex === index ? 'active' : ''}" data-index="${index}">
            <div class="gif-info">
                <span class="gif-icon">🎬</span>
                <div>
                    <div class="gif-name">${gif.name}</div>
                </div>
            </div>
            <img src="${gif.url}" alt="${gif.name}" class="gif-preview" 
                 onerror="this.style.display='none'">
        </div>
    `).join('');
    
    document.querySelectorAll('.gif-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            showGif(index);
        });
    });
}

function adjustGifContainerSize(gifUrl) {
    const img = new Image();
    img.onload = function() {
        const width = this.naturalWidth;
        const height = this.naturalHeight;
        const aspectRatio = width / height;
        const maxWidth = gifDisplay.parentElement.offsetWidth;
        const maxHeight = 500;
        
        let displayHeight;
        
        if (width / height > maxWidth / maxHeight) {
            displayHeight = maxWidth / aspectRatio;
        } else {
            displayHeight = Math.min(height, maxHeight);
        }
        
        gifDisplay.style.height = `${displayHeight}px`;
        gifTvContainer.style.height = `${displayHeight + 60}px`;
        currentGif.style.width = '100%';
        currentGif.style.height = '100%';
    };
    
    img.src = gifUrl;
}

function showGif(index) {
    if (gifs.length === 0) return;
    
    currentGifIndex = (index + gifs.length) % gifs.length;
    const gif = gifs[currentGifIndex];
    
    gifPlaceholder.style.display = 'none';
    currentGif.style.display = 'block';
    currentGif.src = gif.url;
    
    adjustGifContainerSize(gif.url);
    
    gifTitle.textContent = gif.name;
    gifTitle.style.display = 'block';
    
    renderGifList();
    
    if (djEnabled) {
        speakDJ(`GIF cambiado a ${gif.name}`);
    }
}

// Event listeners para GIFs
prevGifBtn.addEventListener('click', () => showGif(currentGifIndex - 1));
nextGifBtn.addEventListener('click', () => showGif(currentGifIndex + 1));
randomGifBtn.addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * gifs.length);
    showGif(randomIndex);
});

// ============================================
// VISUALIZACIÓN DE AUDIO
// ============================================
function initAudioVisualization() {
    try {
        canvas = document.getElementById('audio-visualizer');
        ctx = canvas.getContext('2d');
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        visualize();
    } catch (error) {
        console.error('Error initializing audio visualization:', error);
    }
}

function visualize() {
    try {
        animationId = requestAnimationFrame(visualize);
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(10, 10, 20, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const bassAvg = getAverage(0, 10);
        const midAvg = getAverage(10, 50);
        const trebleAvg = getAverage(50, bufferLength);
        
        updateShapes(bassAvg, midAvg, trebleAvg);
        drawBars();
        drawParticles(bassAvg, midAvg, trebleAvg);
    } catch (error) {
        console.error('Error in visualization:', error);
    }
}

function getAverage(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += dataArray[i];
    }
    return sum / (end - start);
}

function updateShapes(bass, mid, treble) {
    try {
        const bassScale = 1 + (bass / 255) * 0.5;
        shape1.style.transform = `scale(${bassScale})`;
        shape2.style.transform = `scale(${1 + (mid / 255) * 0.3})`;
        shape3.style.transform = `scale(${1 + (treble / 255) * 0.4})`;
        
        shape1.style.opacity = 0.15 + (bass / 255) * 0.35;
        shape2.style.opacity = 0.15 + (mid / 255) * 0.35;
        shape3.style.opacity = 0.15 + (treble / 255) * 0.35;
        
        const colors = genres[currentGenre].colors;
        const bassIntensity = bass / 255;
        const midIntensity = mid / 255;
        const trebleIntensity = treble / 255;
        
        shape1.style.background = interpolateColor(colors[0], colors[1], bassIntensity);
        shape2.style.background = interpolateColor(colors[1], colors[2], midIntensity);
        shape3.style.background = interpolateColor(colors[2], colors[0], trebleIntensity);
        
        if (bass > 180) {
            gifTvContainer.classList.add('dancing');
            const color = interpolateColor(colors[0], colors[1], bassIntensity);
            gifTvContainer.style.borderColor = color;
            gifTvContainer.style.boxShadow = `0 0 ${30 + bass/5}px ${color}`;
        } else {
            gifTvContainer.classList.remove('dancing');
            gifTvContainer.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            gifTvContainer.style.boxShadow = '0 0 30px rgba(255, 140, 66, 0.3)';
        }
    } catch (error) {
        console.error('Error updating shapes:', error);
    }
}

function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function drawBars() {
    try {
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.7;
            const hue = (i / bufferLength) * 360;
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    } catch (error) {
        console.error('Error drawing bars:', error);
    }
}

function drawParticles(bass, mid, treble) {
    try {
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
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.01;
            
            if (p.life <= 0 || p.y > canvas.height) {
                particles.splice(i, 1);
                continue;
            }
            
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
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

// ============================================
// GESTIÓN DE PLAYLIST
// ============================================
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

function updateThemeColors(genre) {
    const colors = genres[genre].colors;
    backgroundAnimation.style.background = `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}22, ${colors[2]}22)`;
    genreDisplay.textContent = `.:* Sigue el ritmo 🎧 *:.`;
    genreDisplay.style.color = colors[0];
    
    progressBar.style.background = `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
    progressBar.style.boxShadow = `0 0 20px ${colors[0]}`;
    
    prevBtn.style.color = colors[0];
    playBtn.style.color = colors[1];
    nextBtn.style.color = colors[2];
    
    shape1.style.background = colors[0];
    shape2.style.background = colors[1];
    shape3.style.background = colors[2];
}

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
                ${track.source === 'local' || track.source === 'downloaded' ? `
                    <button class="download-btn" data-index="${index}">
                        <i class="material-icons">download</i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.download-btn')) {
                const index = parseInt(item.dataset.index);
                playTrack(index);
            }
        });
    });
    
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            downloadTrack(index);
        });
    });
}

function downloadTrack(index) {
    const track = playlist[index];
    if (track.source === 'local' || track.source === 'downloaded') {
        const a = document.createElement('a');
        a.href = track.url;
        a.download = `${track.name}.mp3`;
        a.click();
        speakDJ(`Descargando ${track.name}`);
    }
}

// ============================================
// REPRODUCCIÓN
// ============================================
function playTrack(index) {
    const track = playlist[index];
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
    
    if (!audioContext) {
        initAudioVisualization();
    }
    
    speakDJ(`Ahora suena ${track.name}. Género ${genres[track.genre].name}`);
}

function nextTrack() {
    if (playlist.length === 0) return;
    
    let nextIndex;
    if (radioMode) {
        nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
        nextIndex = (currentTrackIndex + 1) % playlist.length;
    }
    
    playTrack(nextIndex);
}

function prevTrack() {
    if (playlist.length === 0) return;
    
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    
    playTrack(prevIndex);
}

function togglePlay() {
    if (playlist.length === 0) {
        alert('¡Agrega música primero! 🎵');
        return;
    }
    
    if (currentTrackIndex === -1) {
        playTrack(0);
        return;
    }
    
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

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// EVENT LISTENERS
// ============================================
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

radioBtn.addEventListener('click', () => {
    radioMode = !radioMode;
    radioBtn.innerHTML = radioMode ? '<span>📻</span> RADIO ON' : '<span>📻</span> RADIO OFF';
    radioBtn.classList.toggle('active');
    radioBtn.style.color = radioMode ? genres[currentGenre].colors[0] : '#fff';
    speakDJ(radioMode ? 'Modo radio activado' : 'Modo radio desactivado');
});

djBtn.addEventListener('click', () => {
    djEnabled = !djEnabled;
    djBtn.innerHTML = djEnabled ? '<span>🎤</span> DJ LIVE' : '<span>🎤</span> DJ OFF';
    djBtn.classList.toggle('active');
    djBtn.style.color = djEnabled ? genres[currentGenre].colors[1] : '#fff';
    speakDJ(djEnabled ? 'DJ en vivo activado, qué onda mi gente' : 'DJ apagado');
});

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audio.volume = volume;
    const color = genres[currentGenre].colors[0];
    e.target.style.background = `linear-gradient(90deg, ${color} ${e.target.value}%, rgba(255,255,255,0.1) ${e.target.value}%)`;
});

audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', nextTrack);

progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

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
    
    if (!audioContext) {
        initAudioVisualization();
    }
});

// ============================================
// INICIALIZACIÓN
// ============================================
updateThemeColors('electronic');
renderPlaylist();
loadGifs();

console.log('🎵 All_night_radio iniciado correctamente! 🎵');