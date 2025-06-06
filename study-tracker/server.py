#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('X-Frame-Options', 'ALLOWALL')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def run_server(port=12000):
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("0.0.0.0", port), CORSHTTPRequestHandler) as httpd:
        print(f"🚀 学霸养成记服务器启动成功！")
        print(f"📱 本地访问: http://localhost:{port}")
        print(f"🌐 外部访问: http://0.0.0.0:{port}")
        print(f"📁 服务目录: {os.getcwd()}")
        print("按 Ctrl+C 停止服务器")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 服务器已停止")
            httpd.shutdown()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 12000
    run_server(port)