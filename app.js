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
        marker: { size: 8 }
    };

    const traceAceite = {
        x: meses,
        y: aceitePrecios,
        mode: 'lines+markers',
        name: 'Aceite Vegetal',
        line: { color: '#f43f5e', width: 3, shape: 'spline' },
        marker: { size: 8 }
    };

    const traceArroz = {
        x: meses,
        y: arrozPrecios,
        mode: 'lines+markers',
        name: 'Arroz',
        line: { color: '#38bdf8', width: 3, shape: 'spline' },
        marker: { size: 8 }
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
            font: { color: '#f8fafc', size: 24 }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Outfit', color: '#f8fafc' },
        showlegend: true,
        legend: { font: { color: '#94a3b8' }, orientation: 'h', y: 1.15 },
        xaxis: {
            title: 'Meses (2024 - 2025)',
            gridcolor: 'rgba(255,255,255,0.1)',
            tickfont: { color: '#94a3b8' },
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
        margin: { l: 60, r: 20, t: 80, b: 50 },
        hovermode: 'closest'
    };

    const config = { responsive: true, displayModeBar: false };

    // Renderizar Gráfico
    Plotly.newPlot('plotly-chart', data, layout, config);

    // ==========================================
    // TONE.JS SONIFICACIÓN
    // ==========================================
    
    let isPlaying = false;
    const playBtn = document.getElementById('play-sonification');
    const statusText = document.getElementById('status-text');

    // Función para mapear un valor numérico a una frecuencia (Hz)
    // Aceite varía aprox entre 4200 y 6200. Mapearemos esto entre 200Hz y 800Hz.
    const mapPriceToFrequency = (price, minPrice, maxPrice, minFreq, maxFreq) => {
        return ((price - minPrice) / (maxPrice - minPrice)) * (maxFreq - minFreq) + minFreq;
    };

    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;

        // Iniciar Audio Context al interactuar (requerimiento de navegadores)
        await Tone.start();
        isPlaying = true;
        playBtn.disabled = true;
        statusText.innerText = "Reproduciendo evolución del precio del Aceite...";

        // Crear Sintetizador con un sonido suave
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.2, release: 1 }
        }).toDestination();

        // Aplicar un pequeño delay o reverb para que suene más inmersivo
        const reverb = new Tone.Reverb(2).toDestination();
        synth.connect(reverb);

        // Encontrar mínimo y máximo del aceite para la escala
        const minAceite = Math.min(...aceitePrecios);
        const maxAceite = Math.max(...aceitePrecios);

        // Secuencia de reproducción
        let timeOffset = Tone.now();
        const durationPerNote = 0.4; // Segundos por cada mes

        aceitePrecios.forEach((precio, index) => {
            const freq = mapPriceToFrequency(precio, minAceite, maxAceite, 220, 880);
            
            // CALCULAR EL SALTO: ¿Cuánto subió respecto al mes anterior?
            let salto = 0;
            if (index > 0) {
                salto = (precio - aceitePrecios[index - 1]) / aceitePrecios[index - 1];
            }

            // SI EL SALTO ES GRANDE (ej. > 5%), activamos efectos de "urgencia"
            const esAlerta = salto > 0.05;

            // Programar la nota
            // Usamos un pequeño truco: conectamos a un vibrato solo si hay alerta
            if (esAlerta) {
                const vibrato = new Tone.Vibrato(5, 0.3).toDestination();
                synth.connect(vibrato);
                synth.triggerAttackRelease(freq, "8n", timeOffset);
                // Desconectamos después de la nota para no acumular efectos
                Tone.Transport.scheduleOnce(() => {
                    synth.disconnect(vibrato);
                }, timeOffset + 0.3);
            } else {
                synth.triggerAttackRelease(freq, "8n", timeOffset);
            }
            
            // Efecto visual sincronizado: Cambiar color o texto
            Tone.Draw.schedule(() => {
                statusText.style.color = esAlerta ? "#f43f5e" : "#f8fafc";
                statusText.style.fontWeight = esAlerta ? "bold" : "normal";
                statusText.innerText = esAlerta 
                    ? `⚠️ ¡ALERTA! Alza brusca: ${meses[index]} | $${precio}`
                    : `Mes: ${meses[index]} | Precio Aceite: $${precio}`;
            }, timeOffset);

            timeOffset += durationPerNote;
        });

        // Al finalizar
        setTimeout(() => {
            isPlaying = false;
            playBtn.disabled = false;
            statusText.innerText = "Sonificación completada.";
        }, (aceitePrecios.length * durationPerNote * 1000) + 1000);
    });
});
