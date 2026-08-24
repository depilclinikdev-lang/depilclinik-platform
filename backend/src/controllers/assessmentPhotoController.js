// backend/src/controllers/assessmentPhotoController.js
import AssessmentPhoto from "../models/AssessmentPhoto.js";
import { compressImage } from "../utils/imageProcessor.js";
import {
  buildObjectKey,
  uploadBufferToS3,
  getPresignedUrl,
  deleteFromS3,
} from "../utils/s3Storage.js";

const PHOTO_ANGLES = [
  "Frente",
  "Perfil Derecho",
  "Perfil Izquierdo",
  "45 Grados",
  "135 Grados",
];

// Crea las 5 filas placeholder (pendientes) para una sesión recién guardada.
export const createPendingPhotosForAssessment = async (
  { assessmentId, laserAssessmentId },
  transaction,
) => {
  if (!assessmentId && !laserAssessmentId) {
    throw new Error(
      "Se requiere assessmentId o laserAssessmentId para crear las fotos",
    );
  }
  if (assessmentId && laserAssessmentId) {
    throw new Error(
      "Un registro de fotos no puede pertenecer a ambos expedientes a la vez",
    );
  }

  return AssessmentPhoto.bulkCreate(
    PHOTO_ANGLES.map((angle) => ({
      assessmentId: assessmentId || null,
      laserAssessmentId: laserAssessmentId || null,
      photoAngle: angle,
      isPending: true,
    })),
    { transaction },
  );
};

// Comprime la imagen con sharp y la sube a S3. La columna photo_url ahora
// guarda la KEY del objeto en S3 (no una URL pública, porque el bucket es
// privado); la URL firmada se genera al momento de leer, no al guardar.
export const uploadAssessmentPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se recibió ningún archivo" });
    }

    const photo = await AssessmentPhoto.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    const compressedBuffer = await compressImage(req.file.buffer);
    const objectKey = buildObjectKey("depilclinik/assessment-photos");
    await uploadBufferToS3(compressedBuffer, objectKey);

    // Si ya había una imagen previa en este registro (re-subida), borramos
    // la anterior de S3 para no dejar archivos huérfanos. Si el valor
    // anterior es una URL http (dato legado de Cloudinary), lo ignoramos.
    if (photo.photoUrl && !photo.photoUrl.startsWith("http")) {
      await deleteFromS3(photo.photoUrl).catch((err) =>
        console.error(
          "No se pudo borrar la imagen anterior en S3:",
          err.message,
        ),
      );
    }

    await photo.update({
      photoUrl: objectKey,
      isPending: false,
      uploadedByUserId: req.user.id,
    });

    const presignedUrl = await getPresignedUrl(objectKey);

    res.status(200).json({ ...photo.toJSON(), photoUrl: presignedUrl });
  } catch (error) {
    res.status(500).json({
      message: "Server error while uploading photo",
      error: error.message,
    });
  }
};

// Lista las 5 fotos de un expediente, firmando cada URL de S3 al vuelo.
export const getPhotosByAssessment = async (req, res) => {
  try {
    const { assessmentId, laserAssessmentId } = req.query;

    if (!assessmentId && !laserAssessmentId) {
      return res.status(400).json({
        message: "Se requiere assessmentId o laserAssessmentId",
      });
    }

    const where = assessmentId ? { assessmentId } : { laserAssessmentId };

    const photos = await AssessmentPhoto.findAll({
      where,
      order: [["photo_id", "ASC"]],
    });

    const withSignedUrls = await Promise.all(
      photos.map(async (photo) => {
        const plain = photo.toJSON();
        // Compatibilidad con datos de prueba antiguos subidos a Cloudinary
        // (URLs https ya públicas): esos se devuelven tal cual, sin firmar.
        if (plain.photoUrl && !plain.photoUrl.startsWith("http")) {
          plain.photoUrl = await getPresignedUrl(plain.photoUrl);
        }
        return plain;
      }),
    );

    res.status(200).json(withSignedUrls);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching photos",
      error: error.message,
    });
  }
};
