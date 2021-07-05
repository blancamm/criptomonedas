# Proyecto Final: Aplicacion de inversion en criptomonedas

Crearemos una aplicación web que registre las inversiones a criptomonedas.

---

## Instalacion:
___

1. Creo un entorno virtual:
    ```python
    python -m venv venv
    ```

    o

    ```python
    python3 -m venv venv
    ```

2. Activo el entorno virtual:
    * Si está en windows:
    ```python
    venv\Scripts\activate
    ```
    * Si esta mac:

    ```python
    venv/bin/activate
    ```

3. Instalar lo necesario. Con el fichero requirements:

    ```python
    pip install -r requirements.txt
    ```

4. Crear variables de entorno:

    * Duplicar el fichero .env_template
    * Renombrar este por .env
    * Informar FLASK_ENV con `development`o `production` asi como a FLASK_APP con `run.py`

5. Crear fichero de configuracion:

    * Duplicar fichero config_template.py
    * Renombrar este por config.py
    * Informar SECRET_KEY con la clave de su usario en coinmarket. Para obtenerla: [aqui](https://coinmarketcap.com/api/)
    * Informar de la ruta a la base de datos en DATABASE. Esta debe estar dentro de la carpeta del proyecto fuera de la carpeta criptomonedas.

6. Crear base de datos ejecutando el fichero `migrations/initial.sql`
    * Se puede hacer con un lciente gráfico o con sqlite3
    * Se ejecuta lo siguiente:
    ```python
    sqlite3 <ruta al fichero que se informar en config.py en DATABASE >
    .read <ruta relativa a migrations/initial.sql>
    .tablas
    .q
    ```
---

## Ejecutar en local
___

Escribir

```python
flask run
```

