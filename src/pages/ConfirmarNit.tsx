import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SuccessPago() {
  const [searchParams] = useSearchParams();
  const reciboId = searchParams.get('recibo_id');
  const { apiFetch } = useAuthStore();
  const [nit, setNit] = useState('');

  const handleConfirmar = async () => {
    try {
      await apiFetch('pagos/identificacion', {
        method: 'PATCH',
        body: JSON.stringify({ num_recibo: reciboId, nit }),
        headers: { 'Content-Type': 'application/json' },
      });
      alert('Pago confirmado con NIT/CF');
    } catch (err: any) {
      alert(err?.message || 'Error confirmando pago');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className="text-xl font-bold mb-4">Pago realizado con éxito</h1>
      <p className="text-slate-600 mb-2">
        Ingresa tu NIT (si lo dejas vacío se registrará como CF):
      </p>
      <input
        value={nit}
        onChange={(e) => setNit(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Ejemplo: 1234567-8"
      />
      <button
        onClick={handleConfirmar}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Confirmar
      </button>
    </div>
  );
}
