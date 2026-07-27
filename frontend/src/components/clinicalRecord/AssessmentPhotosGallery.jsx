import React, { useState, useEffect, useRef } from "react";
import { LuX, LuCamera, LuUpload, LuClock, LuCheck } from "react-icons/lu";
import api from "../../services/api";
import { showError, showToast } from "../../utils/alerts";

const AssessmentPhotosGallery = ({ assessmentId, laserAssessmentId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputsRef = useRef({});

  const fetchPhotos = async () => {
    if (!assessmentId && !laserAssessmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const query = assessmentId
        ? `assessmentId=${assessmentId}`
        : `laserAssessmentId=${laserAssessmentId}`;
      const response = await api.get(`/assessment-photos?${query}`);
      setPhotos(response.data || []);
    } catch (err) {
      console.error("Error al cargar fotografías del expediente:", err);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, laserAssessmentId]);

  const handleUploadClick = (photoId) => {
    fileInputsRef.current[photoId]?.click();
  };

  const handleFileChange = async (photoId, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingId(photoId);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await api.patch(
        `/assessment-photos/${photoId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setPhotos((prev) =>
        prev.map((p) => (p.photoId === photoId ? response.data : p)),
      );
      showToast("success", "Foto subida correctamente");
    } catch (err) {
      console.error("Error al subir la foto:", err);
      showError(
        "Error",
        err.response?.data?.message || "No se pudo subir la foto.",
      );
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <p className="text-xs text-gray-400 text-center py-6">
        Cargando fotografías...
      </p>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-gray-300 py-6">
        <LuCamera size={28} />
        <p className="text-xs text-gray-400 text-center">
          Este expediente no tiene fotografías registradas.
        </p>
      </div>
    );
  }

  const pendingCount = photos.filter((p) => p.isPending || !p.photoUrl).length;

  return (
    <>
      {pendingCount > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          Hay {pendingCount} foto{pendingCount !== 1 ? "s" : ""} pendiente
          {pendingCount !== 1 ? "s" : ""} de subir. Puedes cargarlas aquí mismo.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {photos.map((photo) => {
          const isPending = photo.isPending || !photo.photoUrl;
          const isUploading = uploadingId === photo.photoId;

          if (isPending) {
            return (
              <div
                key={photo.photoId}
                className="flex flex-col items-center gap-1.5"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => (fileInputsRef.current[photo.photoId] = el)}
                  onChange={(e) => handleFileChange(photo.photoId, e)}
                />
                <button
                  type="button"
                  onClick={() => handleUploadClick(photo.photoId)}
                  disabled={isUploading}
                  className="w-full h-24 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <span className="text-[10px] font-semibold text-amber-700">
                      Subiendo...
                    </span>
                  ) : (
                    <>
                      <LuUpload size={20} className="text-amber-600" />
                      <span className="text-[10px] font-semibold text-amber-700">
                        Subir foto
                      </span>
                    </>
                  )}
                </button>
                <span className="text-[11px] font-semibold text-primary text-center">
                  {photo.photoAngle}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <LuClock size={12} /> Pendiente
                </span>
              </div>
            );
          }

          return (
            <div
              key={photo.photoId}
              className="flex flex-col items-center gap-1.5"
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="w-full cursor-pointer group"
              >
                <img
                  src={photo.photoUrl}
                  alt={photo.photoAngle}
                  loading="lazy"
                  className="w-full h-24 object-cover rounded-lg border border-gray-100 group-hover:opacity-80 transition-opacity"
                />
              </button>
              <span className="text-[11px] font-semibold text-primary text-center">
                {photo.photoAngle}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <LuCheck size={12} /> Lista
              </span>
            </div>
          );
        })}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-5 right-5 text-white hover:text-gray-300 cursor-pointer"
          >
            <LuX size={28} />
          </button>
          <img
            src={selectedPhoto.photoUrl}
            alt={selectedPhoto.photoAngle}
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-bold bg-black/50 px-4 py-1.5 rounded-full">
            {selectedPhoto.photoAngle}
          </span>
        </div>
      )}
    </>
  );
};

export default AssessmentPhotosGallery;
