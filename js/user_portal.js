// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDB40DNXp8S6bxXmPl0Ft-Y6E_qIRhUkgE",
  authDomain: "library-fb0b6.firebaseapp.com",
  projectId: "library-fb0b6",
  storageBucket: "library-fb0b6.firebasestorage.app",
  messagingSenderId: "374487333649",
  appId: "1:374487333649:web:83f5de2a3b05243242aab0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Ensure all modals are hidden on page load dont know why this is happening help me
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
});

// --- Auth & Welcome ---
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = 'user_login.html';
  else {
    document.getElementById('userWelcome').textContent = `Welcome, ${user.email}!`;
    loadAllBooks();
    loadMyBooks(user.uid);
    loadPendingBooks(user.uid);
  }
});

function logoutUser() {
  auth.signOut().then(() => window.location.href = 'user_login.html');
}

// --- Navigation ---
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-link, .content-section').forEach(el => el.classList.remove('active'));
      link.classList.add('active');
      const section = document.getElementById(link.dataset.section);
      if (section) section.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
});

// --- Load Books ---
function loadAllBooks() {
  const container = document.getElementById('allBooksList');
  container.innerHTML = '';
  db.collection('books').where('status', '==', 'approved').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const book = doc.data();
        const div = document.createElement('div');
        div.classList.add('book-item');
        const statusText = book.available ? 'Available' : 'Checked Out';
        div.innerHTML = `
          <p>"${book.title}" - ${book.author}</p>
          <p>Status: ${statusText}</p>
          <button onclick="openBookDetails('${doc.id}')">View Details</button>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => console.error("Error loading books:", err));
}

function loadMyBooks(uid) {
  const container = document.getElementById('myUploadedBooks');
  container.innerHTML = '';
  db.collection('books').where('uploaderId', '==', uid).get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const book = doc.data();
        const div = document.createElement('div');
        div.classList.add('book-item');
        const statusText = book.status === 'pending' ? 'Pending Approval' :
                           book.available ? 'Available' : 'Checked Out';
        div.innerHTML = `
          <p>"${book.title}" - ${book.author}</p>
          <p>Status: ${statusText}</p>
          <button onclick="openBookDetails('${doc.id}')">View Details</button>
          <button onclick="editBook('${doc.id}')">Edit</button>
          <button onclick="deleteBook('${doc.id}')">Delete</button>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => console.error("Error loading user books:", err));
}

