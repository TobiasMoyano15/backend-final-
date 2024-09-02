document.addEventListener('DOMContentLoaded', function () {
    const volverBtn = document.querySelector('#volverBtn');
    volverBtn.addEventListener('click', async () => {
        window.location.href = '/products';
    });

    // Función para manejar la carga de archivos
    const handleFileUpload = (formId, suffix) => {
        const form = document.getElementById(formId);

        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Evitar que el formulario se envíe de la manera tradicional
            const formData = new FormData(form);
            formData.append('suffix', suffix);

            const uid = document.getElementById('user-details').getAttribute('data-uid');

            try {
                // Hacer la petición al backend para subir el archivo
                const response = await fetch(`/api/users/${uid}/documents`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('Archivo subido correctamente');

                    // Verificar si el usuario ya puede ser actualizado a premium
                    const premiumStatusResponse = await fetch(`/api/users/${uid}/check-premium-status`, {
                        method: 'GET'
                    });

                    if (premiumStatusResponse.ok) {
                        const { needsUpgrade } = await premiumStatusResponse.json();
                        
                        // Si el usuario necesita ser actualizado a premium
                        if (needsUpgrade) {
                            const upgradeResponse = await fetch(`/api/users/upgrade-to-premium`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: uid })
                            });

                            if (upgradeResponse.ok) {
                                alert('¡Felicidades! Ahora eres un usuario premium.');
                            } else {
                                alert('No se pudo actualizar a premium, por favor intenta de nuevo.');
                            }
                        }
                    } else {
                        alert('Error al verificar el estado premium');
                    }
                } else {
                    const errorText = await response.text();
                    alert('El archivo no se subió: ' + errorText);
                }
            } catch (error) {
                console.error('Error al subir el archivo:', error);
                alert('El archivo no se subió');
            }
        });
    };

    // Manejar los formularios de carga de archivos con diferentes sufijos
    handleFileUpload('uploadProfileFiles', 'Profile');
    handleFileUpload('uploadProductsFiles', 'Product');
    handleFileUpload('uploadDocumentsFiles', 'Document');
    handleFileUpload('uploadId', 'Id');
    handleFileUpload('uploadAddressDocument', 'AddressDocument');
    handleFileUpload('uploadAccountStatusDocument', 'AccountStatusDocument');
});
