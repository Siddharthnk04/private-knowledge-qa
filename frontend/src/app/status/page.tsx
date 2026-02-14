'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';

type StatusData = {
    backend: string;
    database: string;
    llm: string;
};

export default function StatusPage() {
    const [status, setStatus] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/status')
            .then(res => setStatus(res.data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 bg-white rounded shadow-md">
            <h1 className="text-2xl font-bold mb-4">System Status</h1>

            {loading && <p>Checking status...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}

            {status && (
                <div className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">Backend:</span>
                        <span className={status.backend === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                            {status.backend}
                        </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">Database:</span>
                        <span className={status.database === 'connected' ? 'text-green-600' : 'text-red-600'}>
                            {status.database}
                        </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">LLM Service:</span>
                        <span className={status.llm === 'reachable' ? 'text-green-600' : 'text-red-600'}>
                            {status.llm}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
