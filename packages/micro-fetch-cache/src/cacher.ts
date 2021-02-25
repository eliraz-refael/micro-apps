export function microStorage(storage: Storage) {

    function cacheItem({ key, item } : {key: string, item: any}): boolean {
        try {
            storage.setItem(key, JSON.stringify(item));
            return true;
        } catch {
            return false;
        }
    }

    function getItem<T>(key: string): T | false {
        try {
            const unparsedItem = storage.getItem(key);
            if (unparsedItem) {
                return JSON.parse(unparsedItem) as T;
            }
            return false;
        } catch {
            return false;
        }
    }

    return {
        cacheItem,
        getItem
    }
}
