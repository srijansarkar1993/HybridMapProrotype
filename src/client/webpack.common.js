const path = require('path');
const DotenvWebpackPlugin = require('dotenv-webpack');

module.exports = {
    entry: './src/client/client.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.gltf','.bin'],
        fallback: {
            "fs": false,
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify/browser"),
        },
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../../dist/client'),
        publicPath: '/',
    },
    plugins: [
      new DotenvWebpackPlugin(),
    ],
}