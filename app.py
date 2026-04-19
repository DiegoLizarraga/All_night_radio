from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from pytubefix import YouTube
import os
import socket
from pathlib import Path
import re
import requests
from bs4 import BeautifulSoup
import urllib.parse
import subprocess

# Initialize Flask app first
app = Flask(__name__)
# Configure CORS with specific headers for audio
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Length", "Content-Range"],
        "supports_credentials": False
    }
})

# Configuration of Genius API
GENIUS_API_TOKEN = 'AS0-MqTotWnOpqHquZjSL3keqUOCE4oHnocf731rpEIN53em4suTdFwdptnmgtVe'
GENIUS_API_URL = 'https://api.genius.com'

# Folder for temporary files
DOWNLOAD_FOLDER = Path("downloads")
DOWNLOAD_FOLDER.mkdir(exist_ok=True)

def sanitize_filename(filename):
    """Cleans filename of invalid characters"""
    return re.sub(r'[<>:"/\\|?*]', '', filename)

def get_local_ip():
    """Gets the local IP address of the machine on the network"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def search_genius_song(title, artist=''):
    """Search song on Genius"""
    headers = {'Authorization': f'Bearer {GENIUS_API_TOKEN}'}
    search_query = f"{title} {artist}".strip()
    
    try:
        search_url = f"{GENIUS_API_URL}/search"
        params = {'q': search_query}
        response = requests.get(search_url, headers=headers, params=params, timeout=10)
        data = response.json()
        
        if data['response']['hits']:
            song_info = data['response']['hits'][0]['result']
            return {
                'success': True,
                'title': song_info['title'],
                'artist': song_info['primary_artist']['name'],
                'url': song_info['url'],
                'thumbnail': song_info['song_art_image_url']
            }
        else:
            return {'success': False, 'error': 'Song not found'}
    
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_lyrics_from_genius(song_url):
    """Extract lyrics from Genius page"""
    try:
        response = requests.get(song_url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        lyrics_div = soup.find('div', {'data-lyrics-container': 'true'})
        
        if lyrics_div:
            lyrics_containers = soup.find_all('div', {'data-lyrics-container': 'true'})
            lyrics = []
            
            for container in lyrics_containers:
                for br in container.find_all('br'):
                    br.replace_with('\n')
                lyrics.append(container.get_text())
            
            full_lyrics = '\n'.join(lyrics).strip()
            full_lyrics = re.sub(r'\[.*?\]', '', full_lyrics)
            full_lyrics = re.sub(r'\n{3,}', '\n\n', full_lyrics)
            
            return {'success': True, 'lyrics': full_lyrics}
        else:
            return {'success': False, 'error': 'Could not extract lyrics'}
    
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.route('/')
def home():
    return jsonify({
        "message": "All Night Radio API",
        "status": "online"
    })

@app.route('/api/network-info', methods=['GET'])
def network_info():
    local_ip = get_local_ip()
    return jsonify({
        "success": True,
        "local_ip": local_ip,
        "server_url": f"http://{local_ip}:5000",
        "note": "Use this URL to access the server from other devices on the same network"
    })

@app.route('/api/info', methods=['GET'])
def get_video_info():
    try:
        url = request.args.get('url')
        if not url:
            return jsonify({"success": False, "error": "Parameter 'url' is required"}), 400
        
        yt = YouTube(url)
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

@app.route('/api/download-spotify', methods=['POST', 'OPTIONS'])
def download_spotify():
    """Descarga canciones o playlists desde Spotify usando spotdl"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        url = data.get('url') if data else None
        
        if not url or 'spotify.com' not in url:
            return jsonify({"success": False, "error": "Se requiere una URL de Spotify"}), 400
        
        print(f"🎵 Iniciando descarga de Spotify: {url}")
        
        # Ejecutar spotdl como subproceso
        result = subprocess.run([
            'spotdl', 'download', url,
            '--format', 'mp3',
            '--output', str(DOWNLOAD_FOLDER)
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Error en spotdl: {result.stderr}")
            return jsonify({"success": False, "error": "Error al procesar el enlace de Spotify"}), 500
            
        print("✅ Descarga de Spotify completada")
        
        return jsonify({
            "success": True,
            "message": "Archivos de Spotify descargados correctamente",
            "reload_files": True
        })
        
    except Exception as e:
        print(f"❌ Error en descarga de Spotify: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/download-to-server', methods=['POST', 'OPTIONS'])
def download_to_server():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        url = data.get('url') if data else None
        
        if not url:
            return jsonify({"success": False, "error": "Parameter 'url' is required"}), 400
        
        print(f"📥 Iniciando descarga de: {url}")
        yt = YouTube(url)
        audio_stream = yt.streams.filter(only_audio=True).first()
        
        if not audio_stream:
            return jsonify({"success": False, "error": "No audio stream found"}), 400
        
        filename = sanitize_filename(yt.title)
        output_path = DOWNLOAD_FOLDER / f"{filename}.mp3"
        
        print(f"💾 Descargando: {yt.title}")
        downloaded_file = audio_stream.download(
            output_path=DOWNLOAD_FOLDER,
            filename=f"{filename}.mp4"
        )
        
        try:
            import subprocess
            mp3_path = str(output_path)
            subprocess.run([
                'ffmpeg', '-i', downloaded_file,
                '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k',
                mp3_path, '-y'
            ], check=True, capture_output=True)
            os.remove(downloaded_file)
        except Exception as e:
            os.rename(downloaded_file, output_path)
        
        print(f"✅ Descarga completada: {filename}.mp3")
        return jsonify({
            "success": True,
            "filename": f"{filename}.mp3",
            "title": yt.title,
            "path": f"/downloads/{filename}.mp3"
        })
    except Exception as e:
        print(f"❌ Error en descarga: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        files = []
        for file in DOWNLOAD_FOLDER.glob('*.mp3'):
            files.append({
                "filename": file.name,
                "size": file.stat().st_size,
                "path": f"/downloads/{file.name}"
            })
        return jsonify({"success": True, "files": files, "count": len(files)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/downloads/<path:filename>', methods=['GET'])
def serve_file(filename):
    try:
        response = send_from_directory(DOWNLOAD_FOLDER, filename)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Cache-Control'] = 'public, max-age=3600'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 404

@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    try:
        files_deleted = 0
        for file in DOWNLOAD_FOLDER.glob('*'):
            if file.is_file():
                file.unlink()
                files_deleted += 1
        return jsonify({"success": True, "message": f"Deleted {files_deleted} files"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/lyrics', methods=['GET'])
def get_lyrics():
    try:
        title = request.args.get('title')
        artist = request.args.get('artist', '')
        if not title:
            return jsonify({"success": False, "error": "Parameter 'title' is required"}), 400
        
        song_info = search_genius_song(title, artist)
        if not song_info['success']:
            return jsonify(song_info), 404
        
        lyrics_data = get_lyrics_from_genius(song_info['url'])
        if not lyrics_data['success']:
            return jsonify(lyrics_data), 404
        
        return jsonify({
            'success': True,
            'title': song_info['title'],
            'artist': song_info['artist'],
            'lyrics': lyrics_data['lyrics'],
            'thumbnail': song_info['thumbnail'],
            'source': 'Genius'
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("=" * 60)
    print("🚀 All Night Radio - Backend Server")
    print("=" * 60)
    print(f"📡 Local:   http://localhost:5000")
    print(f"📡 Network: http://{local_ip}:5000")
    print("=" * 60)
    app.run(debug=True, port=5000, host='0.0.0.0')