import { microStorage } from './cacher';
import { IFetcher, fetcher as fetcherFunc } from './fetcher';
export { useMicroFetch } from './useMicroFetch';

export type StorageSetter = ({ key, item, stringify }: { key: string, item: any, stringify?: boolean }) => boolean;
export type StorageGetter<T> = (key:string, parseJson?: boolean) => T | null;
export type FetcherFunc<T> = ({ url, method, headers, onUnauthorized} : IFetcher) => Promise<string | T>;

interface TaggerArgs {
    key: string;
    listKey: string;
}
type Tagger = ({ key, listKey }: TaggerArgs) => void;

export type ICacherGenerator<T> = ({ expiration, tag, setItemFunc, getItemFunc, tagger }: ICacherGeneratorArgs<T>) => CacherFn<T>;

interface ICacherGeneratorArgs<T> {
    expiration: number;
    tag?: string;
    setItemFunc: StorageSetter;
    getItemFunc: StorageGetter<T>;
    tagger?: Tagger;
}

export type CacherFn<T> = ({ key, item }: { key: string, item: any }) => boolean | T;

export type MethodType = 'post' | 'put' | 'patch' | 'delete' | 'get';

export type CachedItem<T> = { item: T, expireAt: number };

export interface IRequestArgs<T> {
    url: string,
    payload?: T,
    method: MethodType;
}

export interface IRequestArgsShort<T> {
    url: string,
    payload?: T,
}

interface IRequestContainerArgs<T> {
    fetcher?: FetcherFunc<T>,
    cacher?: StorageSetter;
}

type RequestContainerFn<T> = ({ fetcher, cacher }: IRequestContainerArgs<T>) => Promise<string | boolean | T>;


// this is a comment
export function microFetchCache({ listKey = '##-mfc-all-keys-##' }: { listKey?: string }) {

    const { buildCacheItemFn, buildGetItemFn } = microStorage();

    const cacheItem = buildCacheItemFn(localStorage.setItem);
    const getItemFromCache = buildGetItemFn(localStorage.getItem);

    function itemTransformer<T>(item: T, expireAt: number) {
        return [
            { item, expireAt },
            {
                getItem: (cachedItem: CachedItem<T>) => cachedItem.item,
                getExpiration: (cachedItem: CachedItem<T>) => cachedItem.expireAt
            }
        ]
    }

    function cacher<T>({ expiration, setItemFunc = cacheItem, getItemFunc = getItemFromCache, tagger }: ICacherGeneratorArgs<T>): CacherFn<T>  {
        return ({ key, item }) => {
            const [transformedItem, ti]  = itemTransformer(item, expiration);
            const cachedItem = getItemFunc(key);
            const expireAt = ti.getExpiration(item);
            if (cachedItem && cachedItem.expireAt > Date.now()) {
                return cachedItem.item;
            }
            setItemFunc({ key, item: transformedItem });
            if (tagger) {
                tagger({ key, listKey });
            }
            return true;
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

    function getRequest<R>({ url }: IRequestArgsShort<{}>): RequestContainerFn<R> {
        return requestF<{},R>({ url, method: 'get' });
    }

    function postRequest<T, R>({ url, payload }: IRequestArgsShort<T>): RequestContainerFn<R> {
        return requestF<T,R>({ url, payload, method: 'post' });
    }

    function putRequest<T, R>({ url, payload }: IRequestArgsShort<T>): RequestContainerFn<R> {
        return requestF<T,R>({ url, payload, method: 'put' });
    }

    function patchRequest<T, R>({ url, payload }: IRequestArgsShort<T>): RequestContainerFn<R> {
        return requestF<T,R>({ url, payload, method: 'patch' });
    }

    function deleteRequest<T, R>({ url, payload }: IRequestArgsShort<T>): RequestContainerFn<R> {
        return requestF<T,R>({ url, payload, method: 'delete' });
    }

    function requestF<T, R>({ url, payload, method }: IRequestArgs<T>) {
        return async ({ fetcher = fetcherFunc, cacher }: IRequestContainerArgs<R>) => {
            const result = await fetcher({ url, payload, method });
            if (cacher) {
                cacher({ key: url, item: result as R });
            }
            return result;
        }
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
