from criptomonedas import app
from flask import render_template, jsonify, Response, request
import sqlite3
from criptomonedas import accesoData
from http import HTTPStatus
import requests
import time

dbManager=accesoData.DBmanager(app.config.get('DATABASE'))

criptomonedas = [
    'EUR', 'BTC','ETH', 'XRP','LTC', 'BCH',
'BNB', 'USDT','EOS', 'BSV','XLM', 'ADA','TRX'
]

def saldo_criptomonedas():
    try:
        query="SELECT * FROM Movimientos_Criptomonedas ORDER BY fecha"
        movimientos = dbManager.accesoTodosMovimientos(query)
        if movimientos == []:
            return {"status": "fail1", "mensaje":"No hay status que calcular, y por tanto, no tienes criptomonedas"}
        diccionario_saldo = {}
        diccionario_detalle_criptos= {}
        for moneda in criptomonedas:
            to_cripto = 0
            from_cripto = 0
            for item in movimientos:
                if item["moneda_from"] == moneda:
                    from_cripto +=  item["cantidad_from"]
                elif item["moneda_to"] == moneda:
                    to_cripto += item["cantidad_to"]
            
            if moneda == 'EUR':
                diccionario_saldo["total_euros_invertidos"] = from_cripto
                euros_atrapados = to_cripto - from_cripto
                diccionario_saldo["saldo_euros_atrapados"] = euros_atrapados

            else:
                saldo = to_cripto - from_cripto
                diccionario_detalle_criptos[moneda]=saldo

        return {"status": "success", "saldo_inversion": diccionario_saldo, "saldo_criptos": diccionario_detalle_criptos}

    except sqlite3.Error as error:
        return {"status": "fail", "mensaje":str(error)}

def validacion_coinMarket(cantidad):
    if cantidad == "":
        return "Debe ingresar una cantidad"
    if cantidad != "":
        if float(cantidad) < 0:
            error = "No se puede hacer una inversion de cantidades negativas"
            return error
        if float(cantidad)> pow(10,8) or float(cantidad) < pow(10, -8):
            return "Los valores de la inversion deben estar etre 10e-8 y 10e8"
    return "success"

def validacion(nueva_inversion, saldo):
    if nueva_inversion["moneda_from"]==nueva_inversion["moneda_to"]:
        error = "No se puede hacer una inversion a la misma moneda"
        return error

    cantidad = nueva_inversion["cantidad_from"]
    respuesta =validacion_coinMarket(cantidad)
    if respuesta != "success":
        return respuesta

    for key in nueva_inversion.keys():
        if nueva_inversion[key]=="":
            return "Debe rellenar todos los datos del formulario. Para calcular la conversion pulsar boton 'Calcular'"
            
    moneda=nueva_inversion["moneda_from"]
    claves = saldo.keys()
    if "saldo_criptos" in claves:
        if moneda !='EUR':
            if float(nueva_inversion["cantidad_from"] )> saldo["saldo_criptos"][moneda]:
                error = "Saldo de criptomoneda insuficiente. Mirar despliegue."
                return error
    elif "mensaje" in claves and moneda != 'EUR':
        return saldo["mensaje"]

    return "success"

@app.route('/')
def pantallaCompleta():
    return render_template('myCripto.html')

@app.route('/api/v1/movimientos')
def listaMovimientos():
    try:
        query="SELECT * FROM Movimientos_Criptomonedas ORDER BY fecha"
        movimientos = dbManager.accesoTodosMovimientos(query)
        
        return jsonify({"status": "success", "data": movimientos}), HTTPStatus.OK

    except sqlite3.Error as error:
        return jsonify({"status": "fail", "mensaje":str(error)}), HTTPStatus.BAD_REQUEST

@app.route('/api/v1/movimiento/<int:id>', methods=['GET'])
@app.route('/api/v1/movimiento', methods=['POST'])
def detalleMovimiento(id=None):
    fecha = time.strftime("%Y/%m/%d")
    hora = time.strftime("%H:%M:%S")
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
            saldo_actual=saldo_criptomonedas()
            datos_nueva_inversion = request.json
            datos_nueva_inversion["fecha"] = str(fecha)
            datos_nueva_inversion["hora"] = str(hora)

            respuesta = validacion(datos_nueva_inversion, saldo_actual)

            if respuesta == "success":
                datos_nueva_inversion["cantidad_from"] = round(float(datos_nueva_inversion["cantidad_from"]), 8)
                datos_nueva_inversion["cantidad_to"] = round(float(datos_nueva_inversion["cantidad_to"]), 8)                

                query="""
                INSERT INTO Movimientos_Criptomonedas 
                (fecha, hora, moneda_from, cantidad_from, moneda_to, cantidad_to)
                VALUES (:fecha, :hora, :moneda_from, :cantidad_from, :moneda_to, :cantidad_to) 
                """
                dbManager.nuevoMovimiento(query, datos_nueva_inversion)

                nueva_query="SELECT * FROM Movimientos_Criptomonedas WHERE ID = (SELECT MAX(ID) FROM Movimientos_Criptomonedas);"
                ultimo_movimiento=dbManager.accesoMovimiento(nueva_query) 
                ultimo_id=ultimo_movimiento[0]["id"]

                return jsonify({"status": "success", "id":ultimo_id, "monedas":[datos_nueva_inversion["moneda_from"], datos_nueva_inversion["moneda_to"]]}), HTTPStatus.CREATED
            else:
                raise NameError(respuesta)


    except (sqlite3.Error, NameError) as error:
        return jsonify({"status": "fail", "mensaje":str(error)}), HTTPStatus.BAD_REQUEST
    
