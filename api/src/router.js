const { Router } = require("express");
const multer = require("multer");
const { response, request } = require("../app");

const router = Router();

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "image/png") {
    req.fileValidationError = "Wrong file type";
    cb(null, false, new Error("Wrong file type"));
  } else {
    cb(null, true);
  }
};

const filename = (req, file, cb) => {
  cb(null, file.originalname);
};

const storage = multer.diskStorage({
  destination: "api/uploads/",
  filename,
});

const upload = multer({
  fileFilter,
  storage,
});

router.post("/upload", upload.single("photo"), (req, res) => {
  if (req.fileValidationError) {
    res.status(400).json({ error: req.fileValidationError });
  } else {
    res.status(201).json({ success: true });
  }
});

module.exports = router;
