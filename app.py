from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from pytubefix import YouTube
import os
from pathlib import Path
import re
import json

app = Flask(__name__)
# Configurar CORS con headers específicos para audio
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Length", "Content-Range"],
        "supports_credentials": False
    }
})

# Carpeta para archivos temporales
DOWNLOAD_FOLDER = Path("downloads")
DOWNLOAD_FOLDER.mkdir(exist_ok=True)

def sanitize_filename(filename):
    """Limpia el nombre del archivo de caracteres no válidos"""
    return re.sub(r'[<>:"/\\|?*]', '', filename)

@app.route('/')
def home():
    return jsonify({
        "message": "API de conversión YouTube a MP3",
        "endpoints": {
            "/api/info": "GET - Obtener información del video",
            "/api/download": "GET - Descargar el MP3",
            "/api/files": "GET - Listar archivos en downloads",
            "/downloads/<filename>": "GET - Servir archivo descargado"
        }
    })

@app.route('/api/info', methods=['GET'])
def get_video_info():
    """Obtiene información del video de YouTube"""
    try:
        url = request.args.get('url')
        
        if not url:
            return jsonify({"error": "Se requiere el parámetro 'url'"}), 400
        
        # Crear objeto YouTube
        yt = YouTube(url)
        
        # Obtener información del video
        info = {
            "success": True,
            "title": yt.title,
            "author": yt.author,
            "length": yt.length,
            "views": yt.views,
            "thumbnail": yt.thumbnail_url,
            "description": yt.description[:200] + "..." if len(yt.description) > 200 else yt.description,
            "videoId": yt.video_id
        }
        
        return jsonify(info)
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/download', methods=['GET'])
def download_mp3():
    """Descarga el video y lo convierte a MP3"""
    try:
        url = request.args.get('url')
        
        if not url:
            return jsonify({"error": "Se requiere el parámetro 'url'"}), 400
        
        # Crear objeto YouTube
        yt = YouTube(url)
        
        # Obtener el stream de audio de mayor calidad
        audio_stream = yt.streams.filter(only_audio=True).first()
        
        if not audio_stream:
            return jsonify({"error": "No se encontró stream de audio"}), 400
        
        # Nombre del archivo
        filename = sanitize_filename(yt.title)
        output_path = DOWNLOAD_FOLDER / f"{filename}.mp3"
        
        # Descargar el audio
        print(f"Descargando: {yt.title}")
        downloaded_file = audio_stream.download(
            output_path=DOWNLOAD_FOLDER,
            filename=f"{filename}.mp4"
        )
        
        # Convertir a MP3 (requiere ffmpeg instalado)
        try:
            import subprocess
            mp3_path = str(output_path)
            subprocess.run([
                'ffmpeg', '-i', downloaded_file,
                '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k',
                mp3_path, '-y'
            ], check=True, capture_output=True)
            
            # Eliminar el archivo mp4 temporal
            os.remove(downloaded_file)
            
        except Exception as e:
            # Si ffmpeg falla, renombrar el archivo descargado a mp3
            print(f"ffmpeg no disponible, usando archivo original: {e}")
            os.rename(downloaded_file, output_path)
        
        # Enviar el archivo
        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"{filename}.mp3",
            mimetype='audio/mpeg'
        )
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/download-to-server', methods=['POST'])
def download_to_server():
    """Descarga el MP3 y lo guarda en el servidor"""
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({"error": "Se requiere el parámetro 'url'"}), 400
        
        # Crear objeto YouTube
        yt = YouTube(url)
        
        # Obtener el stream de audio de mayor calidad
        audio_stream = yt.streams.filter(only_audio=True).first()
        
        if not audio_stream:
            return jsonify({"error": "No se encontró stream de audio"}), 400
        
        # Nombre del archivo
        filename = sanitize_filename(yt.title)
        output_path = DOWNLOAD_FOLDER / f"{filename}.mp3"
        
        # Descargar el audio
        print(f"Descargando: {yt.title}")
        downloaded_file = audio_stream.download(
            output_path=DOWNLOAD_FOLDER,
            filename=f"{filename}.mp4"
        )
        
        # Convertir a MP3 (requiere ffmpeg instalado)
        try:
            import subprocess
            mp3_path = str(output_path)
            subprocess.run([
                'ffmpeg', '-i', downloaded_file,
                '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k',
                mp3_path, '-y'
            ], check=True, capture_output=True)
            
            # Eliminar el archivo mp4 temporal
            os.remove(downloaded_file)
            
        except Exception as e:
            # Si ffmpeg falla, renombrar el archivo descargado a mp3
            print(f"ffmpeg no disponible, usando archivo original: {e}")
            os.rename(downloaded_file, output_path)
        
        # Retornar información del archivo
        return jsonify({
            "success": True,
            "filename": f"{filename}.mp3",
            "title": yt.title,
            "path": f"/downloads/{filename}.mp3"
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/files', methods=['GET'])
def list_files():
    """Lista todos los archivos MP3 en la carpeta downloads"""
    try:
        files = []
        for file in DOWNLOAD_FOLDER.glob('*.mp3'):
            files.append({
                "filename": file.name,
                "size": file.stat().st_size,
                "path": f"/downloads/{file.name}"
            })
        
        return jsonify({
            "success": True,
            "files": files
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/downloads/<path:filename>', methods=['GET'])
def serve_file(filename):
    """Sirve un archivo de la carpeta downloads con headers CORS"""
    try:
        response = send_from_directory(DOWNLOAD_FOLDER, filename)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """Limpia archivos temporales"""
    try:
        files_deleted = 0
        for file in DOWNLOAD_FOLDER.glob('*'):
            if file.is_file():
                file.unlink()
                files_deleted += 1
        
        return jsonify({
            "success": True,
            "message": f"Se eliminaron {files_deleted} archivos"
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    print("🚀 Servidor iniciado en http://localhost:5000")
    print("📝 Endpoints disponibles:")
    print("   - GET /api/info?url=<youtube_url>")
    print("   - GET /api/download?url=<youtube_url>")
    print("   - POST /api/download-to-server (JSON: {url: <youtube_url>})")
    print("   - GET /api/files")
    print("   - GET /downloads/<filename>")
    print("   - POST /api/cleanup")
    app.run(debug=True, port=5000)