@app.route('/api/v1/calculadora/<moneda_from>/<moneda_to>/<cantidad_convertir>')
@app.route('/api/v1/calculadora/<moneda_from>/<moneda_to>')
def conversion_api_coinmarket(moneda_from, moneda_to, cantidad_convertir=1.0):
    try:
        respuesta = validacion_coinMarket(cantidad_convertir)
        if respuesta == "success":
            url = f"https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount={cantidad_convertir}&symbol={moneda_from}&convert={moneda_to}&CMC_PRO_API_KEY=ac4720b5-e4ec-455f-a0f0-f47c44b7b79c"
            conversion = requests.get(url)
            return Response(conversion), HTTPStatus.OK
        else:
            return jsonify({"status":"fail", "mensaje":respuesta}), HTTPStatus.BAD_REQUEST
    except:
        return jsonify({"status":"fail", "mensaje":"No se ha podido hacer la conversion"}), HTTPStatus.BAD_REQUEST

@app.route('/api/v1/status')
def status():

    saldo_actual = saldo_criptomonedas()

    if saldo_actual["status"] == "success":
        suma_cripto_euros=0
        diccionario_saldo= saldo_actual["saldo_inversion"]
        diccionario_detalle_criptos =saldo_actual["saldo_criptos"]
        diccionario_detalle_criptos_euros = {}

        for moneda in diccionario_detalle_criptos.keys():
            saldo = diccionario_detalle_criptos[moneda]

            if saldo != 0:
                validacion = validacion_coinMarket(saldo)
                if validacion == "Los valores de la inversion deben estar etre 10e-8 y 10e8":
                    saldo = round(saldo, 8)
                elif validacion =="success":
                    saldo = saldo
                else:
                    return jsonify({"status": "fail", "mensaje":validacion}), HTTPStatus.BAD_REQUEST
            
            if saldo !=0:
                url = f"https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount={saldo}&symbol={moneda}&convert=EUR&CMC_PRO_API_KEY=ac4720b5-e4ec-455f-a0f0-f47c44b7b79c"
                conversion = requests.get(url)
                if conversion.status_code == 200:
                    respuesta = conversion.json()
                    if not respuesta.get("data"):
                        return jsonify({"status": "fail", "mensaje":"No se puede calcular el status, revise los movimientos o vuelva a intentarlo más tarde"}), HTTPStatus.NOT_FOUND                 
                    saldo_convertido=respuesta["data"]["quote"]["EUR"]["price"]
                    diccionario_detalle_criptos_euros[moneda] = saldo_convertido
                    suma_cripto_euros += saldo_convertido
                    diccionario_saldo["valor_criptos"] = suma_cripto_euros
                else:
                    return jsonify({"status": "fail", "mensaje":"Se ha producido un error al realizar la conversion"}), HTTPStatus.BAD_REQUEST

        valor_actual = diccionario_saldo["total_euros_invertidos"] + diccionario_saldo["saldo_euros_atrapados"] + diccionario_saldo["valor_criptos"]
        resultado =  valor_actual - diccionario_saldo["total_euros_invertidos"]

        diccionario_status={"invertido":diccionario_saldo["total_euros_invertidos"], "valor_actual":valor_actual, "resultado" : resultado}

        return jsonify({"status": "success", "data": diccionario_status, "detalle": diccionario_detalle_criptos, "detalle_criptos_euros": diccionario_detalle_criptos_euros, "euros atrapados":-1*diccionario_saldo["saldo_euros_atrapados"]}), HTTPStatus.OK

    elif saldo_actual["status"] == "fail1":
        return jsonify({"status": "fail", "mensaje":saldo_actual["mensaje"]}), HTTPStatus.BAD_REQUEST

    elif saldo_actual["status"] == "fail":
        return jsonify({"status": "fail", "mensaje":saldo_actual["mensaje"]}), HTTPStatus.BAD_REQUEST




        



