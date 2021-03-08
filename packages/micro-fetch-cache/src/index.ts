import { microStorage } from './cacher';
import { IFetcher, fetcher as fetcherFunc } from './fetcher';

type StorageSetter = ({ key, item }: { key: string, item: any }) => boolean;
type StorageGetter<T> = (key:string) => T | boolean;
type FetcherFunc<T> = ({ url, method, headers, onUnauthorized} : IFetcher) => Promise<string | T>;

interface TaggerArgs {
    key: string;
    listKey: string;
}
type Tagger = ({ key, listKey }: TaggerArgs) => void;

interface CacherFunc {
    expiration: number;
    tag?: string;
    setItemFunc: ({ key, item }: { key: string, item: any }) => boolean;
    tagger?: Tagger;
}

interface CacherCB {
    key: string;
    item: any;
}

interface FetchGet<T> {
    url: string;
    fetcher?: FetcherFunc<T>,
    cacher?: ({ key, item }: CacherCB) => void;
    tag?: string;
    expiration?: number;
}

interface FetchPost<T, R> {
    url: string;
    payload: T;
    fetcher?: FetcherFunc<R>,
    cacher?: ({ key, item }: CacherCB) => void;
    tag?: string;
    expiration?: number;
}

export function microFetchCache({ listKey = '##-mfc-all-keys-##', storage = localStorage }: { listKey?: string, storage?: Storage }) {

    const { cacheItem, getItem } = microStorage(storage);

    async function parseResponse<T>(response: Response): Promise<T | string> {
        try {
            const result = await response.json();
            return result;
        } catch {
            const result = await response.text();
            return result;
        }
    }

    function cacher({ expiration, setItemFunc = cacheItem, tagger } : CacherFunc) {
        return ({ key, item }: CacherCB) => {
            const data = { expireAt: expiration, item };
            setItemFunc({ key, item: data });
            if (tagger) {
                tagger({ key, listKey });
            }
        }
    }

    function tagAs({ tag, setItemFunc = cacheItem, getItemFunc = getItem }: { tag: string, setItemFunc: StorageSetter, getItemFunc: StorageGetter<any> }): Tagger {
        return ({ key, listKey }) => {
            try {
                let allKeys = getItemFunc(listKey);
                if (allKeys && allKeys[tag]) {
                    allKeys[tag].push(key);
                } else if (allKeys) {
                    allKeys[tag] = [key];
                } else {
                    allKeys = {};
                    allKeys[tag] = key;
                }
                return setItemFunc({ key, item: allKeys });
            } catch {
                return false;
            }
        }
    }

    async function get<T>({ url, cacher, fetcher = fetcherFunc }: FetchGet<T>): Promise<string | T> {
        const result = await fetcher({ url });
        if (cacher) {
            cacher({ key: url, item: result as any });
        }
        return result;
    }

    async function post<T, R>({ url, payload, cacher, fetcher = fetcherFunc }: FetchPost<T, R>) {
        const result = await fetcher({ url, payload });
        if (cacher) {
            cacher({ key: url, item: result as any });
        }
        return result;
    }

    return {
        get,
        post,
        cacher,
        fetcher: fetcherFunc
    }
}
