# Image Storage

The Epic Stack uses [Tigris](https://www.tigris.com), an S3-compatible object
storage service, for storing and serving uploaded images. Tigris is integrated
tightly with Fly.io, so you don't need to worry about setting up an account or
configuring any credentials.

## Configuration

To use Tigris for image storage, you need to configure the following environment
variables. These are automatically set for you on Fly.io when you create storage
for your app which happens when you create a new Epic Stack project.

```sh
AWS_ACCESS_KEY_ID="mock-access-key"
AWS_SECRET_ACCESS_KEY="mock-secret-key"
AWS_REGION="auto"
AWS_ENDPOINT_URL_S3="https://fly.storage.tigris.dev"
BUCKET_NAME="mock-bucket"
```

These environment variables are set automatically in the `.env` file locally and
a mock with MSW is set up so that everything works completely offline locally
during development.

## How It Works

The Epic Stack maintains a hybrid approach to image storage:

1. Image metadata (relationships, ownership, etc.) is stored in SQLite
2. The actual image binary data is stored in Tigris
3. Image URLs point to the local server which proxies to Tigris

### Database Schema

The database schema maintains references to images while the actual binary data
lives in Tigris:

```prisma
model UserImage {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  objectKey   String   // Reference to the image in Tigris
  contentType String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

model NoteImage {
  id          String   @id @default(cuid())
  noteId      String
  note        Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  objectKey   String   // Reference to the image in Tigris
  contentType String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([noteId])
}
```

### Image Upload Flow

1. When an image is uploaded, it's first processed by the application
   (validation, etc.)
2. The image is then streamed to Tigris
3. The metadata is stored in SQLite with a reference to the Tigris object key
4. The image can then be served by proxying to Tigris

## Customization

For more details on customization, see the source code in:

- `app/utils/storage.server.ts`
- `app/routes/resources+/note-images.$imageId.tsx`
- `app/routes/resources+/user-images.$imageId.tsx`
