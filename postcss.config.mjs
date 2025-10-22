/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;

// import path from "path";
// import process from "process";

// /** @type {import('postcss-load-config').Config} */
// const config = {
//   plugins: {
//     "postcss-import": {
//       resolve: (id) => {
//         const __dirname = process.cwd();
//         if (String(id).startsWith("/src/")) {
//           return path.resolve(__dirname, "src", id.slice(5));
//         }
//         return id;
//       },
//     },
//     "@tailwindcss/postcss": {},  // ✅ v4용 (nesting + tailwind 포함)
//   },
// };

// export default config;
