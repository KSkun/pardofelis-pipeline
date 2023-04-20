// path util functions
// by chengtian.he
// 2023.3.23

export function getFileName(filePath: string) {
  return filePath.substring(filePath.lastIndexOf("/") + 1);
}

export function getDirectoryPath(filePath: string) {
  return filePath.substring(0, filePath.lastIndexOf("/"));
}

export function combinePath(...paths: string[]) {
  let result = "";
  for (let i = 0; i < paths.length; i++) {
    if (i > 0) result += "/";
    result += paths[i];
  }
  return result;
}