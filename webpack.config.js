var webpack = require('webpack');

module.exports = {
    target: "node",
    externals: [
        'aws-sdk' // this is provided by Lambda itself
    ],
    resolve: {
        extensions: ['', '.js', '.jsx']
      },
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
        alias: {
            'node_modules/redis-commands/commands': 'node_modules/redis-commands/commands.json'
        }
    }
}