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

    // Trazos (Traces) para el gráfico interactivo
    const tracePan = {
        x: meses,
        y: panPrecios,
        mode: 'lines+markers',
        name: 'Pan',
        line: { color: '#fbbf24', width: 3, shape: 'spline' },
        marker: { size: 8 },
        hovertemplate: '<b>%{x}</b><br>' +
                       'Precio: $%{y}<br>' +
                       'Con $5.000 compras: <b>%{customdata[0]:.2f} kg</b><br>' +
                       '<span style="color:#f43f5e">Has perdido: %{customdata[1]:.2f} kg</span> desde el inicio<extra></extra>',
        customdata: panPrecios.map(p => [5000 / p, (5000 / panPrecios[0]) - (5000 / p)])
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
                return salto > 0.05 ? '#ff0000' : '#f43f5e'; // Rojo intenso para saltos bruscos
            }),
            symbol: aceitePrecios.map((p, i) => {
                if (i === 0) return 'circle';
                const salto = (p - aceitePrecios[i-1]) / aceitePrecios[i-1];
                return salto > 0.05 ? 'diamond' : 'circle'; // Diamante para alertas
            })
        },
        hovertemplate: '<b>%{x}</b><br>' +
                       'Precio: $%{y}<br>' +
                       'Con $5.000 compras: <b>%{customdata[0]:.2f} litros</b><br>' +
                       '<span style="color:#ff0000">Has perdido: %{customdata[1]:.2f} litros</span> desde el inicio<extra></extra>',
        customdata: aceitePrecios.map(p => [5000 / p, (5000 / aceitePrecios[0]) - (5000 / p)])
    };

    const traceArroz = {
        x: meses,
        y: arrozPrecios,
        mode: 'lines+markers',
        name: 'Arroz',
        line: { color: '#38bdf8', width: 3, shape: 'spline' },
        marker: { size: 8 },
        hovertemplate: '<b>%{x}</b><br>' +
                       'Precio: $%{y}<br>' +
                       'Con $5.000 compras: <b>%{customdata[0]:.2f} kg</b><br>' +
                       '<span style="color:#f43f5e">Has perdido: %{customdata[1]:.2f} kg</span> desde el inicio<extra></extra>',
        customdata: arrozPrecios.map(p => [5000 / p, (5000 / arrozPrecios[0]) - (5000 / p)])
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
    const playBtn = document.getElementById('play-sonification');
    const playIpcBtn = document.getElementById('play-ipc-sonification');
    const statusText = document.getElementById('status-text');

    // Sintetizador Metálico para el "Clink" de moneda
    const coinSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).toDestination();

    // Sintetizador de Alerta (Cha-ching!)
    const alertSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: "sine" }
    }).toDestination();

    const mapPriceToFrequency = (price, minPrice, maxPrice, minFreq, maxFreq) => {
        return ((price - minPrice) / (maxPrice - minPrice)) * (maxFreq - minFreq) + minFreq;
    };

    const playSequence = async (dataArray, label, isIpc = false) => {
        if (isPlaying) return;
        await Tone.start();
        isPlaying = true;
        playBtn.disabled = true;
        playIpcBtn.disabled = true;
        statusText.innerText = `Escuchando evolución: ${label}...`;

        const minVal = Math.min(...dataArray);
        const maxVal = Math.max(...dataArray);
        let timeOffset = Tone.now();
        const durationPerNote = 0.4;

        dataArray.forEach((val, index) => {
            const freq = mapPriceToFrequency(val, minVal, maxVal, 220, 1200);
            
            let salto = 0;
            if (index > 0) {
                salto = (val - dataArray[index - 1]) / dataArray[index - 1];
            }
            const esAlerta = !isIpc && salto > 0.05;

            // Sonido de moneda (con pitch mapeado)
            coinSynth.triggerAttackRelease(freq, "32n", timeOffset);

            if (esAlerta) {
                // Sonido de alerta (Cha-ching!)
                alertSynth.triggerAttackRelease("C6", "16n", timeOffset + 0.05);
            }
            
            Tone.Draw.schedule(() => {
                statusText.style.color = esAlerta ? "#f43f5e" : "#f8fafc";
                statusText.style.fontWeight = esAlerta ? "bold" : "normal";
                statusText.innerText = esAlerta 
                    ? `⚠️ ¡ALERTA! Alza brusca: ${meses[index]} | $${val}`
                    : `Mes: ${meses[index]} | ${label}: ${isIpc ? val.toFixed(1) : '$'+val}`;
            }, timeOffset);

            timeOffset += durationPerNote;
        });

        setTimeout(() => {
            isPlaying = false;
            playBtn.disabled = false;
            playIpcBtn.disabled = false;
            statusText.innerText = "Sonificación completada. Compara los sonidos para notar la brecha.";
        }, (dataArray.length * durationPerNote * 1000) + 1000);
    };

    playBtn.addEventListener('click', () => playSequence(aceitePrecios, "Aceite Vegetal"));
    playIpcBtn.addEventListener('click', () => playSequence(promedioNacional.slice(0, meses.length), "IPC General", true));
});
