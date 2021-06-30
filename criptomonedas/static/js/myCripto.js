criptomonedas = {
    EUR: "Euro(EUR)", BTC:'Bitcoin(BTC)', ETH:'Ethereum(ETH)', XRP:'Ripple(XRP)',LTC:'Litecoin(LTC)', BCH:'Bitcoin Cash(BCH)',
    BNB:'Binance Coin(BNB)', USDT:'Tether(USDT)',EOS:'Eos(EOS)', BSV:'Bitcoin SV(BSV)',XLM:'Stellar(XLM)', ADA:'Cardano(ADA)',TRX:'Tron(TRX)'
    }

xhr = new XMLHttpRequest
xhr2 = new XMLHttpRequest

let movimientos
let moneda_to
let moneda_from
let cantidad_convertir

function DatosFormulario() {
    const datosFormulario = {}
    datosFormulario.cantidad_from=document.querySelector("#cantidad_from").value
    datosFormulario.moneda_from=document.querySelector("#moneda_from").value
    datosFormulario.moneda_to=document.querySelector("#moneda_to").value
    datosFormulario.cantidad_to=document.querySelector('#cantidad_to').value

    return datosFormulario
}

function BorraFormulario() {
    document.getElementById("nueva_inversion_monedas").reset()
    document.getElementById("nueva_inversion_restos_datos").reset()
    
}

function presentacionMovimientos(){
    if(this.readyState === 4 && this.status === 200) {
        const inversiones=JSON.parse(this.responseText)

        if(inversiones.status == 'success'){

            const tablaBody=document.querySelector(".tabla_movimientos tbody")
            tablaBody.innerHTML=""

            movimientos=inversiones.data
            for(let i=0; i<movimientos.length; i++){
                const fila= document.createElement('tr')
                const dentroFila=`
                    <td>${movimientos[i].fecha}</td>
                    <td>${movimientos[i].hora}</td>
                    <td>${movimientos[i].moneda_from}</td>
                    <td>${movimientos[i].cantidad_from}</td>
                    <td>${movimientos[i].moneda_to}</td>
                    <td>${movimientos[i].cantidad_to}</td>
                `
                fila.innerHTML=dentroFila
                tablaBody.appendChild(fila)
            }
    
        } else {
            alert("Se ha producido un error al intentar conseguir las inversiones")
            return
        }

    
    }
}

function llamadaMovimientos() {
    xhr.open("GET", `http://localhost:5000/api/v1/movimientos`, true)
    xhr.onload = presentacionMovimientos
    xhr.send() 
}

function presentacionStatus(){
    if(this.readyState === 4) {
        if(this.status === 200){
            const status_total = JSON.parse(this.responseText)
    
            document.querySelector('#inversion_euros').value = status_total.data.invertido.toFixed(2)
            document.querySelector('#valor_actual').value = status_total.data.valor_actual.toFixed(2)
    
            resultado = parseFloat(status_total.data.valor_actual) - parseFloat(status_total.data.invertido)
    
            document.querySelector('#ganancia_perdida').value = resultado.toFixed(2) 
        }
        if (this.status === 400 || this.status === 404){
            const fallo = JSON.parse(this.responseText)
            alert (fallo.mensaje)
        }
    }
}

function llamadaStatus(){
    xhr2.open('GET', `http://localhost:5000/api/v1/status`, true)
    xhr2.onload=presentacionStatus
    xhr2.send()
}

function presentacionCalculadora(){
    if (this.readyState=== 4){
        if (this.status===200){
            const conversion=JSON.parse(this.responseText)
            if (conversion.status.error_code===0){
                let dato=conversion.data.quote[moneda_to].price
                document.querySelector("#cantidad_to").value=dato.toFixed(8)
    
                let precio_unitario=dato/cantidad_convertir
                document.querySelector("#conversion_unitaria").value=precio_unitario.toFixed(8)
                }
            else {
                alert("No se ha podido realizar el calculo de la conversión")
                }
        }
        if (this.status === 400) {
            const fallo = JSON.parse(this.responseText)
            alert(fallo.mensaje)
            document.getElementById("nueva_inversion_restos_datos").reset()
        }
    }
}

function llamadaCalculadora(evento){
    evento.preventDefault()
    cantidad_convertir=document.querySelector("#cantidad_from").value
    moneda_from=document.querySelector("#moneda_from").value
    moneda_to=document.querySelector("#moneda_to").value

    xhr.open('GET', `http://localhost:5000/api/v1/calculadora/${moneda_from}/${moneda_to}/${cantidad_convertir}`, true)
    xhr.onload = presentacionCalculadora
    xhr.send()
}

function InversionGrabada(){
    if (this.readyState=== 4){
        if (this.status===201){
            const nueva_inversion= JSON.parse(this.responseText)
            llamadaMovimientos()
            llamadaStatus()
            alert("La inversion ha sido creada. (id:" + nueva_inversion.id + ')' +"\nCriptomonedas involucradas: "+ nueva_inversion.monedas)
            BorraFormulario()
        }
        if (this.status === 400){
            const fallo = JSON.parse(this.responseText)
            alert(fallo.mensaje)
            if (fallo.mensaje === "Debe rellenar todos los datos del formulario. Para calcular la conversion pulsar boton 'Calcular'"){
                return
            }else{
                document.getElementById("nueva_inversion_restos_datos").reset()
                return
            }
        }
    }
}

function llamadaNuevaInversion(evento){
    evento.preventDefault()
    inversion = DatosFormulario()

    xhr.open("POST", `http://localhost:5000/api/v1/movimiento`, true)
    xhr.onload = InversionGrabada

    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    xhr.send(JSON.stringify(inversion))
}

function CancelarInversion(evento) {
    evento.preventDefault()
    BorraFormulario()
}

window.onload = function(){ 
    llamadaMovimientos()
    llamadaStatus()

    calculadora=document.querySelector("#calculadora")
        .addEventListener("click", llamadaCalculadora)

    Guardar_Inversion=document.querySelector('#boton_registro')
        .addEventListener("click", llamadaNuevaInversion)

    cancelar_inversion = document.querySelector("#boton_cancelar")
        .addEventListener("click", CancelarInversion)
}