// ============================================
// QR MOBILE DOWNLOADER
// Genera un QR para descargar la canción en el celular
// ============================================

(function () {
    // ── Config ──────────────────────────────────────────────────────────────
    const QR_LIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    const SERVER_URL  = 'http://localhost:5000';

    // ── Inyectar QRCode.js ──────────────────────────────────────────────────
    function loadQRLib(cb) {
        if (window.QRCode) { cb(); return; }
        const s = document.createElement('script');
        s.src = QR_LIB_URL;
        s.onload  = cb;
        s.onerror = () => console.error('No se pudo cargar QRCode.js');
        document.head.appendChild(s);
    }

    // ── Detectar IP local del servidor ─────────────────────────────────────
    async function getServerBaseUrl() {
        // Intenta obtener la IP real del servidor para que funcione en la red local
        try {
            const res = await fetch(`${SERVER_URL}/api/network-info`, { signal: AbortSignal.timeout(1500) });
            if (res.ok) {
                const d = await res.json();
                if (d.local_ip) return `http://${d.local_ip}:5000`;
            }
        } catch (_) {}
        // Fallback: usa el host actual
        return `http://${window.location.hostname}:5000`;
    }

    // ── Crear / mostrar el panel QR ────────────────────────────────────────
    function buildPanel() {
        if (document.getElementById('qr-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'qr-panel';
        panel.innerHTML = `
            <div id="qr-panel-inner">
                <button id="qr-close-btn" aria-label="Cerrar">✕</button>
                <p class="qr-label">★ SCAN TO DOWNLOAD ★</p>
                <div id="qr-canvas-wrap">
                    <div id="qr-canvas"></div>
                </div>
                <p id="qr-track-name"></p>
                <p class="qr-hint">Apunta la cámara de tu celular 📱</p>
                <div class="qr-signal-bar"><span></span><span></span><span></span></div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('qr-close-btn').addEventListener('click', hidePanel);
        panel.addEventListener('click', e => { if (e.target === panel) hidePanel(); });
    }

    function showPanel(trackName, downloadUrl) {
        buildPanel();
        const panel     = document.getElementById('qr-panel');
        const wrap      = document.getElementById('qr-canvas');
        const nameEl    = document.getElementById('qr-track-name');

        nameEl.textContent = trackName;
        wrap.innerHTML = '';          // limpiar QR anterior

        new QRCode(wrap, {
            text         : downloadUrl,
            width        : 220,
            height       : 220,
            colorDark    : '#FF8C42',
            colorLight   : '#0a0a14',
            correctLevel : QRCode.CorrectLevel.H
        });

        panel.classList.add('visible');
    }

    function hidePanel() {
        const panel = document.getElementById('qr-panel');
        if (panel) panel.classList.remove('visible');
    }

    // ── Botón flotante QR ──────────────────────────────────────────────────
    function createQRButton() {
        if (document.getElementById('qr-float-btn')) return;

        const btn = document.createElement('button');
        btn.id        = 'qr-float-btn';
        btn.innerHTML = '<span class="qr-icon">⬡</span><span class="qr-btn-label">QR</span>';
        btn.title     = 'Generar QR para descargar en el celular';
        btn.style.display = 'none';
        document.body.appendChild(btn);

        btn.addEventListener('click', async () => {
            const idx = window.currentTrackIndex;
            if (idx == null || idx < 0 || !window.playlist || !window.playlist[idx]) {
                showToast('▲ Reproduce una canción primero');
                return;
            }

            const track = window.playlist[idx];

            // Solo funciona para tracks del servidor (source: downloaded)
            if (track.source !== 'downloaded') {
                showToast('⚠ Solo disponible para canciones descargadas de YouTube');
                return;
            }

            btn.classList.add('loading');
            const base = await getServerBaseUrl();
            // Extraer solo el nombre del archivo de la URL
            const filename = track.url.split('/downloads/').pop();
            const dlUrl    = `${base}/downloads/${filename}`;
            btn.classList.remove('loading');

            loadQRLib(() => showPanel(track.name, dlUrl));
        });
    }

    // ── Observar cambios en currentTrackIndex ─────────────────────────────
    function watchTrack() {
        let lastIndex = -1;
        setInterval(() => {
            const idx   = window.currentTrackIndex;
            const track = window.playlist?.[idx];
            const btn   = document.getElementById('qr-float-btn');
            if (!btn) return;

            if (idx !== lastIndex) {
                lastIndex = idx;
                hidePanel();
            }

            // Mostrar botón solo para tracks descargados
            if (track && track.source === 'downloaded') {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
        }, 500);
    }

    // ── Toast pequeño ──────────────────────────────────────────────────────
    function showToast(msg) {
        let t = document.getElementById('qr-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'qr-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._timer);
        t._timer = setTimeout(() => t.classList.remove('show'), 3000);
    }

    // ── Estilos ────────────────────────────────────────────────────────────
    function injectStyles() {
        const css = `
/* ── QR Float Button ─────────────────────────────────────── */
#qr-float-btn {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.65rem 1.2rem 0.65rem 0.9rem;
    border: none;
    border-radius: 2rem;
    background: linear-gradient(135deg, #FF8C42 0%, #2B6A7C 100%);
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    box-shadow: 0 0 18px rgba(255,140,66,0.55), 0 4px 14px rgba(0,0,0,0.4);
    transition: transform 0.2s, box-shadow 0.2s;
}
#qr-float-btn:hover {
    transform: scale(1.07);
    box-shadow: 0 0 32px rgba(255,140,66,0.8), 0 6px 20px rgba(0,0,0,0.5);
}
#qr-float-btn .qr-icon {
    font-size: 1.15rem;
    line-height: 1;
    animation: qr-spin 4s linear infinite;
}
#qr-float-btn.loading .qr-icon { animation: qr-spin 0.5s linear infinite; }
@keyframes qr-spin {
    0%   { transform: rotate(0deg);   }
    100% { transform: rotate(360deg); }
}

/* ── Panel overlay ───────────────────────────────────────── */
#qr-panel {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10,10,20,0.82);
    backdrop-filter: blur(14px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s ease;
}
#qr-panel.visible {
    opacity: 1;
    pointer-events: all;
}

/* ── Panel inner card ────────────────────────────────────── */
#qr-panel-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
    padding: 2rem 2.2rem 1.8rem;
    border-radius: 1.8rem;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,140,66,0.35);
    box-shadow: 0 0 60px rgba(255,140,66,0.22), 0 20px 60px rgba(0,0,0,0.5);
    animation: qr-card-in 0.35s cubic-bezier(.22,1,.36,1) both;
}
@keyframes qr-card-in {
    from { transform: scale(0.88) translateY(20px); opacity: 0; }
    to   { transform: scale(1)    translateY(0);    opacity: 1; }
}

