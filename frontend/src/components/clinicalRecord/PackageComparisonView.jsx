import { useEffect, useState } from "react";
import { LuArrowLeft, LuTrophy, LuFileText } from "react-icons/lu";
import api from "../../services/api";

const ZONE_LABELS = {
  fatAbdomen: "Adiposidad Abdomen",
  fatWaist: "Adiposidad Cintura",
  fatHips: "Adiposidad Caderas",
  fatThighs: "Adiposidad Muslos",
  fatArms: "Adiposidad Brazos",
  fatLegs: "Adiposidad Piernas",
  fatUpperBack: "Adiposidad Espalda A",
  fatLowerBack: "Adiposidad Espalda Baja",
  fatChin: "Adiposidad Papada",
  celluliteAbdomen: "Celulitis Abdomen",
  celluliteWaist: "Celulitis Cintura",
  celluliteHips: "Celulitis Caderas",
  celluliteThighs: "Celulitis Muslos",
  celluliteArms: "Celulitis Brazos",
  celluliteLegs: "Celulitis Piernas",
  celluliteUpperBack: "Celulitis Espalda A",
  celluliteLowerBack: "Celulitis Espalda Baja",
  celluliteChin: "Celulitis Papada",
  stretchmarksAbdomen: "Estrías Abdomen",
  stretchmarksWaist: "Estrías Cintura",
  stretchmarksHips: "Estrías Caderas",
  stretchmarksThighs: "Estrías Muslos",
  stretchmarksArms: "Estrías Brazos",
  stretchmarksLegs: "Estrías Piernas",
  stretchmarksUpperBack: "Estrías Espalda A",
  stretchmarksLowerBack: "Estrías Espalda Baja",
  stretchmarksChin: "Estrías Papada",
};

const FACIAL_LABELS = {
  affectionInflammation: "Inflamación",
  affectionAcne: "Acné",
  affectionSpots: "Manchas",
  affectionRosacea: "Rosácea",
  affectionSensitivity: "Sensibilidad",
  affectionAging: "Envejecimiento",
  affectionFlaccidity: "Flacidez",
  affectionPhotoaging: "Foto envejecimiento",
};

const AREA_LABELS = {
  hasAcne: "Acné",
  hasSkinSpots: "Manchas",
  hasVitiligo: "Vitíligo",
  hasVaricoseVeins: "Varices",
  hasRosacea: "Rosácea",
  hasAlopecia: "Alopecia",
  hasHirsutism: "Hirsutismo",
  hasPreviousShaving: "Depilación previa",
  hasWaxingHistory: "Uso de cera",
  takesSupplements: "Suplementos",
  usesContraceptives: "Anticonceptivos",
  hasPregnancies: "Embarazos",
  hasPcos: "SOP",
};

const Row = ({ label, before, after }) => {
  const changed = String(before ?? "—") !== String(after ?? "—");
  return (
    <tr className={changed ? "bg-secondary/5" : ""}>
      <td className="p-3 text-sm font-semibold text-primary">{label}</td>
      <td className="p-3 text-sm text-gray-600">{before ?? "—"}</td>
      <td className="p-3 text-sm text-gray-600">{after ?? "—"}</td>
      <td className="p-3 text-center">
        {changed && (
          <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
            Cambió
          </span>
        )}
      </td>
    </tr>
  );
};

const listToLabels = (list, labelMap) =>
  (list || []).map((key) => labelMap[key] || key).join(", ") || "—";

