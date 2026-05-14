import json

file_path = 'Base anonimizada IPC 2023.csv'

# Meses que queremos extraer
meses_cols = [
    'pm_Enero2024', 'pm_Febrero2024', 'pm_Marzo2024', 'pm_Abril2024',
    'pm_Mayo2024', 'pm_Junio2024', 'Pm_Julio2024', 'Pm_Agosto2024',
    'Pm_Septiembre2024', 'Pm_Octubre2024', 'Pm_Noviembre2024', 'Pm_Diciembre2024'
]

nombres_meses = [
    "Ene 2024", "Feb 2024", "Mar 2024", "Abr 2024", 
    "May 2024", "Jun 2024", "Jul 2024", "Ago 2024", 
    "Sep 2024", "Oct 2024", "Nov 2024", "Dic 2024"
]

datos_por_mes = {mes: {'pan': [], 'aceite': [], 'arroz': []} for mes in nombres_meses}

# Categorías a buscar
keywords = {
    'PAN': 'pan',
    'ACEITE VEGETAL': 'aceite',
    'ARROZ': 'arroz'
}

try:
    with open(file_path, 'r', encoding='latin1') as f:
        header = f.readline().strip().split('\\')
        
        # Encontrar los indices de las columnas de los meses
        meses_idx = []
        for col in meses_cols:
            try:
                meses_idx.append(header.index(col))
            except ValueError:
                # Intenta ignorar mayúsculas/minúsculas
                idx = next((i for i, h in enumerate(header) if h.lower() == col.lower()), -1)
                meses_idx.append(idx)
        
        glosa_idx = 7 # Asumido por la estructura
        
        for line in f:
            parts = line.strip().split('\\')
            if len(parts) > glosa_idx:
                glosa = parts[glosa_idx].upper()
                
                categoria = None
                if 'PAN' in glosa:
                    categoria = 'pan'
                elif 'ACEITE VEGETAL' in glosa or 'ACEITE' in glosa:
                    categoria = 'aceite'
                elif 'ARROZ' in glosa:
                    categoria = 'arroz'
                
                if categoria:
                    for i, mes_idx in enumerate(meses_idx):
                        if mes_idx != -1 and len(parts) > mes_idx:
                            val = parts[mes_idx]
                            try:
                                precio = float(val)
                                if precio > 0: # Evitar ceros si son valores faltantes
                                    datos_por_mes[nombres_meses[i]][categoria].append(precio)
                            except ValueError:
                                pass

except Exception as e:
    print("Error leyendo el archivo:", e)

# Calcular promedios
datos_inflacion = []
for mes in nombres_meses:
    mes_data = {'mes': mes}
    for cat in ['pan', 'aceite', 'arroz']:
        precios = datos_por_mes[mes][cat]
        if precios:
            mes_data[cat] = int(sum(precios) / len(precios))
        else:
            mes_data[cat] = 0
    datos_inflacion.append(mes_data)

# Guardar o imprimir el resultado
print("let datosInflacion = " + json.dumps(datos_inflacion, indent=4, ensure_ascii=False) + ";")

with open('datos_extraidos.js', 'w', encoding='utf-8') as f:
    f.write("let datosInflacion = " + json.dumps(datos_inflacion, indent=4, ensure_ascii=False) + ";\n")
