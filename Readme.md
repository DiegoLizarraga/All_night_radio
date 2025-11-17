# ★ All Night Radio ★

<div align="center">

🎵 **Reproductor de música y descargador de YouTube a MP3** 🎵

![Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

</div>


## ✨ Características
 cambian automáticamente según el género musical

### 🎵 Reproductor Completo
- **Controles básicos**: Play/Pause, Siguiente, Anterior
- **Barra de progreso interactiva**: Haz clic para saltar a cualquier parte de la canción
- **Control de volumen**: Slider con indicador visual
- **Detección automática de género**: Identifica el género por el nombre del archivo
- **Playlist dinámica**: Agrega y gestiona tus canciones fácilmente

### 📺 Descargador de YouTube a MP3
- **Interfaz modal elegante**: Diseño integrado con el tema principal
- **Vista previa del video**: Muestra thumbnail, título, autor y duración
- **Descarga al servidor**: Guarda automáticamente en la carpeta `downloads/`
- **Auto-carga**: Lee archivos existentes en `downloads/` al iniciar
- **Conversión automática**: Usa ffmpeg para convertir a MP3 de alta calidad
- **Barra de progreso animada**: Feedback visual durante la descarga

### 🎤 DJ Virtual
- **Síntesis de voz**: Anuncia las canciones y cambios en el reproductor
- **Comentarios automáticos**: Notificaciones habladas de las acciones
- **Idioma español**: Configurado para hablar en español

### 📻 Modo Radio
- **Reproducción aleatoria**: Shuffle automático de tu playlist
- **Transiciones automáticas**: Cambia de canción al terminar cada track

### 🎧 Visualización de Audio
- **Análisis en tiempo real**: Usa Web Audio API para analizar frecuencias
- **Partículas reactivas**: Efectos visuales que responden a los bajos
- **Formas animadas**: Círculos de fondo que cambian con la música
- **Barras de frecuencia**: Visualización tipo ecualizador

### 📥 Gestión de Archivos
- **Upload local**: Sube archivos MP3/WAV desde tu dispositivo
- **Descarga de tracks**: Guarda canciones de tu playlist
- **Organización automática**: Mantiene todo en la carpeta `downloads/`

---

## 🖼️ Capturas de Pantalla

<img width="1015" height="698" alt="image" src="https://github.com/user-attachments/assets/ed2f093a-6fe6-4b3a-8bc0-f3f07df7eef4" />

---

## 🔧 Requisitos

### Software Necesario

- **Python 3.7+** - [Descargar Python](https://www.python.org/downloads/)
- **pip** (incluido con Python)
- **ffmpeg** (opcional, pero recomendado para mejor calidad)
  - Windows: [Descargar FFmpeg](https://ffmpeg.org/download.html)
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

### Librerías Python

```bash
flask>=3.0.0
flask-cors>=4.0.0
pytubefix>=6.0.0
```

### Navegador Web Moderno

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

---

##  Instalación

### 1. Clonar o descargar el proyecto

```bash
# Opción A: Clonar con git
git clone https://github.com/tu-usuario/all-night-radio.git
cd all-night-radio

# Opción B: Descargar y descomprimir el ZIP
# Luego navegar a la carpeta
cd all-night-radio
```

### 2. Instalar dependencias de Python

```bash
pip install flask flask-cors pytubefix
```

O usando el archivo `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 3. (Opcional) Instalar FFmpeg

Para mejor calidad de audio:

**Windows:**
1. Descargar de [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extraer y agregar al PATH del sistema

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

---

##  Uso

### Iniciar el Servidor Backend

```bash
python app.py
```

Deberías ver:
```
🚀 Servidor iniciado en http://localhost:5000
📝 Endpoints disponibles:
   - GET /api/info?url=<youtube_url>
   - GET /api/download?url=<youtube_url>
   - POST /api/download-to-server (JSON: {url: <youtube_url>})
   - GET /api/files
   - GET /downloads/<filename>
   - POST /api/cleanup
```

### Abrir la Interfaz Web

**Opción A: Abrir directamente**
```bash
# Simplemente abre index.html en tu navegador
# (doble clic en el archivo)
```

**Opción B: Usar servidor local (recomendado para CORS)**
```bash
# Terminal 2 (nueva ventana)
python -m http.server 8000

# Luego abre en el navegador:
# http://localhost:8000/index.html
```

### Usar la Aplicación

1. **Subir archivos locales:**
   - Clic en "Upload Local Files"
   - Selecciona tus archivos MP3/WAV
   - Se agregarán automáticamente a la playlist

2. **Descargar de YouTube:**
   - Clic en "📺 Download YouTube MP3"
   - Pega la URL del video
   - Clic en "Obtener información"
   - Revisa la información y clic en "Descargar MP3"
   - Se agregará automáticamente a la playlist

3. **Reproducir música:**
   - Clic en cualquier canción de la playlist
   - Usa los controles de play/pause/siguiente/anterior
   - Ajusta el volumen con el slider

4. **Activar funciones especiales:**
   - **📻 RADIO**: Activa reproducción aleatoria
   - **🎤 DJ**: Activa anuncios de voz

---


### Archivos Principales

**`app.py`**
- Servidor Flask con API REST
- Maneja descarga y conversión de videos de YouTube
- Sirve archivos MP3 con headers CORS correctos
- Endpoints para listar y limpiar archivos

**`index.html`**
- Interfaz completa del reproductor
- Visualizador de audio con Canvas
- Controles de reproducción
- Gestión de playlist

**`youtube-downloader.js`**
- Modal de descarga de YouTube
- Integración con la API del backend
- Auto-carga de archivos existentes
- Sistema de notificaciones

---

## 🛠️ Tecnologías

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos y animaciones
- **JavaScript (ES6+)** - Lógica y funcionalidad
- **Web Audio API** - Visualización de audio
- **Canvas API** - Gráficos y efectos
- **YouTube IFrame API** - Reproductor de YouTube embebido

### Backend
- **Python 3.7+** - Lenguaje del servidor
- **Flask** - Framework web
- **Flask-CORS** - Manejo de Cross-Origin Resource Sharing
- **pytubefix** - Descarga de videos de YouTube
- **FFmpeg** - Conversión de audio (opcional)

### Fuentes y Recursos
- **Google Fonts**: Russo One, Orbitron, Bungee, ZCOOL KuaiLe
- **Material Icons**: Iconos de la interfaz

---


**Los desarrolladores de este proyecto NO se hacen responsables del uso indebido de esta herramienta.**

---


## 🙏 Agradecimientos

- **Jet Set Radio** - Por la inspiración visual a lo mejor luego los ponemos
- **pytubefix** - Por hacer posible la descarga de YouTube
- **Flask** - Por el excelente framework web
- **Material Design** - Por los iconos
- **Google Fonts** - Por las tipografías

---


**⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐**

</div>
