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
        100, 101.1, 102.5, 103.0, 103.2, 103.3, 103.5, 103.8, 104.2, 105.4, 105.8, 106.1,
        106.3, 106.6, 107.0, 107.2, 107.5, 108.8, 109.1, 109.3, 109.5, 109.8, 110.2
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
                   `<span style="color:#ff6b6b; font-weight:bold;">Has perdido el ${Math.abs(loss)}% de tu comida</span><extra></extra>`;
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
        y: promedioNacional.slice(0, meses.length),
        mode: 'lines+markers',
        name: 'IPC General (Referencia)',
        yaxis: 'y2',
        line: { color: 'rgba(148, 163, 184, 0.4)', width: 3, dash: 'dot' },
        marker: { 
            size: 4,
            color: promedioNacional.map((p, i) => {
                if (i === 0) return 'rgba(148, 163, 184, 0.4)';
                const salto = (p - promedioNacional[i-1]) / promedioNacional[i-1];
                return salto > 0.01 ? '#6366f1' : 'rgba(148, 163, 184, 0.4)'; // Azul pizarra para saltos > 1%
            })
        },
        hovertemplate: '<b>%{x}</b><br>Índice IPC: <b>%{y:.1f}</b><br><span style="color:#6366f1">Referencia Nacional</span><extra></extra>'
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
        hovermode: 'closest',
        hoverlabel: {
            bgcolor: '#0f172a', // Fondo azul muy oscuro para que todo resalte
            font: { color: '#f8fafc', family: 'Outfit', size: 13 },
            bordercolor: 'rgba(255,255,255,0.2)'
        }
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
    const playProduct = async (dataArray, label, color, threshold = 0.05) => {
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
        const alert = new Tone.MembraneSynth().toDestination();

        dataArray.forEach((val, index) => {
            // Mapeo de Tono (Pitch) - Único canal para representar valor
            const freq = mapPriceToFrequency(val, minVal, maxVal, 220, 880);
            
            // Sonido de Moneda (Metálico) - Volumen constante para rigor técnico
            const coin = new Tone.MetalSynth({
                envelope: { attack: 0.01, decay: 0.1, release: 0.1 },
                harmonicity: 5.1,
                resonance: 4000
            }).toDestination();

            // Alerta emocional si el alza supera el umbral (threshold)
            let esAlerta = false;
            if (index > 0 && (val - dataArray[index-1])/dataArray[index-1] > threshold) {
                esAlerta = true;
                alert.triggerAttackRelease("C2", "4n", timeOffset);
            }

            coin.triggerAttackRelease(freq, "32n", timeOffset);

            Tone.Draw.schedule(() => {
                statusText.style.color = esAlerta ? color : "#f8fafc";
                statusText.style.fontWeight = esAlerta ? "bold" : "normal";
                statusText.innerText = `Escuchando ${label}: ${meses[index]} | ${label === 'IPC' ? val.toFixed(1) : '$' + val.toFixed(0)}`;
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
    document.getElementById('play-aceite').onclick = () => playProduct(aceitePrecios, "Aceite", "#f43f5e", 0.05);
    document.getElementById('play-pan').onclick = () => playProduct(panPrecios, "Pan", "#fbbf24", 0.05);
    document.getElementById('play-arroz').onclick = () => playProduct(arrozPrecios, "Arroz", "#38bdf8", 0.05);
    document.getElementById('play-ipc').onclick = () => playProduct(promedioNacional.slice(0, meses.length), "IPC", "#6366f1", 0.01);
});
