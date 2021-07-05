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

function BorraFormulario(dato) {
    if(dato=="2"){
        document.getElementById("cantidad_from").value = ""
        document.getElementById("cantidad_to").value = ""
        document.getElementById("conversion_unitaria").value = ""
    }

    if (dato=="1") {
        document.getElementById("nueva_inversion").reset()
    }
    
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
                fila.setAttribute("class", "fila_cursor")
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
    if(this.status === 400) {
        const fallo=JSON.parse(this.responseText)
        alert(fallo.mensaje)
        return
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

            const tablaBodyStatus=document.querySelector(".tabla_status tbody")
            tablaBodyStatus.innerHTML=""


            STATUS = status_total.data
            const fila1 = document.createElement("tr")
            dentroFila1 = `
            <td>Invertido: </td>
            <td>${STATUS.invertido.toFixed(2)}</td>
            <td>€</td>
            `
            fila1.innerHTML = dentroFila1
            tablaBodyStatus.append(fila1)

            const fila2 = document.createElement("tr")
            dentroFila2 = `
            <td>Valor actual: </td>
            <td>${STATUS.valor_actual.toFixed(2)}</td>
            <td>€</td>
            `
            fila2.innerHTML = dentroFila2
            tablaBodyStatus.append(fila2)

            const fila3 = document.createElement("tr")
            fila3.setAttribute("id", "FILA3")
            dentroFila3 = `
            <td id>Resultado: </td>
            <td id="resultado">${STATUS.resultado.toFixed(2)}</td>
            <td>€</td>
            `
            fila3.innerHTML = dentroFila3
            tablaBodyStatus.append(fila3)

            let resultado = document.querySelector("#resultado")
            if (resultado.innerHTML > 0){
                fila3.setAttribute("class", "resultado_positivo")
            } else {
                fila3.setAttribute("class", "resultado_negativo")
            }

            const tablaDetalles = document.querySelector("#Detalle_criptos tbody")
            tablaDetalles.innerHTML=""

            let detalle_criptos = status_total.detalle
            let detalle_criptos_euros = status_total.detalle_criptos_euros
            for (const property in detalle_criptos_euros) {
                const FILA = document.createElement("tr")
                dentroFILA= `
                <td>${property}</td>
                <td>${detalle_criptos[property].toFixed(8)}</td>
                <td>${detalle_criptos_euros[property].toFixed(8)}</td>
         
                `
                FILA.innerHTML = dentroFILA
                tablaDetalles.append(FILA)
            }

            actualizar_status = document.querySelector(".btn_actualizar")
            actualizar_status.innerHTML="Actualizar <i class='fas fa-sync-alt'></i>"

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
    actualizar_status = document.querySelector(".btn_actualizar")
    actualizar_status.innerHTML = "<i class='fas fa-sync-alt fa-spin fa-3x'></i>"
}

function presentacionCalculadora(){
    if (this.readyState=== 4){
        if (this.status===200){
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
        if (this.status === 400) {
            const fallo = JSON.parse(this.responseText)
            alert(fallo.mensaje)
            BorraFormulario(2)
        }
    }
}

function llamadaCalculadora(evento){
    evento.preventDefault()
    cantidad_convertir=document.querySelector("#cantidad_from").value
    if (cantidad_convertir===""){
        alert ("Debe ingresar una cantidad")
    }
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
            BorraFormulario(1)
        }
        if (this.status === 400){
            const fallo = JSON.parse(this.responseText)
            alert(fallo.mensaje)
            if (fallo.mensaje === "Debe rellenar todos los datos del formulario. Para calcular la conversion pulsar boton 'Calcular'"){
                return
            }else{
                BorraFormulario(2)
                return
            }
        }
    }
}

function llamadaNuevaInversion(evento){
    evento.preventDefault()
    inversion = DatosFormulario()
    for (const property in inversion) {
        let valor = inversion[property] 
        if (valor == ""){
            alert("Debe rellenar todos los datos")
            return
        }
    }
    if(cantidad_convertir !== inversion.cantidad_from || moneda_to !== inversion.moneda_to || moneda_from !==inversion.moneda_from){
        alert("No debe cambiar los datos, es hacer trampas")
        BorraFormulario(1)
        cantidad_convertir =""
        return
    }


    

    xhr.open("POST", `http://localhost:5000/api/v1/movimiento`, true)
    xhr.onload = InversionGrabada

    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    xhr.send(JSON.stringify(inversion))
}

function CancelarInversion(evento) {
    evento.preventDefault()
    BorraFormulario(1)
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

    actualizar_status = document.querySelector(".btn_actualizar")
        .addEventListener("click", llamadaStatus)
}