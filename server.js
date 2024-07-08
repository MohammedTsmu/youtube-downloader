const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const iconv = require('iconv-lite');

const app = express();
const port = 3000;

ffmpeg.setFfmpegPath(ffmpegPath);

let zipCounter = 1;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const encodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, encodedName);
    }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/converted', express.static(path.join(__dirname, 'converted')));

app.post('/convert', upload.array('videos'), (req, res) => {
    const files = req.files;
    if (!files) {
        return res.status(400).send('No files uploaded.');
    }

    let convertedFiles = [];

    files.forEach(file => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const outputFilePath = `converted/${path.parse(originalName).name}.mp3`;

        ffmpeg(file.path)
            .toFormat('mp3')
            .on('end', () => {
                convertedFiles.push(outputFilePath);

                if (convertedFiles.length === files.length) {
                    const zipFileName = `converted_files_${zipCounter}.zip`;
                    const output = fs.createWriteStream(path.join(__dirname, 'converted', zipFileName));
                    const archive = archiver('zip', { zlib: { level: 9 } });

                    output.on('close', () => {
                        zipCounter++;
                        res.json({ success: true, message: 'Files converted successfully!', convertedFiles, zipFile: zipFileName });
                    });

                    archive.on('error', (err) => {
                        throw err;
                    });

                    archive.pipe(output);

                    convertedFiles.forEach(file => {
                        archive.file(path.join(__dirname, file), { name: path.basename(file) });
                    });

                    archive.finalize();
                }
            })
            .on('error', (err) => {
                console.error(err);
                res.status(500).send('Error converting file.');
            })
            .save(outputFilePath);
    });
});

app.get('/clear-uploads', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join('uploads', file), err => {
                if (err) throw err;
            });
        }
        res.send({ success: true, message: 'Uploads folder cleared.' });
    });
});

app.get('/clear-converted', (req, res) => {
    fs.readdir('converted', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join('converted', file), err => {
                if (err) throw err;
            });
        }
        res.send({ success: true, message: 'Converted folder cleared.' });
    });
});

app.get('/review-uploads', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            res.status(500).send('Error reading uploads folder.');
            return;
        }

        res.json({ success: true, files });
    });
});

app.get('/review-converted', (req, res) => {
    fs.readdir('converted', (err, files) => {
        if (err) {
            res.status(500).send('Error reading converted folder.');
            return;
        }

        res.json({ success: true, files });
    });
});

app.get('/delete-file', (req, res) => {
    const { folder, filename } = req.query;
    const filePath = path.join(__dirname, folder, decodeURIComponent(filename));

    fs.unlink(filePath, (err) => {
        if (err) {
            res.status(500).send('Error deleting file.');
            return;
        }
        res.send({ success: true, message: 'File deleted successfully.' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
