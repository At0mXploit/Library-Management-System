# Library-Management-System

Library Management System with most basic ass features.

<img width="1365" height="642" alt="image" src="https://github.com/user-attachments/assets/64f445a3-fb61-4440-9902-8a0a174712ec" />

**Admin Login**:

```bash
admin
admin123
```

**User Portal**: Browse and manage books, upload new ones for approval, track your submissions with authentication funcionality and CRUD things.

**Admin Portal**: Dashboard overview, approve/reject books, manage all users and books.

**Frontend:** HTML, CSS, JavaScript
**Database & Auth:** Firebase Firestore & Firebase Authentication
**Hosting:** GitHub Pages

Firestore rule:

```js
service cloud.firestore {
  match /databases/{database}/documents {

    match /books/{bookId} {
      // Anyone can read approved or pending books
      allow read: if true;

      // Authenticated users can create
      allow create: if request.auth != null;

      // Only admin OR uploader can edit/delete
      allow update, delete: if request.auth != null &&
        (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
          resource.data.uploaderId == request.auth.uid
        );
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Yeah, nothing more really. Peace out!
## (—ᴗ—)
