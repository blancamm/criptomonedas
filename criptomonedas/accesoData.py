import sqlite3

class DBmanager():
    def __init__(self, ruta_baseDatos):
        self.path = ruta_baseDatos

    def mostrarDiccionarioResultados(self,cur):  
        claves = cur.description 
        registros = cur.fetchall() 

        resultado= []
        for fila in registros: 
            d = {}
            for clave, valor in zip(claves,fila):
                d[clave[0]]=valor
            resultado.append(d)

        return resultado

    def accesoTodosMovimientos(self, query, parametros=[]):

        conexion = sqlite3.connect(self.path)
        cur=conexion.cursor()   

        cur.execute(query, parametros)
        resultado = self.mostrarDiccionarioResultados(cur)
        conexion.close()
        return resultado

    def accesoMovimiento(self, query, identificador=[]):
        resultado = self.accesoTodosMovimientos(query, identificador)
        return resultado

    def nuevoMovimiento(self, query, parametros =[]):
        conexion = sqlite3.connect(self.path)
        cur=conexion.cursor() 

        cur.execute(query, parametros)


        conexion.commit()
        conexion.close()



        


    
        