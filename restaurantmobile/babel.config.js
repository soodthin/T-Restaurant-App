module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['module-resolver', {
                alias: {
                    '@components': './components',
                    '@pages': './pages',
                    '@utils': './utils',
                    '@styles': './styles',
                    '@contexts': './contexts',
                    '@configs': './configs',
                },
            }],
        ],
    };
};
