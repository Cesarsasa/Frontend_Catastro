import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SuccessPago() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
const reciboId = searchParams.get('recibo_id');
const rawCodigo = searchParams.get('codigo');
const codigo =
  rawCodigo && rawCodigo !== 'null' && rawCodigo !== 'undefined' ? rawCodigo : null;// antes: dpi
  const { apiFetch } = useAuthStore();

  const [nit, setNit] = useState('');
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [loadingSalir, setLoadingSalir] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si por alguna razón no viene el código, vuelve a la consulta en lugar de ir a ".../null"
  const rutaDestino = codigo
    ? `/certificados/propietario/${encodeURIComponent(codigo)}`
    : '/consulta';
    const destino = (cod: string | null) =>
  cod ? `/certificados/propietario/${encodeURIComponent(cod)}` : '/consulta';


  /*const enviarIdentificacion = async (valorNit: string) => {
    if (!reciboId) {
      throw new Error('No se encontró el número de recibo en la URL');
    }
    await apiFetch('pagos/identificacion', {
      method: 'PATCH',
      body: JSON.stringify({ num_recibo: reciboId, codigo, nit: valorNit }),
      headers: { 'Content-Type': 'application/json' },
    });
  };*/
  const enviarIdentificacion = async (valorNit: string) => {
  if (!reciboId) throw new Error('No se encontró el número de recibo en la URL');
  return apiFetch('pagos/identificacion', {
    method: 'PATCH',
    body: JSON.stringify({ num_recibo: reciboId, nit: valorNit }),
    headers: { 'Content-Type': 'application/json' },
  });
};

  const handleConfirmar = async () => {
    if (!nit.trim()) return;

    setError(null);
    setLoadingConfirmar(true);
    try {
      const resp = await enviarIdentificacion(nit.trim()); // '' en handleSalir
navigate(destino(resp?.codigo_catastral ?? codigo));
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
  const resp = await enviarIdentificacion(nit.trim()); // '' en handleSalir
navigate(destino(resp?.codigo_catastral ?? codigo));
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

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

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