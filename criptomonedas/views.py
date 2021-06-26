from criptomonedas import app
from flask import render_template, jsonify, Response, request
import sqlite3
from criptomonedas import accesoData
from http import HTTPStatus
import requests

dbManager=accesoData.DBmanager(app.config.get('DATABASE'))

criptomonedas = [
    'EUR', 'BTC','ETH', 'XRP','LTC', 'BCH',
'BNB', 'USDT','EOS', 'BSV','XLM', 'ADA','TRX'
]


@app.route('/')
def pantallaCompleta():
    return render_template('myCripto.html')

@app.route('/api/v1/movimientos')
def listaMovimientos():
    try:
        query="SELECT * FROM Movimientos_Criptomonedas ORDER BY fecha"
        movimientos = dbManager.accesoTodosMovimientos(query)
        
        return jsonify({"status": "success", "data": movimientos})

    except sqlite3.Error as error:
        return jsonify({"status": "fail", "mensaje":str(error)})

@app.route('/api/v1/movimiento/<int:id>', methods=['GET'])
@app.route('/api/v1/movimiento', methods=['POST'])
def detalleMovimiento(id=None):
    try:
        if request.method== 'GET':
            query="SELECT * FROM Movimientos_Criptomonedas WHERE id = ?"
            movimiento = dbManager.accesoMovimiento(query, [id])
            if len(movimiento)>0:
                movimiento=movimiento[0]
            
            if len(movimiento)==0:
                raise NameError('Movimiento no encontrado')
            return jsonify({"status": "success", "data": movimiento})

        if request.method=='POST':
            query="""
            INSERT INTO Movimientos_Criptomonedas 
            (fecha, hora, moneda_from, cantidad_from, moneda_to, cantidad_to)
            VALUES (:fecha, :hora, :moneda_from, :cantidad_from, :moneda_to, :cantidad_to) 
            """
            dbManager.nuevoMovimiento(query, request.json)

            nueva_query="SELECT * FROM Movimientos_Criptomonedas WHERE ID = (SELECT MAX(ID) FROM Movimientos_Criptomonedas);"
            ultimo_movimiento=dbManager.accesoMovimiento(nueva_query) 
            ultimo_id=ultimo_movimiento[0]["id"]

            return jsonify({"status": "success", "id":ultimo_id, "monedas":[request.json["moneda_from"], request.json["moneda_to"]]}), HTTPStatus.CREATED


    except (sqlite3.Error, NameError) as error:
        return jsonify({"status": "fail", "mensaje":str(error)}), HTTPStatus.BAD_REQUEST
    
@app.route('/api/v1/calculadora/<moneda_from>/<moneda_to>/<cantidad_convertir>')
@app.route('/api/v1/calculadora/<moneda_from>/<moneda_to>')
def conversion_api_coinmarket(moneda_from, moneda_to, cantidad_convertir=1.0):#hacer el try y except para errores
    url = f"https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount={cantidad_convertir}&symbol={moneda_from}&convert={moneda_to}&CMC_PRO_API_KEY=ac4720b5-e4ec-455f-a0f0-f47c44b7b79c"
    conversion = requests.get(url)
    return Response(conversion)

@app.route('/api/v1/status')
def status():
    try:
        query="SELECT * FROM Movimientos_Criptomonedas ORDER BY fecha"
        movimientos = dbManager.accesoTodosMovimientos(query)

        diccionario_saldo = {}
        suma_cripto_euros=0
        for moneda in criptomonedas:
            to_cripto = 0
            from_cripto = 0
            for item in movimientos:
                if item["moneda_from"] == moneda:
                    from_cripto +=  item["cantidad_from"]
                elif item["moneda_to"] == moneda:
                    to_cripto += item["cantidad_to"]
            
            if moneda == 'EUR':
                invertido = from_cripto - to_cripto
                diccionario_saldo['invertido en euros']=invertido

            else:
                saldo = to_cripto - from_cripto
                
                if saldo != 0:
                    url = f"https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount={saldo}&symbol={moneda}&convert=EUR&CMC_PRO_API_KEY=ac4720b5-e4ec-455f-a0f0-f47c44b7b79c"
                    conversion = requests.get(url)
                    respuesta = conversion.json()                 
                    saldo_convertido=respuesta["data"]["quote"]["EUR"]["price"]
                    #return str(saldo_convertido)
                    diccionario_saldo[moneda]=saldo_convertido
                    suma_cripto_euros += saldo_convertido

        
        diccionario_status={"invertido":diccionario_saldo["invertido en euros"], "valor_actual":suma_cripto_euros}

        return jsonify({"status": "success", "data": diccionario_status, "detalle": diccionario_saldo}), HTTPStatus.OK

    except sqlite3.Error as error:
        return jsonify({"status": "fail", "mensaje":str(error)}), HTTPStatus.BAD_REQUEST
        



        



