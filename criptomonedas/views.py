from criptomonedas import app

@app.route('/')
def index():
    return 'SE HA HECHO UN GET'