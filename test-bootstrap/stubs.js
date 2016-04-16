import mockery from 'mockery';
import fakeredis from 'fakeredis';

/*
    We mock out the redis module so that we can just
    use a local in-memory module instead of requiring
    redis in the dev stack.
*/

mockery.enable({ useCleanCache: true });
mockery.warnOnUnregistered(false);
mockery.registerMock('redis', {
    createClient: function(host, port) {

        // by default fakeredis simulates network latency, we don't really
        // need/want that.

        return fakeredis.createClient(host, port, {fast : true})
    }
});