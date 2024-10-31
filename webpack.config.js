const fs = require("fs");
const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/playground.ts"),
    output: {
        path: path.resolve(appDirectory, "dist"),
        filename: "js/playground.js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        headers: {
            // These are needed to get SharedArrayBuffer working, which is required for Whisper speech-to-text.
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
        },
        host: "0.0.0.0",
        port: 443,
        static: path.resolve(appDirectory, "public"),
        hot: false,
        server: "https",
    },
    devtool: "inline-source-map",
    // infrastructureLogging: {
    // 	level: 'log',
    // },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{ from: path.resolve("public/js/dat.gui.0.6.2.min.js"), to: "js" }, path.resolve("public/favicon.png")],
        }),
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "public/index.html"),
        }),
        new CleanWebpackPlugin(),
    ],
    mode: "development",
};
