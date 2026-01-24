
export const fetchArquilerData = async () => {
    try {
        const res = await fetch('/api/arquiler'); // Calls our Vercel function
        if (!res.ok) throw new Error('Failed to fetch Arquiler data');
        const data = await res.json();
        return data; // Returns { icl: [], ipc: [], ... }
    } catch (error) {
        console.error("Arquiler Fetch Error:", error);
        return null;
    }
};

export const getAvailableIndices = () => [
    { id: 'icl', name: 'ICL (Ley de Alquileres 2020)' },
    { id: 'casa_propia', name: 'Casa Propia (Procrear II)' },
    { id: 'ipc', name: 'IPC (Indec / Arquiler)' },
    { id: 'cac', name: 'CAC (Construcción)' }
];
