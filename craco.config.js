module.exports = {
    webpack: {
        configure: {
            module: {
                rules: [
                    {
                        test: /\.(glsl|vs|fs|vert|frag)$/,
                        type: 'asset/source'
                    }
                ]
            }
        }
    }
};