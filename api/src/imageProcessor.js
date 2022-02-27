const path = require("path");
const { Worker, isMainThread } = require("worker_threads");

const pathToResizeWorker = path.resolve(__dirname, "resizeWorker.js");
const pathToMonochromeWorker = path.resolve(__dirname, "monochromeWorker.js");

const uploadPathResolver = (filename) => {
  return path.resolve(__dirname, "../uploads", filename);
};

const imageProcessor = (filename) => {
  const sourcePath = uploadPathResolver(filename);
  const resizeDestination = uploadPathResolver("resized-" + filename);
  const monochromeDestination = uploadPathResolver("monochrome" + filename);
  let resizeWorkerFinished = false;
  let monochromeWorkerFinished = false;

  return new Promise((resolve, reject) => {
    if (!isMainThread) {
      reject(new Error("not on main thread"));
    } else {
      try {
        const resizeWorker = Worker(pathToResizeWorker, {
          workerData: {
            source: sourcePath,
            destination: resizeDestination,
          },
        });
        const monochromeWorker = Worker(pathToMonochromeWorker, {
          workerData: {
            source: sourcePath,
            destination: monochromeDestination,
          },
        });
        resizeWorker.on("message", (message) => {
          resizeWorkerFinished = true;
          if (monochromeWorkerFinished)
            resolve("resizeWorker finished processing");
        });
        resizeWorker.on("error", (error) => {
          reject(new Error(error.message));
        });
        resizeWorker.on("exit", (code) => {
          if (code !== 0) reject(new Error("Exited with status code " + code));
        });
        monochromeWorker.on("message", (message) => {
          monochromeWorkerFinished = true;
          if (resizeWorkerFinished)
            resolve("monochromeWorker finished processing");
        });
        monochromeWorker.on("error", (error) => {
          reject(new Error(error.message));
        });
        monochromeWorker.on("exit", (code) => {
          if (code !== 0) reject(new Error("Exited with status code " + code));
        });
      } catch (error) {
        reject(error);
      }
    }
  });
};

module.exports = imageProcessor;
