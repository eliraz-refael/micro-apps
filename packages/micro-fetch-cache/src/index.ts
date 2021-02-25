import { microStorage } from './cacher';

type StorageSetter = ({ key, item }: { key: string, item: any }) => boolean;
type StorageGetter<T> = (key:string) => T | boolean;

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

interface FetchGet {
    url: string;
    cacher?: ({ key, item }: CacherCB) => void;
    tag?: string;
    expiration?: number;
}

export function microFetchCache({ listKey = '##-mfc-all-keys-##', storage = localStorage }: { listKey: string, storage: Storage }) {

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

    function cacher({ expiration, setItemFunc, tagger } : CacherFunc) {
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

    async function get<T>({ url, cacher, tag, expiration }: FetchGet): Promise<T> {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status >= 200 && response.status < 300) {
                const result = await parseResponse(response);
                if (cacher) {
                    cacher({ key: url, item: result as any })
                }
            }
            return Promise.reject(await response.json())

        } catch (error) {
            return Promise.reject(error);
        }

    }

    return {
        get,
        cacher
    }
}
