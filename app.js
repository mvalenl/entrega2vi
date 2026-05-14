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

    const data = [tracePan, traceAceite, traceArroz];

    // Layout de Plotly adaptado al diseño Dark Glassmorphism
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Outfit', color: '#f8fafc' },
        xaxis: {
            title: 'Meses (2024 - 2025)',
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            title: 'Precio Promedio (CLP)',
            gridcolor: 'rgba(255,255,255,0.1)',
            zeroline: false
        },
        margin: { l: 60, r: 20, t: 40, b: 50 },
        hovermode: 'x unified',
        legend: { orientation: 'h', y: 1.15 }
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
            const freq = mapPriceToFrequency(precio, minAceite, maxAceite, 220, 880); // Escala A3 a A5
            
            // Programar la nota
            synth.triggerAttackRelease(freq, "8n", timeOffset);
            
            // Efecto visual en Plotly durante la reproducción (Opcional)
            Tone.Draw.schedule(() => {
                // Podríamos resaltar el punto en el gráfico, pero lo dejaremos simple
                statusText.innerText = `Mes: ${meses[index]} | Precio Aceite: $${precio}`;
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
