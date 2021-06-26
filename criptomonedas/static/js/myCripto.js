criptomonedas = {
    EUR: "Euro(EUR)", BTC:'Bitcoin(BTC)', ETH:'Ethereum(ETH)', XRP:'Ripple(XRP)',LTC:'Litecoin(LTC)', BCH:'Bitcoin Cash(BCH)',
    BNB:'Binance Coin(BNB)', USDT:'Tether(USDT)',EOS:'Eos(EOS)', BSV:'Bitcoin SV(BSV)',XLM:'Stellar(XLM)', ADA:'Cardano(ADA)',TRX:'Tron(TRX)'
    }

xhr = new XMLHttpRequest

let movimientos
let moneda_to
let moneda_from
let cantidad_convertir

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

function presentacionStatus(){}

function llamadaStatus(){
    xhr.open('GET', `http://localhost:5000/api/v1/status`, true)
    xhr.onload=presentacionStatus
    xhr.send()
}

function presentacionCalculadora(){
    if (this.readyState=== 4 && this.status===200){
        const conversion=JSON.parse(this.responseText)

        if (conversion.status.error_code===0){
            let dato=conversion.data.quote[moneda_to].price
            document.querySelector("#cantidad_to").value=dato

            let precio_unitario=dato/cantidad_convertir
            document.querySelector("#conversion_unitaria").value=precio_unitario
        }
        else {
            alert("No se ha podido realizar el calculo de la conversión")
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
    if (this.readyState=== 4 && this.status===201){
        const nueva_inversion= JSON.parse(this.responseText)
    
        llamadaMovimientos()

        alert("La inversion ha sido creada.\nCriptomonedas involucradas: "+ nueva_inversion.monedas)
    }

    
}

function llamadaNuevaInversion(evento){ //se podria coge rlos datos del formulario en una funcion
    evento.preventDefault()

    const inversion={}

    inversion.cantidad_from=document.querySelector("#cantidad_from").value
    inversion.moneda_from=document.querySelector("#moneda_from").value
    inversion.moneda_to=document.querySelector("#moneda_to").value
    inversion.cantidad_to=document.querySelector('#cantidad_to').value

    let fecha_y_hora=new Date()
    inversion.fecha= fecha_y_hora.getFullYear()+ '/' + (fecha_y_hora.getMonth()+1) + '/' + fecha_y_hora.getDate()
    inversion.hora= fecha_y_hora.getHours() + ':' + fecha_y_hora.getMinutes() +':' + fecha_y_hora.getSeconds()

    xhr.open("POST", `http://localhost:5000/api/v1/movimiento`, true)
    xhr.onload = InversionGrabada

    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    xhr.send(JSON.stringify(inversion))


}



window.onload =function(){ 
    llamadaMovimientos()
    //llamadaStatus()

    calculadora=document.querySelector("#calculadora")
        .addEventListener("click", llamadaCalculadora)

    Guardar_Inversion=document.querySelector('#boton_registro')
        .addEventListener("click", llamadaNuevaInversion)
}