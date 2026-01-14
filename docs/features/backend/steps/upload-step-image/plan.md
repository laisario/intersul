# Feature: Upload Step Image

## Feature summary

Allows the assigned responsable to upload images to a service step for documentation purposes. Images are stored on the server and associated with the step record. Only the step's assigned responsable can upload images.

## User value

**What problem it solves:**
- Enables field technicians to document work with photos
- Provides visual evidence of service completion
- Supports quality assurance and audit requirements
- Allows before/after documentation of service work

**Who benefits:**
- Field technicians documenting their work
- Service managers reviewing service quality
- Administrators auditing service completion

## Scope

### In scope
- Image file upload (multipart/form-data)
- Image file validation (type, size)
- Image storage on server filesystem
- Image record creation in database
- Association with step record
- Image URL generation for access

### Out of scope
- Image editing or processing
- Image compression or optimization
- Multiple image upload in single request
- Image metadata extraction
- Image deletion (separate feature)

## User flow

1. User (responsable) selects image file for upload
2. User submits upload request with step ID and image file
3. System validates step exists and is assigned to current user
4. System validates image file (type, size)
5. System saves image file to uploads/steps directory
6. System creates image record in database
7. System associates image with step
8. System returns image record with URL
9. **Error state**: Step not found → 404 Not Found
10. **Error state**: Step not assigned to user → 400 Bad Request
11. **Error state**: Invalid file type → 400 Bad Request
12. **Error state**: File too large → 400 Bad Request

## Acceptance criteria

- Valid image file uploaded by step responsable is saved successfully
- Image is stored in uploads/steps directory with unique filename
- Image record is created and associated with step
- Response includes image URL for access
- Only step responsable can upload images
- Invalid file types are rejected
- File size limits are enforced

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `POST /steps/:id/images`: Accepts multipart/form-data with image file, saves file and creates image record

**Main rules/validations:**
- Requires JWT authentication
- Step must exist
- Step must be assigned to current user (responsable)
- File must be an image (mimetype starts with 'image/')
- File size limit: 10MB (or configured limit)
- Unique filename generation (timestamp + random)

## Data & permissions

**Entities/tables/collections:**
- `Step`: Read to validate and check assignment
- `Image`: Create operation with step association
- Filesystem: Write operation to uploads/steps directory

**Roles/permissions:**
- Requires JWT authentication
- Only the assigned responsable can upload images to their steps
- Admins/managers may have override permissions (needs confirmation)

## Edge cases & failures

**Validation errors:**
- Missing file: Returns 400 Bad Request
- Invalid file type: Returns 400 Bad Request
- File too large: Returns 400 Bad Request
- Invalid step ID: Returns 404 Not Found

**Missing data:**
- Step not found: Returns 404 Not Found
- Step not assigned to user: Returns 400 Bad Request

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized
- Step assigned to different user: Returns 400 Bad Request

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Filesystem write failure: Returns 500 error
- Disk space full: Returns 500 error

## Observability

**Logs/events:**
- Image uploads should be logged
- Failed upload attempts can be logged
- File storage errors should be logged

**Metrics (optional):**
- Images uploaded per day
- Average upload file size
- Upload success rate
- Storage usage

## Open questions

- What is the maximum file size limit?
- What image formats are supported (JPEG, PNG, WebP, etc.)?
- Should images be compressed or optimized?
- Can admins/managers upload images to any step?
- Is there a limit on images per step?
