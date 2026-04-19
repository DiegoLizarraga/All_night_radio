---

# ★ All Night Radio ★

<div align="center">

🎵 **Reproductor de música y descargador de YouTube/Spotify a MP3** 🎵

![Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

[https://github.com/user-attachments/assets/64d74306-d17d-482e-8aa1-2f77601bfff7](https://github.com/user-attachments/assets/64d74306-d17d-482e-8aa1-2f77601bfff7)

</div>

## ✨ Características Novedosas

### 🟢 Integración con Spotify
- []**Descarga de Tracks y Playlists**: Ahora puedes pegar enlaces de canciones o listas de reproducción completas de Spotify[cite: 1].
- []**Procesamiento Automático**: Utiliza un motor de búsqueda para localizar y descargar la mejor calidad disponible basándose en la metadata de Spotify[cite: 1].

### 🤖 Mascota Asistente (Radio-chan)
- []**Guía Interactiva**: Una mascota basada en la imagen `radio.png` que ayuda a los nuevos usuarios a entender la aplicación[cite: 1].
- []**Preguntas Frecuentes**: Sistema de respuestas predeterminadas sobre descargas, uso de archivos locales, modo DJ y códigos QR[cite: 1].
- []**Interfaz Animada**: Animaciones de flotado y burbujas de texto estilo Y2K[cite: 1].

---

## 🎵 Funcionalidades Principales

### 📺 Descargador Multimedia
- []**YouTube a MP3**: Descarga videos individuales con vista previa de miniatura, autor y duración[cite: 1].
- []**Conversión de Alta Calidad**: Uso de `ffmpeg` para garantizar archivos MP3 a 192k[cite: 1].
- []**Descarga Móvil**: Generación de códigos QR automáticos para descargar tracks directamente al celular vía Wi-Fi local[cite: 1].

### 🎧 Experiencia de Audio Pro
- []**Visualizador en Tiempo Real**: Análisis de frecuencias con Web Audio API y partículas reactivas a los bajos[cite: 1].
- []**Letras Automáticas**: Integración con la API de Genius para mostrar letras mientras escuchas tus canciones[cite: 1].
- []**DJ Virtual**: Un asistente de voz que anuncia tracks y comenta tus acciones en español[cite: 1].
- []**Sistema de GIFs**: Pantalla de TV integrada que cambia de animaciones según el ritmo[cite: 1].

---

## 🔧 Requisitos

### Software Necesario
- **Python 3.7+**
- **FFmpeg**: Necesario para la conversión de audio y descarga de Spotify.
- []**spotDL**: Motor para la gestión de enlaces de Spotify[cite: 1].

### Librerías Python
```bash
flask>=3.0.0
flask-cors>=4.0.0
pytubefix>=6.0.0
spotdl>=4.2.0
requests>=2.31.0
beautifulsoup4>=4.12.0
```

---

## 🚀 Instalación y Uso

### 1. Preparar el entorno
```bash
pip install -r requirements.txt
```

### 2. Iniciar el servidor
```bash
python app.py
```

### 3. Endpoints de la API actualizados
- []`POST /api/download-spotify`: Maneja enlaces de tracks y playlists de Spotify[cite: 1].
- []`GET /api/network-info`: Provee la IP local para la sincronización con el celular[cite: 1].
- []`GET /api/lyrics`: Busca letras basadas en el título y artista[cite: 1].

---

## 📂 Estructura del Proyecto
- []**`app.py`**: Servidor Flask con lógica para YouTube y Spotify[cite: 1].
- []**`mascot.js`**: Lógica del asistente interactivo y sus diálogos[cite: 1].
- []**`youtube-downloader.js`**: Gestor de descargas unificado (YT/Spotify)[cite: 1].
- []**`lyrics.js`**: Motor de búsqueda y renderizado de letras[cite: 1].
- []**`radio.png`**: Imagen de la mascota oficial de la aplicación[cite: 1].

---

## 🛠️ Tecnologías
- []**Backend**: Flask, PyTubeFix, spotDL, BeautifulSoup4[cite: 1].
- []**Frontend**: JavaScript ES6+, Canvas API (Visualizer), QRCode.js[cite: 1].
- []**Estilos**: CSS3 con animaciones Glitch y Glassmorphism[cite: 1].

---




**Los desarrolladores no se hacen responsables del uso indebido de esta herramienta. Úsala bajo tu propia responsabilidad.**

<div align="center">
🌟 <b>Coded with ♥ for Y2K vibes</b> 🌟
</div>
