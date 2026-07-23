const photos = [
    {
        image: "images/photo1.jpg",
        title: "Sunset Beach",
        description: "This photo was taken at Kovalam Beach during sunset."
    },
    {
        image: "images/photo2.jpg",
        title: "Mountain View",
        description: "Beautiful mountains during my vacation."
    },
    {
        image: "images/photo3.jpg",
        title: "Green Forest",
        description: "A peaceful forest with beautiful greenery."
    },
    {
        image: "images/photo4.jpg",
        title: "City Lights",
        description: "The city glowing beautifully at night."
    }
];

let currentPhoto = 0;

function updatePhoto() {
    document.getElementById("photo").src = photos[currentPhoto].image;
    document.getElementById("title").textContent = photos[currentPhoto].title;
    document.getElementById("description").textContent = photos[currentPhoto].description;
}

function showPhoto() {
    currentPhoto = (currentPhoto + 1) % photos.length;
    updatePhoto();
}

function previousPhoto() {
    currentPhoto = (currentPhoto - 1 + photos.length) % photos.length;
    updatePhoto();
}