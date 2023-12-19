import { defineConfig } from "./src";

export default defineConfig(() => {
  return {
    build: {
      // beforeHooks: [() => replaceRequireTransformer],
      // afterDeclarationsHooks: [replaceRequireTransformer],
    },
  };
});

const a = _require.resolve("@halsp/inject");
console.log("test" + "ab", a);

const b = a.slice(0, 1);

// const replaceRequireTransformer: CompilerHook<ts.SourceFile | ts.Bundle> = (
//   program,
// ) => {
//   const emit = program.emit;
//   const newEmit = (
//     targetSourceFile?: ts.SourceFile,
//     writeFile?: ts.WriteFileCallback,
//     cancellationToken?: ts.CancellationToken,
//     emitOnlyDtsFiles?: boolean,
//     customTransformers?: ts.CustomTransformers,
//   ) => {
//     const newWriteFile = writeFile
//       ? (
//           fileName: string,
//           text: string,
//           writeByteOrderMark: boolean,
//           onError?: (message: string) => void,
//           sourceFiles?: readonly ts.SourceFile[],
//           data?: ts.WriteFileCallbackData,
//         ) => {
//           text = addShims(text, fileName);
//           return writeFile(
//             fileName,
//             text,
//             writeByteOrderMark,
//             onError,
//             sourceFiles,
//             data,
//           );
//         }
//       : undefined;
//     return emit(
//       targetSourceFile,
//       newWriteFile,
//       cancellationToken,
//       emitOnlyDtsFiles,
//       customTransformers,
//     );
//   };
//   program.emit = newEmit;

//   const files = program.getSourceFiles();
//   console.log("meta--------", files);
//   files.forEach((file) => {
//     const children = file.getChildren(file);
//     children.forEach((node) => {
//       if (ts.isCallExpression(node)) {
//       }
//     });

//     // console.log("file");
//     // file.text = file.text.replace("import.meta.url", "             ");
//   });

//   return (context) => {
//     const visit: ts.Visitor = (node) => {
//       return ts.visitEachChild(node, visit, context);
//     };

//     return (node) => {
//       console.log("node-program-------");
//       return ts.visitEachChild(node, visit, context);
//     };
//   };
// };
