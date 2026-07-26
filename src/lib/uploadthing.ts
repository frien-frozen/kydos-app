import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
  schoolLogo: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async () => ({ uploadedBy: 'school' }))
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
  profilePicture: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async () => ({ uploadedBy: 'user' }))
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
  paymentProof: f({ image: { maxFileSize: '4MB', maxFileCount: 1 }, pdf: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => ({ uploadedBy: 'student' }))
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
