var webpack = require('webpack');
var path = require('path');

module.exports = {
    target: "node",
    externals: [
        'aws-sdk' // this is provided by Lambda itself
    ],
    // Make webpack exit with error code when it encounters an error. Why is this not default?!
    bail: true,
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                loader: 'json'
            }
        ]
    },
    resolve: {
        extensions: ['', '.json', '.js', '.jsx'],
        alias: {
            // This is really stupid but node_redis tries to require hiredis, which we don't
            // want to provide. Adding this stops the build failing.
            'node_modules/redis-commands/commands': 'node_modules/redis-commands/commands.json',
            'hiredis': path.join(__dirname, 'hiredis-shim.js')
        }
    },
    devtool: 'source-map',
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        //When this is active the mysql package doesn't work correctly.
        //Get the error "PROTOCOL_INCORRECT_PACKET_SEQUENCE"
        //See http://stackoverflow.com/questions/33261828/serverless-framework-with-node-mysq-error-protocol-incorrect-packet-sequence
        //Above URL has relevant details (error occurs when using the servless optimization plugin)
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         unused: true,
        //         dead_code: true,
        //         warnings: false,
        //         drop_debugger: true
        //     }
        // })
    ]
}