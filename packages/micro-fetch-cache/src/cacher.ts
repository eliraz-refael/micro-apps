type CachedItem<T> = { item: T, expireAt: number };

export function microStorage() {

    function buildCacheItemFn(storageSetter: (key: string, item: any) => void = localStorage.setItem) {
        return ({ key, item, stringify = true }: { key: string, item: any, stringify?: boolean }) => {
            try {
                storageSetter(key, stringify ? JSON.stringify(item) : item);
                return true;
            } catch {
                return false;
            }
        }
    }

    function buildGetItemFn(storageGetter: (key: string) => string | null | unknown = localStorage.getItem) {
        return <T>(key: string, parseJson?: boolean) => {
            try {
                const unparsedItem = storageGetter(key);
                if (parseJson && unparsedItem) {
                    return JSON.parse(key) as T;
                }
                return unparsedItem as T;
            } catch (e) {
                return null;
            }
        }
    }

    return {
        buildCacheItemFn,
        buildGetItemFn
    }
}
