document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const screens = document.querySelectorAll(".app-screen");
    const landingScreen = document.getElementById("landing-screen");
    const brandSelectionScreen = document.getElementById("brand-selection-screen");
    const vehicleDetailsScreen = document.getElementById("vehicle-details-screen");
    const customerDetailsScreen = document.getElementById("customer-details-screen");
    const pendingVehiclesScreen = document.getElementById("pending-vehicles-screen");
    const vehicleDetailScreen = document.getElementById("vehicle-detail-screen"); // New detail screen

    const btnNewVehicle = document.getElementById("btn-new-vehicle");
    const btnPendingVehicles = document.getElementById("btn-pending-vehicles");
    const brandLogoGrid = document.getElementById("brand-logo-grid");
    const vehicleDetailsForm = document.getElementById("vehicleDetailsForm");
    const customerDetailsForm = document.getElementById("customerDetailsForm");
    const pendingVehiclesContainer = document.getElementById("pending-vehicles-container");
    const vehicleDetailContent = document.getElementById("vehicle-detail-content"); // Content area for detail screen
    const selectedBrandInfoDiv = document.getElementById("selected-brand-info"); // To show selected brand/logo

    // --- Form Inputs (for convenience) ---
    // Vehicle Form
    const modeloInput = document.getElementById("modelo");
    const anioInput = document.getElementById("anio");
    const motorInput = document.getElementById("motor");
    const placasInput = document.getElementById("placas");
    const fotosInput = document.getElementById("fotos");

    // Customer Form
    const clienteInput = document.getElementById("cliente");
    const fallaTextarea = document.getElementById("falla");
    const diagnosticoTextarea = document.getElementById("diagnostico");

    // --- Data ---
    let modelosData = {}; // To store data from modelos.json
    let tempVehicleData = {}; // To store data during the multi-step registration

    // --- Marcas con sus logos ---
    const marcasConLogos = [
        { name: "Volkswagen", logo: "assets/logos/vw-logo.png" },
        { name: "Audi", logo: "assets/logos/audi-logo.png" },
        { name: "BMW", logo: "assets/logos/bmw-logo.png" },
        { name: "Mercedes-Benz", logo: "assets/logos/mercedes-logo.png" },
        { name: "Seat", logo: "assets/logos/seat-logo.png" },
        { name: "Porsche", logo: "assets/logos/porsche-logo.png" },
        { name: "Lamborghini", logo: "assets/logos/lamborghini-logo.png" },
        { name: "Bugatti", logo: "assets/logos/bugatti-logo.png" }
    ];

    // --- Google Apps Script Web App URL ---
    // PEGA AQUÍ LA URL QUE TE DIO GOOGLE APPS SCRIPT AL DESPLEGAR
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyYcd-ybvftY0GNrmQEJP_5vuUhoqTHnpl8hCyO85FlHdJrOj9aKL7T6l5Row-KiBSxA/exec';


    // --- Navigation Function ---
    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove("active");
        });
        document.getElementById(screenId).classList.add("active");
        // Scroll to top when changing screen
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- IndexedDB Setup and Operations ---
    const DB_NAME = 'RegistroTallerDB';
    const DB_VERSION = 1; // Increment this if you change object stores or indices
    const OBJECT_STORE_NAME = 'vehiculos'; // Our "table" for vehicles
    let db; // Variable to hold the database connection

    // Function to open or create the database
    function openDatabase() {
        return new Promise((resolve, reject) => {
            // Check if IndexedDB is supported
             if (!('indexedDB' in window)) {
                 console.error('IndexedDB no está soportado en este navegador.');
                 alert('IndexedDB no está soportado en este navegador. La persistencia de datos no funcionará.');
                 reject('IndexedDB not supported');
                 return;
             }


            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.errorCode, event.target.error);
                reject("Error opening IndexedDB");
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("IndexedDB opened successfully");
                resolve(db);
            };

            // This event is only triggered if the database version changes (new or incremented)
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create the object store if it doesn't exist
                if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
                    // Define keyPath: the unique identifier for each object.
                    // We'll use 'fechaIngreso' as it's generated uniquely per entry.
                    // autoIncrement: false (we provide the key via fechaIngreso)
                    const objectStore = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'fechaIngreso' });

                    // Optional: Create indexes for faster lookups (e.g., by brand, status)
                    // objectStore.createIndex('marca', 'marca', { unique: false });
                    // objectStore.createIndex('fechaEntrega', 'fechaEntrega', { unique: false }); // Can index for filtering delivered/pending
                     console.log("Object store 'vehiculos' created/upgraded.");
                }
                console.log("IndexedDB upgrade needed/completed");
            };
        });
    }

    // Function to add a vehicle to the database
    function addVehicleToDB(vehicle) {
        return new Promise((resolve, reject) => {
             if (!db) {
                 reject("IndexedDB not initialized.");
                 return;
             }
            // Need a readwrite transaction to add data
            const transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');

            transaction.onerror = (event) => {
                console.error("Add transaction error:", event.target.error);
                reject("Transaction error: " + event.target.error);
             }
            transaction.oncomplete = (event) => resolve(); // Transaction finished successfully

            const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
            const request = objectStore.add(vehicle); // Add the vehicle object

            request.onerror = (event) => {
                 console.error("Add request error:", event.target.error);
                 reject("Add request error: " + event.target.error);
             }
            request.onsuccess = (event) => console.log("Vehicle added to DB:", event.target.result); // Log the key
        });
    }

    // Function to get all vehicles from the database
    function getAllVehiclesFromDB() {
        return new Promise((resolve, reject) => {
            if (!db) {
                 reject("IndexedDB not initialized.");
                 return;
             }
            const transaction = db.transaction([OBJECT_STORE_NAME], 'readonly');

            transaction.onerror = (event) => {
                 console.error("GetAll transaction error:", event.target.error);
                 reject("Transaction error: " + event.target.error);
             }

            const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
            const request = objectStore.getAll(); // Get all objects

            request.onerror = (event) => {
                 console.error("getAll request error:", event.target.error);
                 reject("getAll request error: " + event.target.error);
             }
            request.onsuccess = (event) => {
                console.log("Vehicles retrieved from DB:", event.target.result);
                resolve(event.target.result); // Resolve with the array of vehicles
            };
        });
    }

     // Function to update a vehicle (e.g., mark as delivered)
    function updateVehicleInDB(vehicle) {
        return new Promise((resolve, reject) => {
             if (!db) {
                 reject("IndexedDB not initialized.");
                 return;
             }
            const transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
             transaction.onerror = (event) => {
                 console.error("Update transaction error:", event.target.error);
                 reject("Transaction error: " + event.target.error);
             }
            transaction.oncomplete = (event) => resolve();

            const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
             // Use .put() to add or update based on keyPath ('fechaIngreso')
            const request = objectStore.put(vehicle);

            request.onerror = (event) => {
                 console.error("Update request error:", event.target.error);
                 reject("Update request error: " + event.target.error);
             }
             request.onsuccess = (event) => console.log("Vehicle updated in DB:", event.target.result); // Log the key
        });
    }

     // Function to get a single vehicle by its key (fechaIngreso)
     function getVehicleFromDB(vehicleId) {
        return new Promise((resolve, reject) => {
            if (!db) {
                 reject("IndexedDB not initialized.");
                 return;
             }
            const transaction = db.transaction([OBJECT_STORE_NAME], 'readonly');
             transaction.onerror = (event) => {
                 console.error("Get single transaction error:", event.target.error);
                 reject("Transaction error: " + event.target.error);
             }

            const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
             const request = objectStore.get(vehicleId); // Get object by key

            request.onerror = (event) => {
                 console.error("Get single request error:", event.target.error);
                 reject("Get request error: " + event.target.error);
             }
            request.onsuccess = (event) => {
                 console.log("Single vehicle retrieved from DB:", event.target.result);
                 resolve(event.target.result);
            };
        });
     }


    // --- Data Handling Functions (Adapted for IndexedDB) ---
    async function loadModelosData() {
        try {
            // Fetching models.json requires serving via HTTP(S), not file://
            const response = await fetch('data/modelos.json');
            if (!response.ok) {
                // If fetch fails (e.g., due to CORS on file://), log a warning but don't crash
                console.warn(`HTTP error! status: ${response.status}. Could not load modelos.json. Ensure you are serving files over HTTP(S).`);
                modelosData = {}; // Fallback to empty object
                return; // Stop here if fetch failed
            }
            modelosData = await response.json();
            console.log("Modelos cargados:", modelosData); // Debugging
        } catch (error) {
            console.error("Error cargando modelos.json:", error);
            modelosData = {}; // Fallback
        }
    }

    async function getVehiculos() {
        // Now this function is async and gets data from IndexedDB
        if (!db) {
            // Attempt to open DB if not already open, but catch potential errors
             try {
                await openDatabase();
             } catch (e) {
                 console.error("Could not open database to get vehicles:", e);
                 return []; // Return empty array if DB fails to open
             }
        }
        try {
            return await getAllVehiclesFromDB();
        } catch (error) {
            console.error("Error getting vehicles:", error);
            return []; // Return empty array in case of error
        }
    }

    async function saveVehiculo(vehicle) { // Changed name to save a SINGLE vehicle
        if (!db) {
             // Attempt to open DB if not already open
             try {
                 await openDatabase();
              } catch (e) {
                  console.error("Could not open database to save vehicle:", e);
                   throw e; // Re-throw the error
              }
         }
         try {
            await addVehicleToDB(vehicle);
         } catch (error) {
             console.error("Error saving vehicle:", error);
             throw error; // Re-throw to be caught by form handler
         }
    }

     async function updateVehiculo(vehicle) { // New function to update a vehicle
        if (!db) {
             // Attempt to open DB if not already open
            try {
                await openDatabase();
            } catch (e) {
                 console.error("Could not open database to update vehicle:", e);
                 throw e; // Re-throw the error
            }
         }
         try {
             await updateVehicleInDB(vehicle);
         } catch (error) {
             console.error("Error updating vehicle:", error);
             throw error; // Re-throw
         }
     }

     async function getSingleVehicle(vehicleId) { // New function to get a single vehicle
         if (!db) {
              // Attempt to open DB if not already open
             try {
                 await openDatabase();
             } catch (e) {
                 console.error("Could not open database to get single vehicle:", e);
                 return null; // Return null if DB fails to open
             }
         }
          try {
             return await getVehicleFromDB(vehicleId);
          } catch (error) {
              console.error("Error getting single vehicle:", error);
              return null; // Return null in case of error
          }
     }


    // --- Convert File to Base64 (remains the same) ---
     async function fileToBase64(file) {
        return new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = (error) => {
                 console.error("Error reading file:", error);
                 rej(error); // Reject the promise on error
            };
            reader.readAsDataURL(file);
        });
    }


    // --- Rendering Functions (Adapted for Async Data) ---
    function renderBrandLogos() {
        brandLogoGrid.innerHTML = ''; // Clear current logos
        marcasConLogos.forEach(marca => {
            const logoItem = document.createElement("div");
            logoItem.classList.add("brand-logo-item");
            logoItem.innerHTML = `
                <img src="${marca.logo}" alt="${marca.name} Logo">
                <span>${marca.name}</span>
            `;
            logoItem.addEventListener('click', () => {
                // Store selected brand temporarily
                tempVehicleData = {}; // Clear temp data for new vehicle
                tempVehicleData.marca = marca.name;
                tempVehicleData.logo = marca.logo; // Also store logo path

                // Reset forms for new entry
                vehicleDetailsForm.reset();
                customerDetailsForm.reset();
                // Use value = '' for file inputs as .reset() might not clear selected files everywhere
                fotosInput.value = '';

                showScreen('vehicle-details-screen');
                // Display selected brand info on the next screen
                selectedBrandInfoDiv.innerHTML = `<img src="${tempVehicleData.logo}" alt="${tempVehicleData.marca} Logo"> ${tempVehicleData.marca}`;
            });
            brandLogoGrid.appendChild(logoItem);
        });
    }

    async function renderVehiculosPendientes() {
        // Now this function must be async
        const allVehiculos = await getVehiculos(); // Await the async function
        // Filter out vehicles that have a delivery date
        const pendingVehiculos = allVehiculos.filter(v => v.fechaEntrega === null); // Use explicit check for null

        pendingVehiclesContainer.innerHTML = ''; // Clear current list

        if (pendingVehiculos.length === 0) {
             pendingVehiclesContainer.innerHTML = '<p class="empty-message">No hay vehículos pendientes actualmente.</p>';
             return;
        }

        // Sort by date (most recent first)
        // Assuming fechaIngreso is a sortable string (like ISO 8601)
        pendingVehiculos.sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));

        pendingVehiculos.forEach(vehiculo => {
            const card = document.createElement("div");
            card.classList.add("vehicle-card");
            card.setAttribute('data-id', vehiculo.fechaIngreso); // Unique ID

             // Format date
             const fechaIngresoFormatted = new Date(vehiculo.fechaIngreso).toLocaleString('es-ES', {
                 year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });


            card.innerHTML = `
                <div class="card-header">
                    ${vehiculo.logo ? `<img src="${vehiculo.logo}" alt="${vehiculo.marca}" class="brand-logo">` : ''}
                    <h3>${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})</h3>
                </div>
                 <p><strong>Placas:</strong> ${vehiculo.placas}</p>
                 <p><strong>Cliente:</strong> ${vehiculo.cliente}</p>
                 ${vehiculo.motor ? `<p><strong>Motor:</strong> ${vehiculo.motor}</p>` : ''}
                <p class="description"><strong>Falla:</strong> ${vehiculo.falla}</p>

                ${vehiculo.fotos && vehiculo.fotos.length > 0 ?
                    `<div class="card-photos">
                         ${vehiculo.fotos.map(f => `<img src="${f}" alt="Foto del vehículo" loading="lazy">`).join("")}
                    </div>`
                    : ''
                }
                <div class="card-footer">
                    <p class="date">Ingreso: ${fechaIngresoFormatted}</p>
                </div>
            `;
            pendingVehiclesContainer.appendChild(card);

            // Add click listener to the card to show detail
             card.addEventListener('click', () => {
                 showVehicleDetail(vehiculo.fechaIngreso); // Pass the unique ID
             });
        });
    }

    // --- Show Detail of a Single Vehicle (Adapted for Async Data) ---
    async function showVehicleDetail(vehicleId) {
         const vehiculo = await getSingleVehicle(vehicleId); // Await fetching the single vehicle

         if (!vehiculo) {
             console.error("Vehículo no encontrado en la base de datos:", vehicleId);
             alert("Vehículo no encontrado.");
             renderVehiculosPendientes(); // Go back to list if not found
             showScreen('pending-vehicles-screen');
             return;
         }

         // Format dates
         const fechaIngresoFormatted = new Date(vehiculo.fechaIngreso).toLocaleString('es-ES', {
             year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
         });
          const fechaEntregaFormatted = vehiculo.fechaEntrega ? new Date(vehiculo.fechaEntrega).toLocaleString('es-ES', {
             year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
         }) : 'Pendiente';

         // Calculate profit if delivered (ensure cobrado/gastado are numbers)
         const cobradoNum = parseFloat(vehiculo.cobrado) || 0;
         const gastadoNum = parseFloat(vehiculo.gastado) || 0;
         const gananciaTotal = vehiculo.fechaEntrega !== null ? (cobradoNum - gastadoNum).toFixed(2) : null;


         vehicleDetailContent.innerHTML = `
            <div class="detail-header">
                ${vehiculo.logo ? `<img src="${vehiculo.logo}" alt="${vehiculo.marca}">` : ''}
                <h3>${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})</h3>
            </div>
            <p><strong>Placas:</strong> ${vehiculo.placas}</p>
            <p><strong>Cliente:</strong> ${vehiculo.cliente}</p>
            ${vehiculo.motor ? `<p><strong>Motor:</strong> ${vehiculo.motor}</p>` : ''}
            <p><strong>Fecha Ingreso:</strong> ${fechaIngresoFormatted}</p>
            <p><strong>Falla Reportada:</strong> ${vehiculo.falla}</p>
            ${vehiculo.diagnostico ? `<p><strong>Diagnóstico:</strong> ${vehiculo.diagnostico}</p>` : '<p><strong>Diagnóstico:</strong> Sin diagnóstico registrado.</p>'}

            ${vehiculo.fotos && vehiculo.fotos.length > 0 ?
                `<div class="detail-photos">
                    <strong>Fotos:</strong>
                    ${vehiculo.fotos.map(f => `<img src="${f}" alt="Foto del vehículo" loading="lazy">`).join("")}
                </div>`
                : ''
            }

            <p><strong>Estado:</strong> ${vehiculo.fechaEntrega ? 'Entregado' : 'Pendiente'}</p>

             ${vehiculo.fechaEntrega !== null ? // Check explicitly for null
                `<div class="financial-info">
                     <p><strong>Fecha Entrega:</strong> ${fechaEntregaFormatted}</p>
                     <p><strong>Cobrado:</strong> $${cobradoNum.toFixed(2)}</p>
                     <p><strong>Gastado:</strong> $${gastadoNum.toFixed(2)}</p>
                     <p><strong>Ganancia Total:</strong> <span style="color: ${gananciaTotal >= 0 ? '#28a745' : '#dc3545'};">$${gananciaTotal}</span></p>
                </div>`
                :
                `<button id="btn-mark-delivered" class="deliver-button">Marcar como Entregado</button>`
            }
         `;

         // Add event listener for the deliver button IF the vehicle is pending
         if (vehiculo.fechaEntrega === null) { // Check explicitly for null
            document.getElementById('btn-mark-delivered').addEventListener('click', () => {
                 markVehicleAsDelivered(vehiculo.fechaIngreso); // Pass the unique ID (using fechaIngreso as key)
            });
         }

         showScreen('vehicle-detail-screen');
    }


    // --- Mark Vehicle as Delivered Function (Adapted for Async Data) ---
    async function markVehicleAsDelivered(vehicleId) {
        // Fetch the specific vehicle to update from IndexedDB
        const vehicleToUpdate = await getSingleVehicle(vehicleId);

        if (vehicleToUpdate) {
            // Use prompts for simplicity as requested
            // Use parseFloat and || '' to handle potential non-numeric saved values or first-time input
            let cobradoInput = prompt(`Ingrese el monto cobrado por el vehículo ${vehicleToUpdate.marca} ${vehicleToUpdate.modelo}:`, (parseFloat(vehicleToUpdate.cobrado) || '').toString());
            let gastadoInput = prompt(`Ingrese el monto gastado en el vehículo ${vehicleToUpdate.marca} ${vehicleToUpdate.modelo}:`, (parseFloat(vehicleToUpdate.gastado) || '').toString());

            // Handle cancellation of prompts (if user clicks Cancel)
            if (cobradoInput === null || gastadoInput === null) {
                 alert("Registro de entrega cancelado.");
                 return; // Stop the process if user cancels any prompt
            }

            // Validate and parse input, default to 0 if parsing fails
            const cobrado = parseFloat(cobradoInput) || 0;
            const gastado = parseFloat(gastadoInput) || 0;
            const currentDateTimeISO = getFechaActualISO(); // Get current date/time for delivery


            // Update the vehicle object for IndexedDB
            vehicleToUpdate.fechaEntrega = currentDateTimeISO; // Set delivery date
            vehicleToUpdate.cobrado = cobrado;
            vehicleToUpdate.gastado = gastado;

            // Update the vehicle in IndexedDB
            try {
                await updateVehiculo(vehicleToUpdate); // Await the update in IndexedDB
                console.log(`Vehículo ${vehicleToUpdate.placas} marcado como entregado localmente.`); // Feedback

                // Go back to the pending list and re-render it
                // No need to await here as it's triggered by user action, not critical path
                renderVehiculosPendientes();
                showScreen('pending-vehicles-screen');
                alert(`Vehículo ${vehicleToUpdate.marca} ${vehicleToUpdate.modelo} marcado como entregado.`); // Final user feedback


                // --- AHORA: Enviar la ACTUALIZACIÓN de entrega/costos a Google Sheets ---
                 const updateDataToSheet = {
                     action: 'update_delivery_status', // <-- Indica al script que es una actualización
                     fechaIngreso: vehicleToUpdate.fechaIngreso, // Clave para buscar la fila en Sheets
                     // Puedes incluir otros identificadores si es necesario, como placas: vehicleToUpdate.placas,

                     // Enviar los datos actualizados de entrega/costos
                     fechaEntrega: vehicleToUpdate.fechaEntrega, // Fecha/hora ISO de entrega
                     cobrado: vehicleToUpdate.cobrado,
                     gastado: vehicleToUpdate.gastado,
                     // No necesitas enviar marca, modelo, falla, etc. aquí, solo los datos de actualización y el identificador.
                 };

                 console.log("Enviando actualización de entrega a Google Sheets:", updateDataToSheet);

                 try {
                     const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                          method: 'POST',
                          // Use 'no-cors' if your Apps Script is deployed with "Execute as: me, Who has access: Anyone"
                          // This prevents CORS errors but you won't be able to read the response body for success/error details.
                          // If you can deploy with "Execute as: me, Who has access: Anyone with Google account" AND the user is logged in,
                          // you MIGHT be able to use mode: 'cors' and read response.json()
                          mode: 'no-cors',
                          headers: { 'Content-Type': 'application/json' }, // Indica que envías JSON
                          body: JSON.stringify(updateDataToSheet) // Enviar los datos como string JSON
                     });
                     // En modo no-cors, response.ok es siempre true, y response.json() no es legible.
                     // Debes confiar en que la petición llegó o usar un método que permita leer la respuesta.
                     console.log("Petición de actualización de entrega enviada a Apps Script. Respuesta (si visible):", response);
                     // No hay un alert de éxito aquí porque el alert principal ya ocurrió después de guardar localmente.

                 } catch (sheetUpdateError) {
                     console.error("Error al enviar la actualización de entrega a Google Sheets:", sheetUpdateError);
                     alert("Error al enviar la actualización de entrega a Google Sheets.");
                 }


            } catch (indexedDBError) {
                console.error("Error al actualizar el vehículo en IndexedDB:", indexedDBError);
                alert("Ocurrió un error al marcar el vehículo como entregado localmente.");
                 // Stay on the detail screen or go back to pending list
                 showScreen('vehicle-detail-screen'); // Stay on detail screen after error?
            }

        } else {
            console.error("Error: No se encontró el vehículo para actualizar (ID: " + vehicleId + ")");
            alert("Error al marcar el vehículo como entregado. El vehículo no fue encontrado.");
            renderVehiculosPendientes();
            showScreen('pending-vehicles-screen');
        }
    }


    // --- Event Listeners ---
    btnNewVehicle.addEventListener('click', () => {
        renderBrandLogos(); // Render logos before showing brand selection
        showScreen('brand-selection-screen');
    });

    btnPendingVehicles.addEventListener('click', () => {
        renderVehiculosPendientes(); // Render pending list before showing screen (it's async now)
        showScreen('pending-vehicles-screen');
    });

     // Event listener for back buttons
     document.querySelectorAll('.btn-back').forEach(button => {
         button.addEventListener('click', () => {
             const targetScreenId = button.getAttribute('data-target');
             showScreen(targetScreenId);

             // Optional: Clear forms/data when going back in the flow
             if (targetScreenId === 'brand-selection-screen') {
                 // Clear forms and temp data when going back from vehicle details or customer details
                 vehicleDetailsForm.reset();
                 customerDetailsForm.reset();
                 fotosInput.value = ''; // Clear file input
                 tempVehicleData = {}; // Clear temporary data
                 selectedBrandInfoDiv.innerHTML = ''; // Clear brand info display
             } else if (targetScreenId === 'vehicle-details-screen') {
                 // Clear customer form if going back from there
                 customerDetailsForm.reset();
             } else if (targetScreenId === 'pending-vehicles-screen') {
                 // If going back from vehicle detail to pending list, re-render just in case
                 renderVehiculosPendientes(); // Ensure list is fresh
             } else if (targetScreenId === 'landing-screen') {
                 // Clear forms and temp data if going back from brand selection to landing
                 vehicleDetailsForm.reset();
                 customerDetailsForm.reset();
                 fotosInput.value = ''; // Clear file input
                 tempVehicleData = {};
                 selectedBrandInfoDiv.innerHTML = ''; // Clear brand info display
             }
         });
     });


    // --- Vehicle Details Form Submission ---
    vehicleDetailsForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Collect vehicle details from the form
        tempVehicleData.modelo = modeloInput.value.trim();
        tempVehicleData.anio = parseInt(anioInput.value);
        tempVehicleData.motor = motorInput.value.trim();
        tempVehicleData.placas = placasInput.value.trim().toUpperCase();

         // Process photos into Base64
        const fotosFiles = fotosInput.files;
        const fotosBase64 = [];
        if (fotosFiles.length > 0) {
             // Disable button and show message/spinner
             const submitButton = vehicleDetailsForm.querySelector('button[type="submit"]');
             const originalButtonText = submitButton.textContent;
             submitButton.textContent = 'Procesando fotos...';
             submitButton.disabled = true;
             submitButton.style.opacity = '0.7'; // Dim button

            try {
                const filePromises = [...fotosFiles].map(file => fileToBase64(file));
                const results = await Promise.all(filePromises);
                fotosBase64.push(...results);
            } catch (error) {
                 console.error("Error al procesar las fotos:", error);
                 alert("Hubo un error al cargar las imágenes.");
                 // Re-enable button and restore text on error
                 submitButton.textContent = originalButtonText;
                 submitButton.disabled = false;
                 submitButton.style.opacity = '1'; // Restore
                 return; // Stop submission
            } finally {
                // Always re-enable button and restore text after processing
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                 submitButton.style.opacity = '1'; // Restore
            }
        }
        tempVehicleData.fotos = fotosBase64;


        // Validate required fields (basic check, HTML5 handles most)
         if (!tempVehicleData.modelo || !tempVehicleData.anio || !tempVehicleData.placas) {
             alert("Por favor complete los campos obligatorios del vehículo: Modelo, Año, Placas.");
             return;
         }

        // Proceed to customer details screen
        showScreen('customer-details-screen');
    });

    // --- Customer Details Form Submission (Final Step) ---
    customerDetailsForm.addEventListener("submit", async (e) => {
         e.preventDefault();

         // Collect customer/issue details
         tempVehicleData.cliente = clienteInput.value.trim();
         tempVehicleData.falla = fallaTextarea.value.trim();
         tempVehicleData.diagnostico = diagnosticoTextarea.value.trim();

          // Validate required customer fields
         if (!tempVehicleData.cliente || !tempVehicleData.falla) {
             alert("Por favor complete los campos obligatorios del cliente y la falla.");
             return;
         }

         // Add final details before saving
         tempVehicleData.fechaIngreso = getFechaActualISO(); // Use ISO date as unique ID (IndexedDB key)
         tempVehicleData.fechaEntrega = null; // Initially not delivered
         tempVehicleData.cobrado = 0; // Initially 0
         tempVehicleData.gastado = 0; // Initially 0

         // --- Disable button and show message/spinner ---
         const submitButton = customerDetailsForm.querySelector('button[type="submit"]');
         const originalButtonText = submitButton.textContent;
         submitButton.textContent = 'Guardando Localmente...';
         submitButton.disabled = true;
         submitButton.style.opacity = '0.7'; // Dim button


         // --- Paso 1: Guardar en IndexedDB (persistente localmente) ---
         try {
             await saveVehiculo(tempVehicleData); // Save to IndexedDB
             console.log("Vehículo guardado localmente en IndexedDB.");


             // --- Paso 2: Enviar datos de REGISTRO INICIAL a Google Sheets ---
             // Prepara los datos a enviar (sin fotos grandes Base64)
             const dataToSendToSheet = {
                 action: 'add_new_vehicle', // Indica al script que es un nuevo registro
                 fechaIngreso: tempVehicleData.fechaIngreso, // Use this as a potential unique ID in Sheets
                 marca: tempVehicleData.marca,
                 logo: tempVehicleData.logo, // Send logo path if needed in Sheets/Apps Script
                 modelo: tempVehicleData.modelo,
                 anio: tempVehicleData.anio,
                 motor: tempVehicleData.motor,
                 placas: tempVehicleData.placas,
                 cliente: tempVehicleData.cliente,
                 falla: tempVehicleData.falla,
                 diagnostico: tempVehicleData.diagnostico,
                 // Solo enviar el número de fotos, NO las fotos Base64 completas
                 fotosCount: tempVehicleData.fotos ? tempVehicleData.fotos.length : 0,
                 fechaEntrega: tempVehicleData.fechaEntrega, // Still null here
                 cobrado: tempVehicleData.cobrado, // Still 0 here
                 gastado: tempVehicleData.gastado, // Still 0 here
             };

             console.log("Enviando registro inicial a Google Sheets:", dataToSendToSheet);
             submitButton.textContent = 'Enviando a Google Sheets...'; // Update message

             // --- Perform the fetch request to Google Apps Script ---
             try {
                 const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                     method: 'POST',
                     // Use 'no-cors' if your Apps Script is deployed with "Execute as: me, Who has access: Anyone"
                     // This prevents CORS errors but you won't be able to read the response body for success/error details.
                     // If you can deploy with "Execute as: me, Who has access: Anyone with Google account" AND the user is logged in,
                     // you MIGHT be able to use mode: 'cors' and read response.json()
                     mode: 'no-cors',
                     headers: {
                         // Content-Type is often ignored by Apps Script in 'no-cors' mode,
                         // but it's good practice to include it if sending JSON.
                         'Content-Type': 'application/json',
                     },
                     body: JSON.stringify(dataToSendToSheet) // Send the data as a JSON string
                 });

                 // In 'no-cors' mode, response.ok is always true, and response.json() is not readable.
                 // You cannot reliably check for success/failure here unless Apps Script sends back
                 // a simple text response and you use mode: 'cors' or a different deployment type.
                 console.log("Petición de registro inicial a Apps Script enviada. Respuesta (si visible):", response);
                 // Assume success for the alert if fetch didn't throw an error
                 alert("Vehículo registrado con éxito (localmente y enviado a Google Sheets)!");


             } catch (sheetError) {
                 console.error("Error al enviar datos a Google Sheets:", sheetError);
                 // Alert user that Sheet saving failed, but local save was ok
                 alert("Vehículo registrado localmente, pero hubo un error al enviarlo a Google Sheets. Revise la consola para detalles.");
                 // Note: Error handling here is limited by 'no-cors' mode.
             }


              // Reset forms and temporary data AFTER successful local save and attempt to send to Sheet
             vehicleDetailsForm.reset();
             customerDetailsForm.reset();
             fotosInput.value = ''; // Clear file input separately
             tempVehicleData = {};
             selectedBrandInfoDiv.innerHTML = ''; // Clear brand info display

             // Go back to the landing screen
             showScreen('landing-screen');

         } catch (indexedDBError) {
             console.error("Error saving vehicle to IndexedDB:", indexedDBError);
             alert("Ocurrió un error al guardar el vehículo localmente. No se pudo registrar.");
         } finally {
             // Always re-enable button and restore text after saving attempt
             submitButton.textContent = originalButtonText;
             submitButton.disabled = false;
             submitButton.style.opacity = '1'; // Restore
         }
    });


    // --- Initial setup ---
    async function init() {
        // Load models data (optional for current flow but good practice)
        loadModelosData(); // Note: Not awaiting this, runs in parallel

        // Open the database when the app starts
        try {
            await openDatabase();
            console.log("Database ready.");
        } catch (error) {
            console.error("Failed to open database:", error);
            alert("No se pudo inicializar la base de datos local. Los datos no se guardarán de forma persistente.");
        }

        // Start on the landing page
        showScreen('landing-screen');
    }

    // Start the application
    init();
});

// --- getFechaActualISO function (from utils/date.js - ensure it's loaded before main.js) ---
/*
function getFechaActualISO() {
    return new Date().toISOString();
}
*/
