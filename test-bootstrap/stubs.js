import mockery from 'mockery';
import fakeredis from 'fakeredis';
import should from 'should';
/*
    We mock out the redis module so that we can just
    use a local in-memory module instead of requiring
    redis in the dev stack.
*/

mockery.enable({ useCleanCache: true });
mockery.warnOnUnregistered(false);
mockery.registerMock('redis', {
    RedisClient: fakeredis.RedisClient,
    Multi: fakeredis.Multi,
    createClient: function() {

        // by default fakeredis simulates network latency, we don't really
        // need/want that.

        return fakeredis.createClient(1000, "dummyhost.local", {fast : true})
    }
});

console.info = () => {}