const PackageComparisonView = ({
  packageId,
  type,
  customerName,
  onBack,
  availablePackages = [],
  onSelectPackage,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const endpoint =
          type === "medical"
            ? `/assessments/package-comparison/${packageId}`
            : `/laser-assessments/package-comparison/${packageId}`;
        const response = await api.get(endpoint);
        setData(response.data);
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "No se pudo cargar la comparación de este paquete.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [packageId, type]);

  const baseline = data?.baseline;
  const final = data?.final;

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-accent hover:text-primary transition-colors cursor-pointer"
          >
            <LuArrowLeft size={18} />
            Regresar
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <LuTrophy size={20} className="text-secondary" />
              Resultado del Paquete
            </h2>
            <p className="text-xs text-accent">{customerName}</p>
          </div>
        </div>

        {availablePackages.length > 1 && onSelectPackage && (
          <select
            value={packageId}
            onChange={(e) => onSelectPackage(Number(e.target.value))}
            className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold bg-white cursor-pointer"
          >
            {availablePackages.map((pkg, index) => (
              <option key={pkg.packageId} value={pkg.packageId}>
                Paquete #{availablePackages.length - index} (
                {pkg.sessionsCompleted}/{pkg.totalSessions} sesiones)
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-secondary text-center font-medium text-sm">
            Cargando comparación...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-red-600 text-center font-medium text-sm">
            {error}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-150">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="p-3 text-xs font-bold text-primary">
                    Indicador
                  </th>
                  <th className="p-3 text-xs font-bold text-primary">
                    Antes (Sesión 1)
                  </th>
                  <th className="p-3 text-xs font-bold text-primary">
                    Después (Última sesión)
                  </th>
                  <th className="p-3 text-xs font-bold text-primary text-center">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {type === "medical" ? (
                  <>
                    {baseline?.body && (
                      <>
                        <Row
                          label="Peso (kg)"
                          before={baseline.body.weightKg}
                          after={final?.body?.weightKg}
                        />
                        <Row
                          label="IMC"
                          before={baseline.body.bmi}
                          after={final?.body?.bmi}
                        />
                        <Row
                          label="Cintura (cm)"
                          before={baseline.body.waistCm}
                          after={final?.body?.waistCm}
                        />
                        <Row
                          label="Abdomen (cm)"
                          before={baseline.body.abdomenCm}
                          after={final?.body?.abdomenCm}
                        />
                        <Row
                          label="Cadera (cm)"
                          before={baseline.body.hipCm}
                          after={final?.body?.hipCm}
                        />
                        <Row
                          label="Brazos (cm)"
                          before={baseline.body.armsCm}
                          after={final?.body?.armsCm}
                        />
                        <Row
                          label="Pierna (cm)"
                          before={baseline.body.legCm}
                          after={final?.body?.legCm}
                        />
                        <Row
                          label="Textura celulitis"
                          before={baseline.body.celluliteTexture}
                          after={final?.body?.celluliteTexture}
                        />
                        <Row
                          label="Grado celulitis"
                          before={baseline.body.celluliteGrade}
                          after={final?.body?.celluliteGrade}
                        />
                        <Row
                          label="Zonas con adiposidad"
                          before={listToLabels(
                            baseline.body.fatZones,
                            ZONE_LABELS,
                          )}
                          after={
                            final
                              ? listToLabels(final.body?.fatZones, ZONE_LABELS)
                              : null
                          }
                        />
                        <Row
                          label="Zonas con celulitis"
                          before={listToLabels(
                            baseline.body.celluliteZones,
                            ZONE_LABELS,
                          )}
                          after={
                            final
                              ? listToLabels(
                                  final.body?.celluliteZones,
                                  ZONE_LABELS,
                                )
                              : null
                          }
                        />
                        <Row
                          label="Zonas con estrías"
                          before={listToLabels(
                            baseline.body.stretchmarksZones,
                            ZONE_LABELS,
                          )}
                          after={
                            final
                              ? listToLabels(
                                  final.body?.stretchmarksZones,
                                  ZONE_LABELS,
                                )
                              : null
                          }
                        />
                      </>
                    )}
                    {baseline?.facial && (
                      <>
                        <Row
                          label="Fototipo"
                          before={baseline.facial.phototype}
                          after={final?.facial?.phototype}
                        />
                        <Row
                          label="Escala Glogau"
                          before={baseline.facial.glogauScale}
                          after={final?.facial?.glogauScale}
                        />
                        <Row
                          label="Afecciones"
                          before={listToLabels(
                            baseline.facial.affections,
                            FACIAL_LABELS,
                          )}
                          after={
                            final
                              ? listToLabels(
                                  final.facial?.affections,
                                  FACIAL_LABELS,
                                )
                              : null
                          }
                        />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Row
                      label="Áreas de interés"
                      before={(baseline?.areas || []).join(", ") || "—"}
                      after={
                        final ? (final.areas || []).join(", ") || "—" : null
                      }
                    />
                    <Row
                      label="Condiciones clínicas"
                      before={listToLabels(baseline?.conditions, AREA_LABELS)}
                      after={
                        final
                          ? listToLabels(final.conditions, AREA_LABELS)
                          : null
                      }
                    />
                  </>
                )}
              </tbody>
            </table>
          </div>

          {!final && (
            <div className="p-4 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700 flex items-center gap-2">
                <LuFileText size={14} />
                Este paquete aún no tiene datos de la última sesión registrados.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PackageComparisonView;
