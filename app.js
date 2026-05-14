// Esperar a que el DOM cargue
document.addEventListener('DOMContentLoaded', () => {
    // Referencia a los datos generados por el script de Python (datos_extraidos.js)
    // Asumimos que la variable global `datosInflacion` ya está definida.

    if (typeof datosInflacion === 'undefined') {
        document.getElementById('status-text').innerText = "Error: No se encontraron los datos del IPC.";
        return;
    }

    // Preparar los datos para Plotly
    const meses = datosInflacion.map(d => d.mes);
    const panPrecios = datosInflacion.map(d => d.pan);
    const aceitePrecios = datosInflacion.map(d => d.aceite);
    const arrozPrecios = datosInflacion.map(d => d.arroz);

    // 1. Definimos un promedio nacional aproximado basado en el IPC base 2023
    // (Estos valores son representativos para mostrar el contraste)
    const promedioNacional = [
        100, 100.6, 101.1, 101.5, 101.8, 101.9, 102.2, 102.5, 102.8, 103.1, 103.3, 103.5,
        103.8, 104.1, 104.4, 104.6, 104.8, 105.0, 105.2, 105.4, 105.6, 105.8, 106.0
    ];

    // 1. EL CALCULADOR DE PODER ADQUISITIVO (Lo que no se ve a simple vista)
    const initialBudget = 5000; // Presupuesto base de $5.000

    const updateHoverTemplate = (dataArray) => {
        const p0 = dataArray[0]; // Precio en el primer mes
        return dataArray.map((pt, i) => {
            const qty0 = (initialBudget / p0).toFixed(1);
            const qtyt = (initialBudget / pt).toFixed(1);
            const loss = (((qtyt - qty0) / qty0) * 100).toFixed(0);
            
            return `<b>${meses[i]}</b><br>` +
                   `Precio: $${pt}<br>` +
                   `Con $5.000 comprabas: ${qty0}L/kg<br>` +
                   `Hoy compras: ${qtyt}L/kg<br>` +
                   `<span style="color:red">Has perdido el ${Math.abs(loss)}% de tu comida</span><extra></extra>`;
        });
    };

    // Trazos (Traces) para el gráfico interactivo
    const tracePan = {
        x: meses,
        y: panPrecios,
        mode: 'lines+markers',
        name: 'Pan',
        line: { color: '#fbbf24', width: 3, shape: 'spline' },
        marker: { size: 8 },
        hovertemplate: updateHoverTemplate(panPrecios)
    };

    const traceAceite = {
        x: meses,
        y: aceitePrecios,
        mode: 'lines+markers',
        name: 'Aceite Vegetal',
        line: { color: '#f43f5e', width: 3, shape: 'spline' },
        marker: { 
            size: 8,
            color: aceitePrecios.map((p, i) => {
                if (i === 0) return '#f43f5e';
                const salto = (p - aceitePrecios[i-1]) / aceitePrecios[i-1];
                return salto > 0.05 ? '#ff0000' : '#f43f5e';
            }),
            symbol: aceitePrecios.map((p, i) => {
                if (i === 0) return 'circle';
                const salto = (p - aceitePrecios[i-1]) / aceitePrecios[i-1];
                return salto > 0.05 ? 'diamond' : 'circle';
            })
        },
        hovertemplate: updateHoverTemplate(aceitePrecios)
    };

    const traceArroz = {
        x: meses,
        y: arrozPrecios,
        mode: 'lines+markers',
        name: 'Arroz',
        line: { color: '#38bdf8', width: 3, shape: 'spline' },
        marker: { size: 8 },
        hovertemplate: updateHoverTemplate(arrozPrecios)
    };

    // 2. Creamos el trazo para el Promedio Nacional (Referencia)
    const tracePromedio = {
        x: meses,
        y: promedioNacional.slice(0, meses.length), // Ajustamos al largo de tus datos
        mode: 'lines',
        name: 'IPC General (Referencia)',
        yaxis: 'y2', // CRÍTICO: Usamos un eje secundario para que sea visible como referencia
        line: { color: 'rgba(148, 163, 184, 0.4)', width: 4, dash: 'dot' }, // Gris claro, punteado y más grueso
        hoverinfo: 'skip'
    };

    const data = [tracePan, traceAceite, traceArroz, tracePromedio];

    // Layout de Plotly adaptado al diseño Dark Glassmorphism
    const layout = {
        title: {
            text: '<b>Evolución de Precios: El impacto real en la Canasta</b>',
            font: { color: '#f8fafc', size: 22 },
            y: 0.95 // Bajamos un poco el título dentro del margen superior
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Outfit', color: '#f8fafc' },
        showlegend: true,
        legend: { 
            font: { color: '#94a3b8', size: 10 }, 
            orientation: 'h', 
            y: -0.2, // Movemos la leyenda al fondo para evitar colisión con el título
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: {
            title: 'Meses (2024 - 2025)',
            gridcolor: 'rgba(255,255,255,0.1)',
            tickfont: { color: '#94a3b8', size: 10 },
            tickangle: -45, // Rotamos los meses para que no se encimen
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            title: 'Precio Promedio ($)',
            gridcolor: 'rgba(255,255,255,0.1)',
            tickfont: { color: '#f8fafc' },
            zeroline: false,
            rangemode: 'tozero'
        },
        yaxis2: {
            title: 'Índice IPC (Referencia)',
            overlaying: 'y',
            side: 'right',
            showgrid: false,
            zeroline: false,
            tickfont: { color: 'rgba(148, 163, 184, 0.6)' },
            range: [100, 110] // Ajustamos el rango del índice para que la pendiente sea comparable
        },
        margin: { l: 60, r: 60, t: 100, b: 100 },
        hovermode: 'closest'
    };

    const config = { responsive: true, displayModeBar: false };

    // Renderizar Gráfico
    Plotly.newPlot('plotly-chart', data, layout, config);

    // ==========================================
    // TONE.JS SONIFICACIÓN (Auditory Icons)
    // ==========================================
    
    let isPlaying = false;
    const statusText = document.getElementById('status-text');

    // Función para mapear un valor numérico a una frecuencia (Hz)
    const mapPriceToFrequency = (price, minPrice, maxPrice, minFreq, maxFreq) => {
        return ((price - minPrice) / (maxPrice - minPrice)) * (maxFreq - minFreq) + minFreq;
    };

    // 2. FUNCIÓN DE SONIFICACIÓN REUTILIZABLE
    const playProduct = async (dataArray, label, color) => {
        if (isPlaying) return;
        await Tone.start();
        isPlaying = true;
        
        // Deshabilitar todos los botones durante la reproducción
        document.querySelectorAll('.play-btn').forEach(b => b.disabled = true);

        const minVal = Math.min(...dataArray);
        const maxVal = Math.max(...dataArray);
        let timeOffset = Tone.now();

        // Creamos los sintetizadores UNA VEZ fuera del loop para mejor rendimiento
        const coin = new Tone.MetalSynth({
            envelope: { attack: 0.01, decay: 0.1, release: 0.1 },
            harmonicity: 5.1,
            resonance: 4000
        }).toDestination();

        const alert = new Tone.MembraneSynth().toDestination();

        dataArray.forEach((val, index) => {
            // Mapeo de Tono (Pitch)
            const freq = mapPriceToFrequency(val, minVal, maxVal, 220, 880);
            
            // Alerta emocional si hay alza brusca (>5%)
            let esAlerta = false;
            if (index > 0 && (val - dataArray[index-1])/dataArray[index-1] > 0.05) {
                esAlerta = true;
                alert.triggerAttackRelease("C2", "4n", timeOffset);
            }

            coin.triggerAttackRelease(freq, "32n", timeOffset);

            Tone.Draw.schedule(() => {
                statusText.style.color = esAlerta ? color : "#f8fafc";
                statusText.style.fontWeight = esAlerta ? "bold" : "normal";
                statusText.innerText = `Escuchando ${label}: ${meses[index]} | $${val.toFixed(0)}`;
            }, timeOffset);

            timeOffset += 0.4;
        });

        setTimeout(() => { 
            isPlaying = false; 
            document.querySelectorAll('.play-btn').forEach(b => b.disabled = false);
            statusText.innerText = "Sonificación completada. Compara los productos para notar la brecha.";
        }, dataArray.length * 400);
    };

    // Listeners de los botones
    document.getElementById('play-aceite').onclick = () => playProduct(aceitePrecios, "Aceite", "#f43f5e");
    document.getElementById('play-pan').onclick = () => playProduct(panPrecios, "Pan", "#fbbf24");
    document.getElementById('play-arroz').onclick = () => playProduct(arrozPrecios, "Arroz", "#38bdf8");
    document.getElementById('play-ipc').onclick = () => playProduct(promedioNacional.slice(0, meses.length), "IPC", "#94a3b8");
});
