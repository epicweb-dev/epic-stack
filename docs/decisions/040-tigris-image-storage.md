# Title: Switch to Tigris for Image Storage

Date: 2025-02-20

Status: accepted

## Context

The Epic Stack previously stored uploaded images directly in SQLite using binary
data storage. While this approach is simple and works well for small
applications, it has several limitations (as noted in the previous decision
[018-images.md](docs/decisions/018-images.md)):

1. Binary data in SQLite increases database size and backup complexity
2. Large binary data in SQLite can impact database performance
3. SQLite backups become larger and more time-consuming when including binary
   data
4. No built-in CDN capabilities for serving images efficiently

## Decision

We will switch from storing images in SQLite to storing them in Tigris, an
S3-compatible object storage service. This change will:

1. Move binary image data out of SQLite into specialized object storage
2. Maintain metadata about images in SQLite (references, ownership, etc.)
3. Leverage Tigris's S3-compatible API for efficient image storage and retrieval
4. Enable better scalability for applications with many image uploads

To keep things lightweight, we will not be using an S3 SDK to integrate with
Tigris and instead we'll manage authenticated fetch requests ourselves.

## Consequences

### Positive

1. Reduced SQLite database size and improved backup efficiency
2. Better separation of concerns (binary data vs relational data)
3. Potentially better image serving performance through Tigris's infrastructure
4. More scalable solution for applications with heavy image usage
5. Easier to implement CDN capabilities in the future
6. Simplified database maintenance and backup procedures
7. Tigris storage is much cheaper than Fly volume storage

### Negative

1. Additional external service dependency (though Fly as built-in support and no
   additional account needs to be created)
2. Need to manage Tigris configuration
3. Slightly more complex deployment setup
4. Additional complexity in image upload and retrieval logic

## Implementation Notes

The implementation involves:

1. Setting up Tigris configuration
2. Modifying image upload handlers to store files in Tigris
3. Updating image retrieval routes to serve from Tigris
4. Maintaining backward compatibility during migration (database migration is
   required as well as manual migration of existing images)
5. Providing migration utilities for existing applications

## References

- [Tigris Documentation](https://www.tigrisdata.com/docs)
- Previous image handling: [018-images.md](docs/decisions/018-images.md)
