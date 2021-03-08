import typescript from "rollup-plugin-typescript";
import {terser} from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default [
    {
        input: "src/view/board/board.ts",
        output: {
            file: "dist/view/board/board.js",
            format: "es",
        },
        plugins: [
            //compile ts file to js
            typescript({ 
                tsconfig: "src/view/tsconfig.json",
                sourceMap: !production,
                inlineSources: !production
            }),
            //minify the js file
            production && terser()
        ]
    }
];
