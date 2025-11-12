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

// Ensure all modals are hidden initially
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
});

// --- Auth & Welcome ---
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = 'admin_login.html';
  else {
    const adminWelcome = document.getElementById('adminWelcome');
    if (adminWelcome) adminWelcome.textContent = `Welcome, ${user.email}!`;

    loadStats();
    loadPendingBooks();
    loadAllBooks();
    loadUsers();
  }
});

function adminLogout() {
  localStorage.removeItem('adminLoggedIn');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = 'admin_login.html';
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

// --- Load Dashboard Stats ---
function loadStats() {
  db.collection('books').get().then(snap => {
    document.getElementById('totalBooks').textContent = snap.size;
  });
  db.collection('books').where('status', '==', 'pending').get().then(snap => {
    document.getElementById('pendingBooks').textContent = snap.size;
  });
  db.collection('users').get().then(snap => {
    document.getElementById('totalUsers').textContent = snap.size;
  });
  document.getElementById('todayActivity').textContent = 'N/A';
}

// --- Load Pending Books ---
function loadPendingBooks() {
  const container = document.getElementById('pendingBooksList');
  container.innerHTML = '';
  db.collection('books').where('status', '==', 'pending').get().then(snap => {
    snap.forEach(doc => {
      const book = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <p>"${book.title}" - ${book.author}</p>
        <button onclick="openApprovalModal('${doc.id}')">View / Approve</button>
      `;
      container.appendChild(div);
    });
  });
}

// --- Load All Books ---
function loadAllBooks() {
  const container = document.getElementById('allBooksList');
  container.innerHTML = '';
  db.collection('books').get().then(snap => {
    snap.forEach(doc => {
      const book = doc.data();
      const statusText = book.status === 'pending' ? 'Pending' : book.available ? 'Available' : 'Checked Out';
      const div = document.createElement('div');
      div.innerHTML = `
        <p>"${book.title}" - ${book.author}</p>
        <p>Status: ${statusText}</p>
        <button onclick="openApprovalModal('${doc.id}')">View / Edit</button>
        <button onclick="deleteBook('${doc.id}')">Delete</button>
      `;
      container.appendChild(div);
    });
  });
}

// --- Delete Book ---
function deleteBook(bookId) {
  if (!confirm("Are you sure you want to delete this book?")) return;

  db.collection('books').doc(bookId).delete().then(() => {
    alert("Book deleted successfully!");
    loadAllBooks();       // reload all books after deletion
    loadPendingBooks();   // reload pending books just in case
  });
}

// --- Load Users ---
function loadUsers(searchTerm = '') {
  const container = document.getElementById('usersList');
  container.innerHTML = '';

  db.collection('users').get().then(snapshot => {
    snapshot.forEach(doc => {
      const user = doc.data();
      const userName = user.name.toLowerCase();
      const userEmail = user.email.toLowerCase();
      const term = searchTerm.toLowerCase();

      if (term && !userName.includes(term) && !userEmail.includes(term)) return;

      const div = document.createElement('div');
      div.innerHTML = `
        <p>${user.name} (${user.email})</p>
        <p>Role: ${user.role || 'N/A'}</p>
        <p>Status: ${user.status || 'Active'}</p>
        <button onclick="openUserModal('${doc.id}')">Manage</button>
      `;
      container.appendChild(div);
    });
  });
}

// --- Approval Modal ---
function openApprovalModal(bookId) {
  const modal = document.getElementById('approvalModal');
  db.collection('books').doc(bookId).get().then(doc => {
    const book = doc.data();
    if (!book) return;

    const details = modal.querySelector('#approvalBookDetails');
    details.innerHTML = `
      <p><strong>Title:</strong> ${book.title}</p>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Genre:</strong> ${book.genre || 'N/A'}</p>
      <p><strong>Description:</strong> ${book.description || 'N/A'}</p>
      <p><strong>PDF:</strong> ${book.pdf ? `<a href="${book.pdf}" target="_blank">View PDF</a>` : 'N/A'}</p>
      <p><strong>Status:</strong> ${book.status}</p>
    `;

    modal.querySelector('#finalApproveBtn').onclick = () => {
      db.collection('books').doc(bookId).update({ status: 'approved' }).then(() => {
        closeModal(modal);
        loadPendingBooks();
        loadAllBooks();
      });
    };
    modal.querySelector('#finalRejectBtn').onclick = () => {
      db.collection('books').doc(bookId).update({ status: 'rejected' }).then(() => {
        closeModal(modal);
        loadPendingBooks();
      });
    };

    modal.style.display = 'flex';
  });
}

// --- User Modal ---
function openUserModal(userId) {
  const modal = document.getElementById('userModal');
  db.collection('users').doc(userId).get().then(doc => {
    const user = doc.data();
    if (!user) return;

    modal.querySelector('#modalUserName').textContent = user.name;
    modal.querySelector('#modalUserEmail').textContent = user.email;
    modal.querySelector('#modalUserRole').textContent = user.role || 'N/A';
    modal.querySelector('#modalUserJoined').textContent = user.joinedDate || 'N/A';
    modal.querySelector('#modalUserBooks').textContent = user.booksUploaded || 0;
    modal.querySelector('#modalUserStatus').textContent = user.status || 'Active';

    modal.querySelector('#deleteUserBtn').onclick = () => openDeleteUserModal(userId, user.name);
    modal.style.display = 'flex';
  });
}

// --- Delete User Modal ---
function openDeleteUserModal(userId, userName) {
  const modal = document.getElementById('deleteUserModal');
  modal.querySelector('#deleteUserName').textContent = userName;

  modal.querySelector('#confirmUserDelete').onclick = () => {
    db.collection('users').doc(userId).delete().then(() => {
      closeModal(modal);
      loadUsers();
    });
  };

  modal.querySelector('#cancelUserDelete').onclick = () => closeModal(modal);
  modal.style.display = 'flex';
}

// --- Close Modals ---
function closeModal(modal) {
  modal.style.display = 'none';
}

document.querySelectorAll('.modal .close').forEach(btn => {
  btn.onclick = () => closeModal(btn.closest('.modal'));
});

window.onclick = event => {
  document.querySelectorAll('.modal').forEach(modal => {
    if (event.target === modal) closeModal(modal);
  });
};

// --- Search Functionality ---
document.getElementById('searchUsersBtn')?.addEventListener('click', () => {
  const term = document.getElementById('searchUsers').value.toLowerCase();
  document.querySelectorAll('#usersList div').forEach(div => {
    div.style.display = div.textContent.toLowerCase().includes(term) ? 'block' : 'none';
  });
});

document.getElementById('searchBooksBtn')?.addEventListener('click', () => {
  const term = document.getElementById('searchBooks').value.toLowerCase();
  document.querySelectorAll('#allBooksList div').forEach(div => {
    div.style.display = div.textContent.toLowerCase().includes(term) ? 'block' : 'none';
  });
});
