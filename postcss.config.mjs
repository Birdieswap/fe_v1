import path from "path";
import process from "process";

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-import": {
      tailwindcss: {},
      autoprefixer: {},
      resolve: (id) => {
        const __dirname = process.cwd();

        if (String(id).startsWith("/src/")) {
          return path.resolve(__dirname, "src", id.slice(5));
        }

        return id;
      },
    },
    "tailwindcss/nesting": {},
    tailwindcss: {},
  },
};

export default config;
