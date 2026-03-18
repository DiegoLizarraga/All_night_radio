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
        # Connect to an external address to determine the outgoing interface
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
        "message": "YouTube to MP3 conversion API",
        "status": "online",
        "endpoints": {
            "/api/info": "GET - Get video information",
            "/api/download": "GET - Download MP3",
            "/api/download-to-server": "POST - Download MP3 to server",
            "/api/files": "GET - List files in downloads",
            "/downloads/<filename>": "GET - Serve downloaded file",
            "/api/lyrics": "GET - Get song lyrics",
            "/api/network-info": "GET - Get server local IP for QR generation"
        }
    })

# ─────────────────────────────────────────────────────────────────────────────
# NEW: Network info endpoint — used by the QR generator to build the correct
# local-network URL so phones on the same Wi-Fi can download the file.
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/api/network-info', methods=['GET'])
def network_info():
    """Returns the local IP of the server so the frontend can build QR codes
    that work for any device on the same Wi-Fi network."""
    local_ip = get_local_ip()
    return jsonify({
        "success": True,
        "local_ip": local_ip,
        "server_url": f"http://{local_ip}:5000",
        "note": "Use this URL to access the server from other devices on the same network"
    })

@app.route('/api/info', methods=['GET'])
def get_video_info():
    """Gets YouTube video information"""
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

@app.route('/api/download-to-server', methods=['POST', 'OPTIONS'])
def download_to_server():
    """Downloads MP3 and saves it to server"""
    # Handle preflight request
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        url = data.get('url') if data else None
        
        if not url:
            return jsonify({"success": False, "error": "Parameter 'url' is required"}), 400
        
        print(f"📥 Iniciando descarga de: {url}")
        
        # Create YouTube object
        yt = YouTube(url)
        
        # Get highest quality audio stream
        audio_stream = yt.streams.filter(only_audio=True).first()
        
        if not audio_stream:
            return jsonify({"success": False, "error": "No audio stream found"}), 400
        
        # Filename
        filename = sanitize_filename(yt.title)
        output_path = DOWNLOAD_FOLDER / f"{filename}.mp3"
        
        print(f"💾 Descargando: {yt.title}")
        
        # Download audio
        downloaded_file = audio_stream.download(
            output_path=DOWNLOAD_FOLDER,
            filename=f"{filename}.mp4"
        )
        
        # Convert to MP3 (requires ffmpeg installed)
        try:
            import subprocess
            mp3_path = str(output_path)
            print("🔄 Convirtiendo a MP3...")
            subprocess.run([
                'ffmpeg', '-i', downloaded_file,
                '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k',
                mp3_path, '-y'
            ], check=True, capture_output=True)
            
            # Delete temporary mp4 file
            os.remove(downloaded_file)
            print("✅ Conversión completada")
            
        except Exception as e:
            # If ffmpeg fails, rename downloaded file to mp3
            print(f"⚠️ ffmpeg not available, using original file: {e}")
            os.rename(downloaded_file, output_path)
        
        print(f"✅ Descarga completada: {filename}.mp3")
        
        # Return file information
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
    """Lists all MP3 files in downloads folder"""
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
            "files": files,
            "count": len(files)
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/downloads/<path:filename>', methods=['GET'])
def serve_file(filename):
    """Serves a file from downloads folder with CORS headers"""
    try:
        response = send_from_directory(DOWNLOAD_FOLDER, filename)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Cache-Control'] = 'public, max-age=3600'
        # Force download on mobile browsers
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 404

@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """Cleans temporary files"""
    try:
        files_deleted = 0
        for file in DOWNLOAD_FOLDER.glob('*'):
            if file.is_file():
                file.unlink()
                files_deleted += 1
        
        return jsonify({
            "success": True,
            "message": f"Deleted {files_deleted} files"
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/lyrics', methods=['GET'])
def get_lyrics():
    """Get song lyrics"""
    try:
        title = request.args.get('title')
        artist = request.args.get('artist', '')
        
        if not title:
            return jsonify({"success": False, "error": "Parameter 'title' is required"}), 400
        
        # Search song on Genius
        song_info = search_genius_song(title, artist)
        
        if not song_info['success']:
            return jsonify(song_info), 404
        
        # Get lyrics
        lyrics_data = get_lyrics_from_genius(song_info['url'])
        
        if not lyrics_data['success']:
            return jsonify(lyrics_data), 404
        
        # Return everything together
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

@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"success": False, "error": "Internal server error"}), 500

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("=" * 60)
    print("🚀 All Night Radio - Backend Server")
    print("=" * 60)
    print(f"📡 Local:   http://localhost:5000")
    print(f"📡 Network: http://{local_ip}:5000")
    print(f"📱 QR codes will use: http://{local_ip}:5000")
    print(f"📁 Downloads folder: {DOWNLOAD_FOLDER.absolute()}")
    print("")
    print("📝 Available endpoints:")
    print("   • GET  /api/info?url=<youtube_url>")
    print("   • POST /api/download-to-server")
    print("   • GET  /api/files")
    print("   • GET  /downloads/<filename>")
    print("   • GET  /api/lyrics?title=<song>&artist=<artist>")
    print("   • GET  /api/network-info  ← NEW: for QR mobile download")
    print("=" * 60)
    app.run(debug=True, port=5000, host='0.0.0.0')