function loadPendingBooks(uid) {
  const container = document.getElementById('pendingBooksList');
  container.innerHTML = '';
  db.collection('books')
    .where('uploaderId', '==', uid)
    .where('status', '==', 'pending')
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const book = doc.data();
        const div = document.createElement('div');
        div.classList.add('book-item');
        div.innerHTML = `
          <p>"${book.title}" - ${book.author}</p>
          <p>Status: Pending Approval</p>
          <button onclick="openBookDetails('${doc.id}')">View Details</button>
          <button onclick="editBook('${doc.id}')">Edit</button>
          <button onclick="deleteBook('${doc.id}')">Delete</button>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => console.error("Error loading pending books:", err));
}

// --- Add/Edit/Delete Books ---
document.getElementById('uploadBookForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in!");

  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const desc = document.getElementById('bookDescription').value.trim();
  const genre = document.getElementById('bookGenre').value.trim();
  const pdfUrl = document.getElementById('bookPDF').value.trim();

  if (!title || !author) return alert("Fill all required fields!");

  db.collection('books').add({
    title,
    author,
    description: desc,
    genre,
    pdf: pdfUrl,
    uploaderId: user.uid,
    uploaderEmail: user.email,
    status: 'pending',
    available: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Book submitted for admin approval!");
    e.target.reset();
    loadPendingBooks(user.uid);
  }).catch(err => console.error("Error submitting book:", err));
});

function deleteBook(bookId) {
  const user = auth.currentUser;
  db.collection('books').doc(bookId).get().then(doc => {
    if (!doc.exists) return alert("Book not found.");
    const book = doc.data();

    // Ensure the user owns this book
    if (book.uploaderId !== user.uid) return alert("You can only delete your own books!");

    // Confirm deletion
    const confirmDelete = confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    // Delete from Firestore
    db.collection('books').doc(bookId).delete()
      .then(() => {
        alert(`"${book.title}" has been deleted successfully!`);
        // Reload lists
        loadAllBooks();
        loadMyBooks(user.uid);
        loadPendingBooks(user.uid);
      })
      .catch(err => {
        console.error("Error deleting book:", err);
        alert("An error occurred while deleting the book.");
      });
  }).catch(err => console.error("Error fetching book:", err));
}

function editBook(bookId) {
  const user = auth.currentUser;
  db.collection('books').doc(bookId).get().then(doc => {
    if (!doc.exists) return alert("Book not found");
    const book = doc.data();

    // Check if user is uploader or admin
    db.collection('users').doc(user.uid).get().then(userDoc => {
      const role = userDoc.exists ? userDoc.data().role : '';
      if (book.uploaderId !== user.uid && role !== 'admin') {
        return alert("You can only edit your own books or must be an admin!");
      }

      // Sequential prompts for all fields
      const newTitle = prompt("Enter new title:", book.title);
      if (newTitle === null) return;
      const newAuthor = prompt("Enter new author:", book.author);
      if (newAuthor === null) return;
      const newGenre = prompt("Enter new genre:", book.genre || '');
      if (newGenre === null) return;
      const newPDF = prompt("Enter new PDF URL (optional):", book.pdf || '');
      if (newPDF === null) return;
      const newDescription = prompt("Enter new description:", book.description || '');
      if (newDescription === null) return;

      db.collection('books').doc(bookId).update({
        title: newTitle,
        author: newAuthor,
        genre: newGenre,
        pdf: newPDF,
        description: newDescription
      }).then(() => {
        alert("Book updated successfully!");
        loadAllBooks();
        loadMyBooks(user.uid);
        loadPendingBooks(user.uid);

        // If modal is open, update its content immediately
        if (document.getElementById('bookDetailsModal').style.display === 'block') {
          document.getElementById('detailBookTitle').textContent = newTitle;
          document.getElementById('detailBookAuthor').textContent = newAuthor;
          document.getElementById('detailBookGenre').textContent = newGenre;
          document.getElementById('detailBookPDF').textContent = newPDF;
          document.getElementById('detailBookDescription').textContent = newDescription;
        }
      }).catch(err => console.error("Error updating book:", err));
    });

  }).catch(err => console.error("Error fetching book:", err));
}

// --- Book Details Modal ---
function openBookDetails(bookId) {
  const modal = document.getElementById('bookDetailsModal');
  db.collection('books').doc(bookId).get().then(doc => {
    const book = doc.data();
    if (!book) return;

    document.getElementById('detailBookTitle').textContent = book.title;
    document.getElementById('detailBookAuthor').textContent = book.author;
    document.getElementById('detailBookGenre').textContent = book.genre || '';
    document.getElementById('detailBookPDF').textContent = book.pdf ? book.pdf : 'N/A';
    document.getElementById('detailBookDescription').textContent = book.description || '';
    document.getElementById('detailBookUploader').textContent = book.uploaderEmail;
    const statusText = book.status === 'pending' ? 'Pending Approval' :
                       book.available ? 'Available' : 'Checked Out';
    document.getElementById('detailBookStatus').textContent = statusText;

    modal.style.display = 'block';
  }).catch(err => console.error("Error loading book details:", err));
}

// Close modal
document.querySelectorAll('.modal .close').forEach(btn => {
  btn.onclick = () => btn.closest('.modal').style.display = 'none';
});

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('bookDetailsModal');
  if (event.target === modal) modal.style.display = "none";
};
