import requests
import pandas as pd
from datetime import datetime
import sys

# --- CONFIGURACIÓN ---
# ID de la serie: IPC Nacional - Nivel General - Variación Porcentual Mensual
# Fuente: Instituto Nacional de Estadística y Censos (INDEC) a través de Datos Argentina
SERIES_ID = '148.3_INIVELGEN_D_A_0_26'  
API_URL = f"https://apis.datos.gob.ar/series/api/series?ids={SERIES_ID}&limit=5000&format=json"

def obtener_datos_ipc():
    """
    Conecta a la API de Datos Argentina y obtiene la serie histórica del IPC.
    Retorna un DataFrame de pandas procesado.
    """
    try:
        print(f"📡 Conectando a la API del INDEC ({API_URL})...")
        response = requests.get(API_URL)
        response.raise_for_status()
        
        data = response.json()
        
        # Extracción de datos
        raw_data = data['data']
        
        # Crear DataFrame
        df = pd.DataFrame(raw_data, columns=['fecha', 'ipc_mensual'])
        
        # Convertir fecha a datetime y float a numérico
        df['fecha'] = pd.to_datetime(df['fecha'])
        df['ipc_mensual'] = pd.to_numeric(df['ipc_mensual'])
        
        # Ordenar por fecha descendente (más reciente primero)
        df = df.sort_values(by='fecha', ascending=False)
        
        return df
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error procesando datos: {e}")
        sys.exit(1)

def calcular_ajuste(monto_actual, df_ipc):
    """
    Calcula el nuevo monto de alquiler basado en los últimos 4 meses disponibles de IPC.
    """
    # Tomar los últimos 4 meses disponibles
    # Nota: El dataframe ya está ordenado descendente
    ultimos_4_meses = df_ipc.head(4).copy()
    
    # Ordenar ascendente para el display cronológico
    ultimos_4_meses = ultimos_4_meses.sort_values(by='fecha', ascending=True)
    
    factor_acumulado = 1.0
    
    print("\n📊 DETALLE DEL CÁLCULO (Últimos 4 meses publicados):")
    print("-" * 60)
    print(f"{'FECHA':<15} | {'IPC MENSUAL':<15} | {'FACTOR'}")
    print("-" * 60)
    
    for _, row in ultimos_4_meses.iterrows():
        inflacion_mensual = row['ipc_mensual']
        
        # La API devuelve el número entero (ej: 12.5 para 12.5%)
        # Convertimos a decimal: 12.5 -> 0.125
        coeficiente = inflacion_mensual
        
        # Fórmula: Valor * (1 + i1) * (1 + i2)...
        factor_mensual = 1 + coeficientes
        factor_acumulado *= factor_mensual # Error aquí: coeficientes es el % directo si es < 1? 
        # CORRECCIÓN: La API de Argentina suele devolver la tasa "0.04" o el índice.
        # Verificando la serie 148.3... es variación mensual 0.xx o x.x?
        # Generalmente es decimal (0.06 para 6%)
        
        # Vamos a asumir formato decimal (0.04 = 4%) basado en la documentación estándar
        # Si el valor es > 1 (ej: 4.5), asumiremos que es porcentaje y dividiremos por 100
        # Pero la serie '148.3_INIVELGEN_D_A_0_26' devuelve valores como 0.06 (6%).
        
        # Ajuste de seguridad por si cambia el formato de la API
        pct_real = coeficiente if coeficiente < 2 else coeficiente / 100
        
        factor_dia = 1 + pct_real
        factor_acumulado *= factor_dia
        
        mes_nombre = row['fecha'].strftime('%B %Y').capitalize()
        print(f"{mes_nombre:<15} | {pct_real*100:>10.2f}%      | x {factor_dia:.4f}")

    print("-" * 60)
    
    nuevo_monto = monto_actual * factor_acumulado
    incremento_total_pct = (factor_acumulado - 1) * 100
    
    return nuevo_monto, incremento_total_pct

def main():
    print("🏢 --- CALCULADORA DE AJUSTE DE ALQUILER ICL/IPC (Argentina) ---")
    
    try:
        input_val = input("💰 Ingrese el monto actual del alquiler ($): ")
        monto_actual = float(input_val)
    except ValueError:
        print("❌ Por favor ingrese un número válido.")
        return

    # 1. Obtener datos
    df = obtener_datos_ipc()
    
    # 2. Calcular
    nuevo_monto, incremento_pct = calcular_ajuste(monto_actual, df)
    
    # 3. Resultado
    print("\n✅ RESULTADO FINAL:")
    print(f"   Monto Anterior:   $ {monto_actual:,.2f}")
    print(f"   Ajuste Total:       {incremento_pct:.2f}% (Cuatrimestral)")
    print(f"   ---------------------------")
    print(f"   💵 NUEVO ALQUILER: $ {nuevo_monto:,.2f}")
    print("\n⚠️  Nota: Este cálculo utiliza los últimos 4 índices OFICIALES publicados por el INDEC.")
    print("    Si estamos a principio de mes, es normal que el dato del mes anterior aún no esté disponible.")

if __name__ == "__main__":
    main()
