let events = [];
let currentFilter = 'all';

function loadEvents() {
    const stored = localStorage.getItem('heroStageEvents');
    if (stored) {
        events = JSON.parse(stored);
    } else {
        events = [
            {
                id: 1,
                category: "flags",
                title: "Capture du drapeau de la guilde des Ombres",
                date: "2025-01-10",
                description: "Utilisation stratégique de mon alter Glace pour immobiliser les gardes, puis Feu pour créer une diversion. Mission réussie avec mon équipe.",
                images: []
            },
            {
                id: 2,
                category: "arrests",
                title: "Arrestation d'un villain de rang B",
                date: "2025-01-12",
                description: "Intervention lors d'un braquage. J'ai utilisé mon alter Glace pour bloquer les issues et neutraliser le suspect sans violence excessive.",
                images: []
            }
        ];
    }
}

function saveEvents() {
    try {
        localStorage.setItem('heroStageEvents', JSON.stringify(events));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('⚠️ ATTENTION : Espace de stockage plein!\n\nVous avez trop d\'images uploadées. Solutions:\n\n1. Utilisez des URLs Imgur au lieu d\'uploader des fichiers\n2. Supprimez des anciennes actions\n3. Exportez vos données (voir ci-dessous)');
            console.error('Stockage plein. Nombre d\'événements:', events.length);
        } else {
            console.error('Erreur de sauvegarde:', e);
        }
    }
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function updateStats() {
    const flagCount = events.filter(e => e.category === 'flags').length;
    const arrestCount = events.filter(e => e.category === 'arrests').length;
    const otherCount = events.filter(e => e.category === 'other').length;
    
    document.getElementById('flagCount').textContent = flagCount;
    document.getElementById('arrestCount').textContent = arrestCount;
    document.getElementById('otherCount').textContent = otherCount;
}

function getCategoryLabel(category) {
    const labels = {
        flags: '🚩 Capture de Drapeau',
        arrests: '👮 Arrestation',
        other: '⭐ Autre Action'
    };
    return labels[category] || category;
}

function getCategoryClass(category) {
    return `category-${category}`;
}

