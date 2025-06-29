document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const toggleCameraBtn = document.getElementById('toggle-camera-btn');
    const emotionResult = document.getElementById('emotion-result');
    const confidenceResult = document.getElementById('confidence-result');

    let currentStream = null;
    let facingMode = "user";

    function startCamera(){
        if (currentStream){
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                currentStream = stream;
                video.srcObject = stream;
            })
            .catch(function(err){
                console.error("Error al acceder a la camara: ", err);
                alert("No se pudo acceder a la camara. Asegurese de dar los permisos necesarios");
            });
    }

    captureBtn.addEventListener('click', function(){
        canvas.getContext('2d').drawImage(video, 0,0, canvas.width, canvas.height);
        const imageData= canvas.toDataURL('image/png');

        emotionResult.textContent = "Procesando...";
        confidenceResult.textContent = " ";

        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                emotionResult.textContent = "Error: " + data.error;
                confidenceResult.textContent = "";
            } else {
                emotionResult.textContent = "Emoción: " + data.label;
                confidenceResult.textContent = "Confianza: " + (data.confidence * 100).toFixed(2) + "%";
            }
        })
        .catch(error => {
            console.error("Error", error);
            emotionResult.textContent = "Error al procesar la imagen";
            confidenceResult.textContent = "";
        });
    });

    toggleCameraBtn.addEventListener('click', function() {
        facingMode = facingMode == "user" ? "environment" : "user";
        startCamera();
    });

    startCamera();
});