document.addEventListener('DOMContentLoaded', function () {
    reviewFolder('uploads');
    reviewFolder('converted');
});

function reviewFolder(folder) {
    fetch(`/review-${folder}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const fileList = data.files.map((file, index) => {
                    return `<li>${index + 1}. ${file} <a href="/${folder}/${file}" download>Download</a> <button class="delete-file" data-folder="${folder}" data-filename="${file}">Delete</button></li>`;
                }).join('');
                document.getElementById(`output-${folder}`).innerHTML = `
            <h2>${folder.charAt(0).toUpperCase() + folder.slice(1)} Folder</h2>
            <ul class="file-list">${fileList}</ul>`;

                document.querySelectorAll('.delete-file').forEach(button => {
                    button.addEventListener('click', function () {
                        const folder = this.getAttribute('data-folder');
                        const filename = this.getAttribute('data-filename');
                        fetch(`/delete-file?folder=${folder}&filename=${encodeURIComponent(filename)}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    $.notify(data.message, "success");
                                    this.parentElement.remove();
                                } else {
                                    $.notify("Error deleting file.", "error");
                                }
                            })
                            .catch(error => {
                                $.notify("Error deleting file.", "error");
                                console.error('Error:', error);
                            });
                    });
                });
            } else {
                $.notify(`Error reviewing ${folder} folder.`, "error");
            }
        })
        .catch(error => {
            $.notify(`Error reviewing ${folder} folder.`, "error");
            console.error('Error:', error);
        });
}

document.getElementById('uploadForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const files = document.getElementById('fileInput').files;
    if (files.length === 0) {
        $.notify("No files selected!", "error");
        return;
    }

    document.getElementById('loader').style.display = 'block';
    $.notify("Uploading files...", "info");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('videos', files[i]);
    }

    fetch('/convert', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('loader').style.display = 'none';
            if (data.success) {
                document.getElementById('output').style.display = 'block';
                const fileList = data.convertedFiles.map((file, index) => {
                    const fileName = file.split('/').pop();
                    return `<li>${index + 1}. <a href="${file}" download>${fileName}</a> <button class="delete-file" data-folder="converted" data-filename="${fileName}">Delete</button></li>`;
                }).join('');
                document.getElementById('output').innerHTML = `
          <ul class="file-list">${fileList}</ul>
          <button id="downloadAll" class="download-all-btn"><i class="fas fa-folder-open"></i> Download All</button>`;
                $.notify(data.message, "success");

                document.getElementById('downloadAll').addEventListener('click', () => {
                    const link = document.createElement('a');
                    link.href = `/converted/${data.zipFile}`;
                    link.download = data.zipFile;
                    link.click();
                });

                document.querySelectorAll('.delete-file').forEach(button => {
                    button.addEventListener('click', function () {
                        const folder = this.getAttribute('data-folder');
                        const filename = this.getAttribute('data-filename');
                        fetch(`/delete-file?folder=${folder}&filename=${encodeURIComponent(filename)}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    $.notify(data.message, "success");
                                    this.parentElement.remove();
                                } else {
                                    $.notify("Error deleting file.", "error");
                                }
                            })
                            .catch(error => {
                                $.notify("Error deleting file.", "error");
                                console.error('Error:', error);
                            });
                    });
                });
            } else {
                $.notify("Error during conversion!", "error");
            }
        })
        .catch(error => {
            document.getElementById('loader').style.display = 'none';
            $.notify("Error during conversion!", "error");
            console.error('Error:', error);
        });
});

document.getElementById('clearUploads').addEventListener('click', function () {
    fetch('/clear-uploads')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                $.notify(data.message, "success");
                document.getElementById('output-uploads').innerHTML = '';
            } else {
                $.notify("Error clearing uploads folder.", "error");
            }
        })
        .catch(error => {
            $.notify("Error clearing uploads folder.", "error");
            console.error('Error:', error);
        });
});

document.getElementById('clearConverted').addEventListener('click', function () {
    fetch('/clear-converted')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                $.notify(data.message, "success");
                document.getElementById('output-converted').innerHTML = '';
            } else {
                $.notify("Error clearing converted folder.", "error");
            }
        })
        .catch(error => {
            $.notify("Error clearing converted folder.", "error");
            console.error('Error:', error);
        });
});

document.getElementById('reviewUploads').addEventListener('click', function () {
    reviewFolder('uploads');
});

document.getElementById('reviewConverted').addEventListener('click', function () {
    reviewFolder('converted');
});

document.getElementById('scrollToTop').addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
