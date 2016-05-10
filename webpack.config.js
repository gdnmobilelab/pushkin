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
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                unused: true,
                dead_code: true,
                warnings: false,
                drop_debugger: true
            }
        })
    ]
}