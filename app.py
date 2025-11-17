from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from pytubefix import YouTube
import os
from pathlib import Path
import re
import json
import requests
from bs4 import BeautifulSoup
import re
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
GENIUS_API_TOKEN = 'AS0-MqTotWnOpqHquZjSL3keqUOCE4oHnocf731rpEIN53em4suTdFwdptnmgtVe'  # Replace with your token
GENIUS_API_URL = 'https://api.genius.com'

def search_genius_song(title, artist=''):
    """Search song on Genius"""
    headers = {'Authorization': f'Bearer {GENIUS_API_TOKEN}'}
    search_query = f"{title} {artist}".strip()
    
    try:
        search_url = f"{GENIUS_API_URL}/search"
        params = {'q': search_query}
        response = requests.get(search_url, headers=headers, params=params)
        data = response.json()
        
        if data['response']['hits']:
            # Return first result
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
        response = requests.get(song_url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Genius uses different structures, try several selectors
        lyrics_div = soup.find('div', {'data-lyrics-container': 'true'})
        
        if lyrics_div:
            # Extract all text from lyrics divs
            lyrics_containers = soup.find_all('div', {'data-lyrics-container': 'true'})
            lyrics = []
            
            for container in lyrics_containers:
                # Get text and preserve line breaks
                for br in container.find_all('br'):
                    br.replace_with('\n')
                lyrics.append(container.get_text())
            
            full_lyrics = '\n'.join(lyrics).strip()
            
            # Clean lyrics
            full_lyrics = re.sub(r'\[.*?\]', '', full_lyrics)  # Remove [Verse 1], etc.
            full_lyrics = re.sub(r'\n{3,}', '\n\n', full_lyrics)  # Maximum 2 line breaks
            
            return {'success': True, 'lyrics': full_lyrics}
        else:
            return {'success': False, 'error': 'Could not extract lyrics'}
    
    except Exception as e:
        return {'success': False, 'error': str(e)}

def search_youtube_video(title, artist=''):
    """Search for a music video on YouTube"""
    try:
        # Create search query with filters for official music videos
        search_query = f"{title} {artist} official music video".strip()
        encoded_query = urllib.parse.quote(search_query)
        
        # Use YouTube Data API v3 search endpoint
        # Note: In production, you should use an API key
        # For this example, we'll use a simple approach with ytsearch
        search_url = f"https://yt.lemnoslife.com/videos?part=snippet&q={encoded_query}"
        
        response = requests.get(search_url)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            # Get the first result
            video = data['items'][0]
            video_id = video['id']['videoId']
            snippet = video['snippet']
            
            return {
                'success': True,
                'videoId': video_id,
                'title': snippet['title'],
                'description': snippet['description'],
                'thumbnail': snippet['thumbnails']['high']['url'],
                'channel': snippet['channelTitle'],
                'url': f"https://www.youtube.com/watch?v={video_id}"
            }
        else:
            return {'success': False, 'error': 'Video not found'}
    
    except Exception as e:
        return {'success': False, 'error': str(e)}

# Folder for temporary files
DOWNLOAD_FOLDER = Path("downloads")
DOWNLOAD_FOLDER.mkdir(exist_ok=True)

def sanitize_filename(filename):
    """Cleans filename of invalid characters"""
    return re.sub(r'[<>:"/\\|?*]', '', filename)

@app.route('/')
def home():
    return jsonify({
        "message": "YouTube to MP3 conversion API",
        "endpoints": {
            "/api/info": "GET - Get video information",
            "/api/download": "GET - Download MP3",
            "/api/files": "GET - List files in downloads",
            "/downloads/<filename>": "GET - Serve downloaded file",
            "/api/search-youtube": "GET - Search YouTube video by song name",
            "/api/lyrics": "GET - Get song lyrics"
        }
    })

@app.route('/api/info', methods=['GET'])
def get_video_info():
    """Gets YouTube video information"""
    try:
        url = request.args.get('url')
        
        if not url:
            return jsonify({"error": "Parameter 'url' is required"}), 400
        
        # Create YouTube object
        yt = YouTube(url)
        
        # Get video information
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
    """Downloads video and converts to MP3"""
    try:
        url = request.args.get('url')
        
        if not url:
            return jsonify({"error": "Parameter 'url' is required"}), 400
        
        # Create YouTube object
        yt = YouTube(url)
        
        # Get highest quality audio stream
        audio_stream = yt.streams.filter(only_audio=True).first()
        
        if not audio_stream:
            return jsonify({"error": "No audio stream found"}), 400
        
        # Filename
        filename = sanitize_filename(yt.title)
        output_path = DOWNLOAD_FOLDER / f"{filename}.mp3"
        
        # Download audio
        print(f"Downloading: {yt.title}")
        downloaded_file = audio_stream.download(
            output_path=DOWNLOAD_FOLDER,
            filename=f"{filename}.mp4"
        )
        
        # Convert to MP3 (requires ffmpeg installed)
        try:
            import subprocess
            mp3_path = str(output_path)
            subprocess.run([
                'ffmpeg', '-i', downloaded_file,
                '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k',
                mp3_path, '-y'
            ], check=True, capture_output=True)
            
            # Delete temporary mp4 file
            os.remove(downloaded_file)
            
        except Exception as e:
            # If ffmpeg fails, rename downloaded file to mp3
            print(f"ffmpeg not available, using original file: {e}")
            os.rename(downloaded_file, output_path)
        
        # Send file
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
    """Downloads MP3 and saves it to server"""
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({"error": "Parameter 'url' is required"}), 400
        
        # Create YouTube object
        yt = YouTube(url)
        
        # Get highest quality audio stream
        audio_stream = yt.streams.filter(only_audio=True).first()
        
        if not audio_stream:
            return jsonify({"error": "No audio stream found"}), 400
        
        # Filename
        filename = sanitize_filename(yt.title)
        output_path = DOWNLOAD_FOLDER / f"{filename}.mp3"
        
        # Download audio
        print(f"Downloading: {yt.title}")
        downloaded_file = audio_stream.download(
            output_path=DOWNLOAD_FOLDER,
            filename=f"{filename}.mp4"
        )
        
        # Convert to MP3 (requires ffmpeg installed)
        try:
            import subprocess
            mp3_path = str(output_path)
            subprocess.run([
                'ffmpeg', '-i', downloaded_file,
                '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k',
                mp3_path, '-y'
            ], check=True, capture_output=True)
            
            # Delete temporary mp4 file
            os.remove(downloaded_file)
            
        except Exception as e:
            # If ffmpeg fails, rename downloaded file to mp3
            print(f"ffmpeg not available, using original file: {e}")
            os.rename(downloaded_file, output_path)
        
        # Return file information
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
            "files": files
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
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 404

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

# Add this endpoint after the others
@app.route('/api/lyrics', methods=['GET'])
def get_lyrics():
    """Get song lyrics"""
    try:
        title = request.args.get('title')
        artist = request.args.get('artist', '')
        
        if not title:
            return jsonify({"error": "Parameter 'title' is required"}), 400
        
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

# Alternative endpoint for search only
@app.route('/api/search-song', methods=['GET'])
def search_song():
    """Search song information"""
    try:
        title = request.args.get('title')
        artist = request.args.get('artist', '')
        
        if not title:
            return jsonify({"error": "Parameter 'title' is required"}), 400
        
        song_info = search_genius_song(title, artist)
        return jsonify(song_info)
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# New endpoint to search YouTube videos by song name
@app.route('/api/search-youtube', methods=['GET'])
def search_youtube():
    """Search for YouTube video by song name"""
    try:
        title = request.args.get('title')
        artist = request.args.get('artist', '')
        
        if not title:
            return jsonify({"error": "Parameter 'title' is required"}), 400
        
        # Search for video
        video_info = search_youtube_video(title, artist)
        
        if not video_info['success']:
            return jsonify(video_info), 404
        
        # Return video information
        return jsonify(video_info)
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    print("🚀 Server started at http://localhost:5000")
    print("📝 Available endpoints:")
    print("   - GET /api/info?url=<youtube_url>")
    print("   - GET /api/download?url=<youtube_url>")
    print("   - POST /api/download-to-server (JSON: {url: <youtube_url>})")
    print("   - GET /api/files")
    print("   - GET /downloads/<filename>")
    print("   - POST /api/cleanup")
    print("   - GET /api/lyrics?title=<song_title>&artist=<artist_name>")
    print("   - GET /api/search-song?title=<song_title>&artist=<artist_name>")
    print("   - GET /api/search-youtube?title=<song_title>&artist=<artist_name>")
    app.run(debug=True, port=5000)