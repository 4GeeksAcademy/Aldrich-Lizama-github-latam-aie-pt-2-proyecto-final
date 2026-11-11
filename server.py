try:
    # try to import flask, or return error if has not been installed
    from flask import Flask
    from flask import send_from_directory
except ImportError:
    import logging
    logging.getLogger("nexova.server").error(
        "Flask no está instalado. Ejecuta 'pip3 install flask' y prueba de nuevo."
    )
    import sys
    sys.exit(1)

import logging
import os
import subprocess

logger = logging.getLogger("nexova.server")

static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), './')
app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # disable cache

# Serving the index file
@app.route('/', methods=['GET'])
def serve_dir_directory_index():
    if os.path.exists("app.py"):
        try:
            out = subprocess.Popen(
                ['python3', 'app.py'],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
            )
            stdout, _ = out.communicate(timeout=30)
            if out.returncode == 0:
                return stdout
            else:
                logger.warning("app.py falló con código %s", out.returncode)
                return f"<pre style='color: red;'>{stdout.decode('utf-8')}</pre>"
        except subprocess.TimeoutExpired:
            logger.error("app.py excedió el tiempo de espera (30s)")
            return "<pre style='color: red;'>El proceso app.py excedió el tiempo de espera.</pre>"
        except Exception:
            logger.exception("Error al ejecutar app.py")
            return "<pre style='color: red;'>Error interno al ejecutar app.py</pre>"
    if os.path.exists("index.html"):
        return send_from_directory(static_file_dir, 'index.html')
    else:
        return "<h1 align='center'>404</h1><h2 align='center'>Missing index.html file</h2><p align='center'><img src='https://github.com/4GeeksAcademy/html-hello/blob/main/.vscode/rigo-baby.jpeg?raw=true' /></p>"

# Serving any other image
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = os.path.join(path, 'index.html')
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0 # avoid cache memory
    return response

if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host='0.0.0.0', port=3001, debug=debug_mode, extra_files=['./',])
