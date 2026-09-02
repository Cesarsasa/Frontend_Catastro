import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SuccessPago() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reciboId = searchParams.get('recibo_id');
  const dpi = searchParams.get('dpi');
  const { apiFetch } = useAuthStore();

  const [nit, setNit] = useState('');
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [loadingSalir, setLoadingSalir] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 👉 Ajusta estas rutas a las que necesites en tu app
  const RUTA_DESPUES_CONFIRMAR = `/certificados/propietario/${dpi}`;
  const RUTA_DESPUES_SALIR = `/certificados/propietario/${dpi}`;

  const enviarIdentificacion = async (valorNit: string) => {
    if (!reciboId) {
      throw new Error('No se encontró el número de recibo en la URL');
    }
    await apiFetch('pagos/identificacion', {
      method: 'PATCH',
      body: JSON.stringify({ num_recibo: reciboId, nit: valorNit }),
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const handleConfirmar = async () => {
    if (!nit.trim()) return; // el botón ya está disabled en este caso, es solo un resguardo

    setError(null);
    setLoadingConfirmar(true);
    try {
      await enviarIdentificacion(nit.trim());
      navigate(RUTA_DESPUES_CONFIRMAR);
    } catch (err: any) {
      setError(err?.message || 'Error confirmando pago');
    } finally {
      setLoadingConfirmar(false);
    }
  };

  const handleSalir = async () => {
    setError(null);
    setLoadingSalir(true);
    try {
      await enviarIdentificacion(''); // vacío -> el backend lo registra como CF
      navigate(RUTA_DESPUES_SALIR);
    } catch (err: any) {
      setError(err?.message || 'Error confirmando pago');
    } finally {
      setLoadingSalir(false);
    }
  };

  const disabled = loadingConfirmar || loadingSalir;

  return (
    <div className="p-6 bg-white rounded-xl shadow max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Pago realizado con éxito</h1>
      <p className="text-slate-600 mb-2">
        Ingresa tu NIT si deseas factura a tu nombre. Si no tienes o prefieres
        salir sin ingresarlo, se registrará como Consumidor Final (CF).
      </p>

      <input
        value={nit}
        onChange={(e) => setNit(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-2"
        placeholder="Ejemplo: 1234567-8"
        disabled={disabled}
      />

      {error && (
        <p className="text-red-600 text-sm mb-2">{error}</p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSalir}
          disabled={disabled}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50"
        >
          {loadingSalir ? 'Saliendo...' : 'Salir (CF)'}
        </button>

        <button
          onClick={handleConfirmar}
          disabled={disabled || !nit.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingConfirmar ? 'Confirmando...' : 'Confirmar con NIT'}
        </button>
      </div>
    </div>
  );
}