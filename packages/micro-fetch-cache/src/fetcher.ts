export interface IFetcher {
    url: string;
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    headers?: {
        [key: string]: string
    };
    payload?: any;
    onUnauthorized?: (status?: number) => void;
}

const defaultHeaders = {
    'Content-Type': 'application/json'
};

export async function fetcher<T>({ url, payload, method = 'get', headers = defaultHeaders, onUnauthorized }: IFetcher): Promise<string | T> {

    async function parseResponse<T>(response: Response): Promise<T | string> {
        try {
            const result = await response.json();
            return result;
        } catch {
            const result = await response.text();
            return result;
        }
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: payload ? payload : undefined
        });
        if (response.status >= 200 && response.status < 300) {
            return await parseResponse<T>(response);
        }
        if ((response.status === 401 || response.status === 403) && onUnauthorized) {
            onUnauthorized(response.status);
            return await Promise.reject(parseResponse<T>(response));
        }
        return Promise.reject(await parseResponse<T>(response))
    } catch (e) {
        return Promise.reject(e);
    }
};