function createCarousel(images, eventId) {
    if (!images || images.length === 0) return '';
    
    if (images.length === 1) {
        return `<img src="${images[0]}" alt="Image" class="timeline-image">`;
    }
    
    return `
        <div class="carousel-container">
            <div class="carousel" id="carousel-${eventId}">
                <div class="carousel-images" id="carousel-images-${eventId}">
                    ${images.map(img => `<img src="${img}" alt="Image" class="carousel-image">`).join('')}
                </div>
                <button class="carousel-button prev" onclick="moveCarousel(${eventId}, -1)">‹</button>
                <button class="carousel-button next" onclick="moveCarousel(${eventId}, 1)">›</button>
            </div>
            <div class="carousel-dots" id="carousel-dots-${eventId}">
                ${images.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${eventId}, ${i})"></span>`).join('')}
            </div>
        </div>
    `;
}

function displayTimeline(category, containerId) {
    const container = document.getElementById(containerId);
    const filteredEvents = events.filter(e => e.category === category);
    const sortedEvents = filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedEvents.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: white; padding: 40px; font-size: 1.2em;">Aucune action enregistrée dans cette catégorie.</div>';
        return;
    }
    
    container.innerHTML = sortedEvents.map(event => `
        <div class="timeline-item">
            <div class="timeline-content">
                <div class="timeline-category ${getCategoryClass(event.category)}">${getCategoryLabel(event.category)}</div>
                <div class="timeline-date">${formatDate(event.date)}</div>
                <h3 class="timeline-title">${event.title}</h3>
                ${createCarousel(event.images, event.id)}
                <p class="timeline-description">${event.description}</p>
            </div>
        </div>
    `).join('');
    
    sortedEvents.forEach(event => {
        if (event.images && event.images.length > 1) {
            window[`carouselIndex_${event.id}`] = 0;
        }
    });
}

function displayAllTimelines() {
    displayTimeline('flags', 'flagsTimeline');
    displayTimeline('arrests', 'arrestsTimeline');
    displayTimeline('other', 'otherTimeline');
    updateStats();
}

function moveCarousel(eventId, direction) {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.images || event.images.length <= 1) return;
    
    let currentIndex = window[`carouselIndex_${eventId}`] || 0;
    currentIndex += direction;
    
    if (currentIndex < 0) currentIndex = event.images.length - 1;
    if (currentIndex >= event.images.length) currentIndex = 0;
    
    window[`carouselIndex_${eventId}`] = currentIndex;
    updateCarousel(eventId, currentIndex);
}

function goToSlide(eventId, index) {
    window[`carouselIndex_${eventId}`] = index;
    updateCarousel(eventId, index);
}

function updateCarousel(eventId, index) {
    const carouselImages = document.getElementById(`carousel-images-${eventId}`);
    const dots = document.querySelectorAll(`#carousel-dots-${eventId} .carousel-dot`);
    
    if (carouselImages) {
        carouselImages.style.transform = `translateX(-${index * 100}%)`;
    }
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function displayEventsList() {
    const container = document.getElementById('eventsList');
    let filteredEvents = currentFilter === 'all' ? events : events.filter(e => e.category === currentFilter);
    const sortedEvents = filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedEvents.map(event => `
        <div class="event-item">
            <div class="event-item-info">
                <h3>${event.title}</h3>
                <p>${getCategoryLabel(event.category)} - ${formatDate(event.date)} - ${event.images ? event.images.length : 0} image(s)</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="edit-button" onclick="editEvent(${event.id})">Modifier</button>
                <button class="delete-button" onclick="deleteEvent(${event.id})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

function filterEvents(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    displayEventsList();
}

function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('fr-FR', options);
}

function addUrlInput() {
    const container = document.getElementById('urlInputs');
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'url-input';
    newInput.placeholder = `URL image ${container.children.length + 1}`;
    container.appendChild(newInput);
}

function convertImgurUrl(url) {
    if (!url) return url;
    
    url = url.trim();
    
    if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
        const match = url.match(/imgur\.com\/([a-zA-Z0-9]+)/);
        if (match) {
            const id = match[1];
            return `https://i.imgur.com/${id}.png`;
        }
    }
    
    if (url.includes('i.imgur.com') && !url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return url + '.png';
    }
    
    return url;
}

function testImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ success: true, url });
        img.onerror = () => {
            if (url.endsWith('.png')) {
                const jpgUrl = url.replace('.png', '.jpg');
                const img2 = new Image();
                img2.onload = () => resolve({ success: true, url: jpgUrl });
                img2.onerror = () => {
                    const gifUrl = url.replace('.jpg', '.gif');
                    const img3 = new Image();
                    img3.onload = () => resolve({ success: true, url: gifUrl });
                    img3.onerror = () => resolve({ success: false, url });
                    img3.src = gifUrl;
                };
                img2.src = jpgUrl;
            } else {
                resolve({ success: false, url });
            }
        };
        img.src = url;
    });
}

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('eventImageFiles');
    const urlInputs = document.querySelectorAll('.url-input');
    const images = [];
    const editId = document.getElementById('editEventId').value;
    
    urlInputs.forEach(input => {
        if (input.value.trim()) {
            const convertedUrl = convertImgurUrl(input.value.trim());
            images.push(convertedUrl);
        }
    });
    
    if (editId) {
        const eventIndex = events.findIndex(e => e.id === parseInt(editId));
        if (eventIndex !== -1) {
            events[eventIndex].category = document.getElementById('eventCategory').value;
            events[eventIndex].title = document.getElementById('eventTitle').value;
            events[eventIndex].date = document.getElementById('eventDate').value;
            events[eventIndex].description = document.getElementById('eventDescription').value;
            
            if (fileInput.files && fileInput.files.length > 0) {
                let filesProcessed = 0;
                const totalFiles = fileInput.files.length;
                const newImages = [...images];
                
                Array.from(fileInput.files).forEach(async file => {
                    const compressedImage = await compressImage(file);
                    newImages.push(compressedImage);
                    filesProcessed++;
                    
                    if (filesProcessed === totalFiles) {
                        events[eventIndex].images = newImages;
                        saveEvents();
                        displayAllTimelines();
                        displayEventsList();
                        resetForm();
                        alert('Action modifiée avec succès !');
                    }
                });
            } else {
                events[eventIndex].images = images.length > 0 ? images : events[eventIndex].images;
                saveEvents();
                displayAllTimelines();
                displayEventsList();
                resetForm();
                alert('Action modifiée avec succès !');
            }
        }
    } else {
        const newEvent = {
            id: Date.now(),
            category: document.getElementById('eventCategory').value,
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            description: document.getElementById('eventDescription').value,
            images: images
        };

        if (fileInput.files && fileInput.files.length > 0) {
            let filesProcessed = 0;
            const totalFiles = fileInput.files.length;
            
            Array.from(fileInput.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    newEvent.images.push(e.target.result);
                    filesProcessed++;
                    
                    if (filesProcessed === totalFiles) {
                        events.push(newEvent);
                        saveEvents();
                        displayAllTimelines();
                        displayEventsList();
                        resetForm();
                        alert('Action ajoutée avec succès !');
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            events.push(newEvent);
            saveEvents();
            displayAllTimelines();
            displayEventsList();
            resetForm();
            alert('Action ajoutée avec succès !');
        }
    }
});

