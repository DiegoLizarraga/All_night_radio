// ============================================
// MASCOTA ASISTENTE
// Lógica para el funcionamiento de radio.png
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Referencias del DOM
    const mascotImg = document.getElementById('mascot-img');
    const speechBubble = document.getElementById('mascot-speech-bubble');
    const mascotText = document.getElementById('mascot-text');
    const mascotOptions = document.getElementById('mascot-options');

    // Preguntas Frecuentes Pre-programadas
    const faqs = [
        { 
            q: "📥 ¿Cómo descargo música?", 
            a: "¡Es súper fácil! Haz clic en el botón 'Download YouTube o Spotify', pega tu enlace (¡sí, playlists enteras de Spotify también!) y yo me encargo del resto." 
        },
        { 
            q: "🎵 ¿Cómo agrego música de mi compu?", 
            a: "Toca el botón 'Upload Local Files' y elige tus archivos MP3 o WAV. Los agregaré directo a la playlist para ti." 
        },
        { 
            q: "🎤 ¿Para qué es el botón DJ?", 
            a: "Al prender al DJ, anunciaré las canciones en voz alta y te contaré los cambios de ritmo que hagamos en el reproductor. ¡Como radio de verdad!" 
        },
        { 
            q: "📱 ¿Qué es el código QR?", 
            a: "Si estás reproduciendo una canción que descargamos, escanea el QR con tu teléfono y podrás bajar el MP3 directamente a tu móvil." 
        }
    ];

    // Función para mostrar menú de preguntas
    window.showMascotOptions = function() {
        mascotText.textContent = "¡Hola! Soy tu asistente Y2K. ¿Qué necesitas saber de la app?";
        mascotOptions.innerHTML = '';
        
        faqs.forEach(faq => {
            const btn = document.createElement('button');
            btn.className = 'mascot-btn glass';
            btn.textContent = faq.q;
            btn.onclick = () => {
                mascotText.textContent = faq.a;
                mascotOptions.innerHTML = '<button class="mascot-btn glass" onclick="showMascotOptions()">⬅️ Volver</button>';
            };
            mascotOptions.appendChild(btn);
        });
        
        speechBubble.classList.remove('hidden');
    };

    // Al tocar la mascota
    mascotImg.addEventListener('click', () => {
        if (speechBubble.classList.contains('hidden')) {
            showMascotOptions();
        } else {
            speechBubble.classList.add('hidden');
        }
    });
});