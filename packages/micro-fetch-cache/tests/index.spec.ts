import { IFetcher } from '../src/fetcher';
import { StorageSetter, microFetchCache } from '../src/index';

const fakeFetch = jest.fn(async ({ url, payload, method, headers, onUnauthorized }: IFetcher) => {
    return { lala: 123 };
});

const fakeStorage = jest.fn(() => {
    return {
        setItem: jest.fn(),
        getItem: jest.fn()
    }
});

describe('main tests', () => {
    it('should work with mock fetcher', async (done) => {
        const { getRequest, cacher, fetcher } = microFetchCache({});
        const readyRequest = getRequest<string>({ url:'testing' });
        await readyRequest({ fetcher });
        expect(fakeFetch).toBeCalled();
        done();
    });

    it('should call cacher when using cache', async (done) => {
        const { getRequest, cacher, fetcher } = microFetchCache({});
        const cacherFake = jest.fn(({ key, item }) => true);
        const readyRequest = getRequest({ url: 'testing' });
        await readyRequest({ fetcher: fakeFetch, cacher: cacherFake });
        expect(cacherFake).toBeCalledWith({ key: 'testing',  item: { lala: 123 } });
        done();
    })
});