document.getElementById('eventImageFiles').addEventListener('change', async function(e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '<div style="color: #7e22ce; font-weight: 600; margin-bottom: 10px;">⏳ Compression des images...</div>';
    
    const previews = [];
    for (const file of Array.from(e.target.files)) {
        const compressed = await compressImage(file);
        const img = document.createElement('img');
        img.src = compressed;
        img.className = 'preview-image';
        previews.push(img);
    }
    
    preview.innerHTML = '';
    previews.forEach(img => preview.appendChild(img));
});

const urlInputsContainer = document.getElementById('urlInputs');
urlInputsContainer.addEventListener('input', async function(e) {
    if (e.target.classList.contains('url-input')) {
        const url = e.target.value.trim();
        if (url) {
            const convertedUrl = convertImgurUrl(url);
            
            const existingMsg = e.target.parentElement.querySelector('.url-message');
            if (existingMsg) existingMsg.remove();
            
            const testResult = await testImageUrl(convertedUrl);
            
            const msg = document.createElement('div');
            msg.className = 'url-message';
            msg.style.cssText = 'font-size: 0.85em; margin-top: 5px; font-weight: 600;';
            
            if (testResult.success) {
                msg.style.color = '#10b981';
                msg.textContent = '✓ Image valide';
                e.target.value = testResult.url;
            } else {
                msg.style.color = '#ef4444';
                msg.textContent = '✗ Image introuvable - Vérifiez le lien';
            }
            
            e.target.parentElement.appendChild(msg);
        }
    }
});

function deleteEvent(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
        events = events.filter(e => e.id !== id);
        saveEvents();
        displayAllTimelines();
        displayEventsList();
    }
}

function editEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    document.getElementById('editEventId').value = event.id;
    document.getElementById('eventCategory').value = event.category;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventDescription').value = event.description;
    
    const urlContainer = document.getElementById('urlInputs');
    urlContainer.innerHTML = '';
    if (event.images && event.images.length > 0) {
        event.images.forEach((img, index) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'url-input';
            input.value = img;
            input.placeholder = `URL image ${index + 1}`;
            urlContainer.appendChild(input);
        });
    } else {
        urlContainer.innerHTML = '<input type="text" class="url-input" placeholder="URL image 1">';
    }
    
    document.getElementById('formTitle').textContent = 'Modifier l\'action';
    document.getElementById('submitButton').textContent = 'Sauvegarder les modifications';
    document.getElementById('cancelButton').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    document.getElementById('eventForm').reset();
    document.getElementById('editEventId').value = '';
    document.getElementById('urlInputs').innerHTML = '<input type="text" class="url-input" placeholder="URL image 1">';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('formTitle').textContent = 'Ajouter une Action';
    document.getElementById('submitButton').textContent = 'Ajouter l\'action';
    document.getElementById('cancelButton').style.display = 'none';
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

loadEvents();
displayAllTimelines();
displayEventsList();