import { microFetchCache } from '../src/index';

const fakeFetch = jest.fn(({ url, payload, method, headers, onUnauthorized }) => {
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
        // @ts-ignore
        const { get, cacher, fetcher } = microFetchCache({ storage: fakeStorage });
        // @ts-ignore
        await get({ url:'testing', fetcher: fakeFetch });
        expect(fakeFetch).toBeCalled();
        done();
    });

    it('should call cacher when using cache', async (done) => {
        // @ts-ignore
        const { get, cacher, fetcher } = microFetchCache({ storage: fakeStorage });
        const cacherFake = jest.fn(({ url, item }) => 'ok');
        // @ts-ignore
        await get({ url: 'testing', fetcher: fakeFetch, cacher: cacherFake });
        expect(cacherFake).toBeCalledWith({ key: 'testing',  item: { lala: 123 } });
        done();
    })
});
