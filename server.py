#!/usr/bin/env python3
"""
Servidor HTTP simple para desarrollo local
Evita problemas de CORS con módulos ES6
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

if __name__ == "__main__":
    # Cambiar al directorio del script
    os.chdir(Path(__file__).parent)
    
    # Crear servidor
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"🚀 Servidor iniciado en http://localhost:{PORT}")
        print(f"📱 Abriendo aplicación en el navegador...")
        
        # Abrir navegador automáticamente
        webbrowser.open(f'http://localhost:{PORT}')
        
        print("🛑 Presiona Ctrl+C para detener el servidor")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ Servidor detenido correctamente")