/* close */
#qr-close-btn {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 1.3rem;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    line-height: 1;
}
#qr-close-btn:hover { color: #FF8C42; transform: rotate(90deg); }

/* label */
.qr-label {
    font-family: 'Bungee', cursive;
    font-size: 1.1rem;
    color: #FF8C42;
    letter-spacing: 0.12em;
    text-shadow: 0 0 14px rgba(255,140,66,0.6);
    text-align: center;
    margin: 0;
}

/* QR wrapper — scan-line effect */
#qr-canvas-wrap {
    position: relative;
    padding: 12px;
    border-radius: 1rem;
    background: #0a0a14;
    border: 2px solid rgba(255,140,66,0.4);
    box-shadow: 0 0 24px rgba(255,140,66,0.25);
    overflow: hidden;
}
#qr-canvas-wrap::after {
    content: '';
    position: absolute;
    left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #FF8C42, transparent);
    top: 0;
    animation: qr-scan 2.2s ease-in-out infinite;
}
@keyframes qr-scan {
    0%   { top: 0%;   opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
}

/* corner brackets */
#qr-canvas-wrap::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    background:
        linear-gradient(#0a0a14,#0a0a14) padding-box,
        linear-gradient(135deg,#FF8C42 0%,transparent 40%,transparent 60%,#2B6A7C 100%) border-box;
    pointer-events: none;
}

/* track name */
#qr-track-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.85rem;
    color: #C5D633;
    text-align: center;
    max-width: 240px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    text-shadow: 0 0 8px rgba(197,214,51,0.5);
}

/* hint */
.qr-hint {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
    text-align: center;
    margin: 0;
    letter-spacing: 0.05em;
}

/* signal bars decoration */
.qr-signal-bar {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 20px;
}
.qr-signal-bar span {
    width: 7px;
    background: #2B6A7C;
    border-radius: 2px;
    animation: qr-signal 1.4s ease-in-out infinite;
}
.qr-signal-bar span:nth-child(1) { height: 8px;  animation-delay: 0s;    }
.qr-signal-bar span:nth-child(2) { height: 13px; animation-delay: 0.2s;  }
.qr-signal-bar span:nth-child(3) { height: 20px; animation-delay: 0.4s;  }
@keyframes qr-signal {
    0%, 100% { background: #2B6A7C; }
    50%       { background: #FF8C42; box-shadow: 0 0 8px #FF8C42; }
}

/* ── Toast ───────────────────────────────────────────────── */
#qr-toast {
    position: fixed;
    bottom: 5.5rem;
    left: 2rem;
    z-index: 1200;
    padding: 0.6rem 1.2rem;
    border-radius: 2rem;
    background: rgba(0,0,0,0.85);
    border: 1px solid rgba(255,140,66,0.4);
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.8rem;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.25s, transform 0.25s;
    pointer-events: none;
}
#qr-toast.show { opacity: 1; transform: translateY(0); }
        `;
        const tag = document.createElement('style');
        tag.id = 'qr-mobile-styles';
        tag.textContent = css;
        document.head.appendChild(tag);
    }

    // ── Init ───────────────────────────────────────────────────────────────
    function init() {
        injectStyles();
        createQRButton();
        watchTrack();
        console.log('📱 QR Mobile Downloader listo');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();