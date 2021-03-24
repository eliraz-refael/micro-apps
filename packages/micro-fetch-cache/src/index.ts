import { microStorage } from './cacher';
import { IFetcher, fetcher as fetcherFunc } from './fetcher';
export { useMicroFetch } from './useMicroFetch';

export type StorageSetter = ({ key, item }: { key: string, item: any }) => boolean;
export type StorageGetter<T> = (key:string) => T | boolean;
export type FetcherFunc<T> = ({ url, method, headers, onUnauthorized} : IFetcher) => Promise<string | T>;

interface TaggerArgs {
    key: string;
    listKey: string;
}
type Tagger = ({ key, listKey }: TaggerArgs) => void;

interface CacherFunc<T> {
    expiration: number;
    tag?: string;
    setItemFunc: ({ key, item }: { key: string, item: any }) => boolean;
    getItemFunc: (key: string) => { expireAt: number, item: T } | false;
    tagger?: Tagger;
}

interface CacherCB {
    key: string;
    item: any;
}

interface FetchGet<T> {
    url: string;
    fetcher?: FetcherFunc<T>,
    cacher?: ({ key, item }: CacherCB) => T | null;
    tag?: string;
    expiration?: number;
}

interface FetchRequest<T, R> {
    url: string;
    payload?: T;
    fetcher?: FetcherFunc<R>,
    cacher?: ({ key, item }: CacherCB) => T | null;
    method: 'post' | 'put' | 'patch' | 'delete' | 'get';
    tag?: string;
    expiration?: number;
}

export function microFetchCache({ listKey = '##-mfc-all-keys-##', storage = localStorage }: { listKey?: string, storage?: Storage }) {

    const { cacheItem, getItem } = microStorage(storage);

    function cacher<T>({ expiration, setItemFunc = cacheItem, getItemFunc = getItem, tagger } : CacherFunc<T>) {
        return ({ key, item }: CacherCB) => {
            const cachedItem = getItemFunc(key);
            if (cachedItem && cachedItem.expireAt > Date.now()) {
                return cachedItem.item;
            }
            const data = { expireAt: expiration, item };
            setItemFunc({ key, item: data });
            if (tagger) {
                tagger({ key, listKey });
            }
            return null;
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

    function getRequest<T>({url, cacher, fetcher = fetcherFunc }: FetchGet<T>): (() => Promise<string | T>) {
        return async () => requestP({ url, cacher, fetcher, method: 'get' });
    }

    function postRequest<T, R>({ url, payload, cacher, fetcher = fetcherFunc }: FetchRequest<T, R>): (() => Promise<string | R | T>) {
        return async () => requestP({ url, payload, cacher, fetcher, method: 'post' });
    }

    function putRequest<T, R>({ url, payload, cacher, fetcher = fetcherFunc }: FetchRequest<T, R>): (() => Promise<string | R | T>) {
        return async () => requestP({ url, payload, cacher, fetcher, method: 'put' });
    }

    function patchRequest<T, R>({ url, payload, cacher, fetcher = fetcherFunc }: FetchRequest<T, R>): (() => Promise<string | R | T>) {
        return async () => requestP({ url, payload, cacher, fetcher, method: 'patch' });
    }

    function deleteRequest<T, R>({ url, payload, cacher, fetcher = fetcherFunc }: FetchRequest<T, R>): (() => Promise<string | R | T>) {
        return async () => requestP({ url, payload, cacher, fetcher, method: 'delete' });
    }

    async function requestP<T, R>({ url, payload, cacher, fetcher = fetcherFunc, method }: FetchRequest<T, R>) {
        const result = await fetcher({ url, payload, method });
        if (cacher) {
            const cachedItem = cacher({ key: url, item: result as R });
            if (cachedItem) {
                return cachedItem;
            }
        }
        return result;
    }

    return {
        getRequest,
        deleteRequest,
        postRequest,
        putRequest,
        patchRequest,
        tagAs,
        cacher,
        fetcher: fetcherFunc
    }
}
