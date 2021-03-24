import { useEffect, useState } from 'react';

export type HookFetcher<T> = () => Promise<string | T>;

export function useMicroFetch<T>(fetcher: HookFetcher<T>) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<T>();
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await fetcher();
                setData(result as T);
                setLoading(false);
            } catch (e) {
                setError(e);
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return { loading, data, error };

}
