document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.container').forEach(c => c.style.display = 'none');
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });

    document.getElementById('downloadLocation').addEventListener('change', function () {
        if (this.value === 'custom') {
            document.getElementById('customLocation').style.display = 'block';
        } else {
            document.getElementById('customLocation').style.display = 'none';
        }
    });

    document.getElementById('downloadForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const url = document.getElementById('youtubeUrl').value;
        const quality = document.getElementById('quality').value;
        const location = document.getElementById('downloadLocation').value;
        const customLocation = document.getElementById('customLocation').value;

        if (!url) {
            $.notify("Please enter a YouTube URL", "error");
            return;
        }

        const downloadInfo = {
            url,
            quality,
            location,
            customLocation
        };

        document.getElementById('downloadLoader').style.display = 'block';
        $.notify("Downloading video...", "info");

        fetch('/download-youtube', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(downloadInfo)
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById('downloadLoader').style.display = 'none';
                if (data.success) {
                    $.notify(data.message, "success");
                    document.getElementById('downloadOutput').style.display = 'block';
                    document.getElementById('downloadOutput').innerHTML = `<a href="${data.filePath}" download>Download File</a>`;
                } else {
                    $.notify("Error during download", "error");
                }
            })
            .catch(error => {
                document.getElementById('downloadLoader').style.display = 'none';
                $.notify("Error during download", "error");
                console.error('Error:', error);
            });
    });
});
