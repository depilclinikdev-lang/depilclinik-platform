CREATE DATABASE IF NOT EXISTS clinic_management_db;
USE clinic_management_db;

-- ============================================================================
-- BLOQUE 1: ADMINISTRACIÓN, CLIENTES Y AGENDA
-- ============================================================================

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    birth DATE NULL,
    gender ENUM('H', 'M', 'ND') NOT NULL,
    address TEXT NULL,
    job_position VARCHAR(150) NULL,
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(10) NULL,
    medical_insurance_number VARCHAR(50) UNIQUE NULL,
    rol ENUM('Administrador', 'Colaborador') NOT NULL DEFAULT 'Colaborador',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unique key uq_users_public_id (public_id)
);

CREATE TABLE Customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NULL,
    birth DATE NOT NULL,
    gender ENUM('H', 'M', 'ND') NOT NULL,
    address TEXT NULL,
    occupation VARCHAR(150) NULL,
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(10) NULL,
    medical_insurance_number VARCHAR(50) UNIQUE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    brand ENUM('Modelha DK', 'Depilclinik') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    suggested_frequency VARCHAR(50) NULL,
    regular_price DECIMAL(10,2) NOT NULL,
    promo_price DECIMAL(10,2) NULL,
    requires_assessment BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Service_inclusions (
    inclusion_id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_inclusions_service FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE CASCADE
);

CREATE TABLE Appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    user_id INT NULL,
    marca ENUM('Modelha DK', 'Depilclinik') NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('Programada', 'Confirmada', 'En Tratamiento', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Programada',
    is_new_client_pending_data BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_customer FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT
);

-- ============================================================================
-- BLOQUE 2: EXPEDIENTE CLÍNICO GENERAL (MODELHA DK)
-- ============================================================================

CREATE TABLE Medical_Assessments (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    appointment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consultation_reason TEXT NOT NULL,
    onset_date_details VARCHAR(250) NULL,
    known_cause TEXT NULL,
    previous_care TEXT NULL,
    blood_type VARCHAR(5) NULL,
    residence_time VARCHAR(100) NULL,
    temperature_c DECIMAL(4,1) NULL,
    blood_pressure VARCHAR(20) NULL,
    oxygen_saturation INT NULL,
    heart_rate_bpm INT NULL,
    referred_media ENUM('Instagram', 'Facebook', 'TikTok', 'Recomendacion', 'Por su cuenta', 'Otro') NOT NULL,
    professional_assessment TEXT NULL,
    has_signed_consent BOOLEAN NOT NULL DEFAULT FALSE,
    consent_pdf_url VARCHAR(512) NULL,
    filled_by_user_id INT NULL,
    filled_at TIMESTAMP NULL,
    locked_for_collaborator BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_assessments_customer FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_assessments_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE SET NULL,
    CONSTRAINT fk_assessments_filled_by FOREIGN KEY (filled_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE assessment_professional_treatments (
    assessment_treatment_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    professional_type ENUM(
        'dermatologo', 
        'ginecologo', 
        'endocrinologo', 
        'psicologo_psiquiatra', 
        'medico_estetico', 
        'cirujano_plastico', 
        'cosmetologo', 
        'fisioterapeuta', 
        'nutriologo', 
        'otro'
    ) NOT NULL,
    treatment_details TEXT NULL,
    CONSTRAINT fk_prof_treatments_assessment FOREIGN KEY (assessment_id) 
        REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Gyneco_Obstetric_Records (
    gyneco_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    period_start_age INT NULL,
    menopause_start_age INT NULL,
    last_period_date DATE NULL,
    period_type ENUM('Regular', 'Irregular', 'Cólicos', 'Antojos') NULL,
     contraceptive_method VARCHAR(100) NULL,
    emergency_contraceptive VARCHAR(100) NULL,
    CONSTRAINT fk_gyneco_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Obstetric_History_Details (
    obstetric_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    gyneco_id INT NOT NULL,
    condition_status ENUM('Embarazo', 'Aborto', 'Lactancia') NOT NULL,
    count_value INT NOT NULL DEFAULT 1,
    notes TEXT NULL,
    CONSTRAINT fk_obstetric_gyneco FOREIGN KEY (gyneco_id) REFERENCES Gyneco_Obstetric_Records(gyneco_id) ON DELETE CASCADE
);

CREATE TABLE Modelha_Evolution_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,     
    appointment_id INT NOT NULL,    
    session_number INT NOT NULL,    
    treatment_description TEXT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_modelha_evo_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_modelha_evo_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE RESTRICT
);

-- ============================================================================
-- BLOQUE 3: ESTILO DE VIDA Y ANTECEDENTES MODELHA DK
-- ============================================================================

CREATE TABLE Daily_Skincare_Routines (
    routine_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    day_cleanser VARCHAR(150) NULL,
    day_moisturizer VARCHAR(150) NULL,
    day_sunscreen VARCHAR(150) NULL,
    day_exfoliator VARCHAR(150) NULL,
    day_toner VARCHAR(150) NULL,
    day_serum VARCHAR(150) NULL,
    day_other VARCHAR(255) NULL,
    night_cleanser VARCHAR(150) NULL,
    night_moisturizer VARCHAR(150) NULL,
    night_toner VARCHAR(150) NULL,
    night_eye_cream VARCHAR(150) NULL,
    night_makeup_remover VARCHAR(150) NULL,
    night_exfoliator VARCHAR(150) NULL,
    night_other VARCHAR(255) NULL,
    CONSTRAINT fk_routines_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Lifestyle_Habits (
    habit_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    makeup_frequency VARCHAR(100) NULL,
    washing_frequency VARCHAR(100) NULL,
    physical_activity_details TEXT NULL,
    sleep_time TIME NULL,
    wake_time TIME NULL,
    stress_level INT NOT NULL,
    day_description TEXT NOT NULL,
    CONSTRAINT fk_habits_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Patient_Diet_Ratings (
    diet_rating_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    food_item ENUM('refrescos', 'bebidas_energizantes', 'cafe', 'alcohol', 'pan_dulce_azucar', 'frituras', 'comida_picante', 'lacteos', 'proteina_gimnasio', 'carnes_rojas', 'vegetales', 'almendras_nueces', 'frutas', 'tabaco_vape', 'cannabis_drogas', 'litros_agua_diarios') NOT NULL,
    rating_value INT NOT NULL,
    CONSTRAINT fk_diet_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Patient_Skin_Practices (
    practice_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    substance_type ENUM('hidroquinona', 'barmicil', 'corticoides', 'remedios_caseros', 'otro') NOT NULL,
    aplication_details TEXT NULL,
    CONSTRAINT fk_practices_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Patient_Medical_Backgrounds (
    background_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    has_diabetes BOOLEAN DEFAULT FALSE,
    has_hyperthyroidism BOOLEAN DEFAULT FALSE,
    has_hypothyroidism BOOLEAN DEFAULT FALSE,
    has_policystic_ovary BOOLEAN DEFAULT FALSE,
    has_heart_failure BOOLEAN DEFAULT FALSE,
    has_hypertension_hypotension BOOLEAN DEFAULT FALSE,
    has_high_cholesterol BOOLEAN DEFAULT FALSE,
    has_thrombosis BOOLEAN DEFAULT FALSE,
    has_epilepsy BOOLEAN DEFAULT FALSE,
    has_migraine BOOLEAN DEFAULT FALSE,
    has_convulsions BOOLEAN DEFAULT FALSE,
    has_phobias BOOLEAN DEFAULT FALSE,
    has_depression BOOLEAN DEFAULT FALSE,
    has_anxiety BOOLEAN DEFAULT FALSE,
    has_gastritis BOOLEAN DEFAULT FALSE,
    has_irritable_colon BOOLEAN DEFAULT FALSE,
    has_digestive_disconforts BOOLEAN DEFAULT FALSE,
    has_kidney_diseases BOOLEAN DEFAULT FALSE,
    has_cancer_history BOOLEAN DEFAULT FALSE,
    has_hiv_aids BOOLEAN DEFAULT FALSE,
    has_hepatitis BOOLEAN DEFAULT FALSE,
    has_herpes BOOLEAN DEFAULT FALSE,
    has_fever BOOLEAN DEFAULT FALSE,
    has_body_head_pain BOOLEAN DEFAULT FALSE,
    has_throat_inflammation BOOLEAN DEFAULT FALSE,
    has_vomiting_nausea BOOLEAN DEFAULT FALSE,
    has_eye_diseases BOOLEAN DEFAULT FALSE,
    has_contact_lentes BOOLEAN DEFAULT FALSE,
    has_eyelash_extensions BOOLEAN DEFAULT FALSE,
    has_pacemaker BOOLEAN DEFAULT FALSE,
    has_metal_plates BOOLEAN DEFAULT FALSE,
    has_implants BOOLEAN DEFAULT FALSE,
    has_esthetic_fillers BOOLEAN DEFAULT FALSE,
    has_surgeries BOOLEAN DEFAULT FALSE,
    has_fractures BOOLEAN DEFAULT FALSE,
    has_medications BOOLEAN DEFAULT FALSE,
    has_pregnancy_lactation BOOLEAN DEFAULT FALSE,
    medical_observations TEXT NULL,
    CONSTRAINT fk_medical_bg_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Patient_Allergies_Records (
    allergy_record_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    allergy_food BOOLEAN DEFAULT FALSE,
    allergy_medication BOOLEAN DEFAULT FALSE,
    allergy_material BOOLEAN DEFAULT FALSE,
    allergy_product_ingredient BOOLEAN DEFAULT FALSE,
    allergy_object_animal BOOLEAN DEFAULT FALSE,
    has_dermographism BOOLEAN DEFAULT FALSE,
    has_sun_redness BOOLEAN DEFAULT FALSE,
    has_pets_at_home BOOLEAN DEFAULT FALSE,
    has_stress_reaction BOOLEAN DEFAULT FALSE,
    allergy_details TEXT NULL,
    CONSTRAINT fk_allergies_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

-- ============================================================================
-- BLOQUE 3B: EVALUACIÓN CORPORAL Y FACIAL (MODELHA DK)
-- ============================================================================

CREATE TABLE Body_Evaluations (
    body_eval_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    weight_kg DECIMAL(5,2) NULL,
    height_cm DECIMAL(5,2) NULL,
    waist_cm DECIMAL(5,2) NULL,
    abdomen_cm DECIMAL(5,2) NULL,
    hip_cm DECIMAL(5,2) NULL,
    arms_cm DECIMAL(5,2) NULL,
    leg_cm DECIMAL(5,2) NULL,
    bmi DECIMAL(4,1) NULL,
    bicipital_fold_mm DECIMAL(4,1) NULL,
    tricipital_fold_mm DECIMAL(4,1) NULL,
    abdominal_fold_mm DECIMAL(4,1) NULL,
    subiliac_fold_mm DECIMAL(4,1) NULL,
    crest_fold_mm DECIMAL(4,1) NULL,
    scapular_fold_mm DECIMAL(4,1) NULL,
    thigh_fold_mm DECIMAL(4,1) NULL,
    fat_abdomen BOOLEAN DEFAULT FALSE,
    fat_waist BOOLEAN DEFAULT FALSE,
    fat_hips BOOLEAN DEFAULT FALSE,
    fat_thighs BOOLEAN DEFAULT FALSE,
    fat_arms BOOLEAN DEFAULT FALSE,
    fat_upper_back BOOLEAN DEFAULT FALSE,
    fat_lower_back BOOLEAN DEFAULT FALSE,
    fat_chin BOOLEAN DEFAULT FALSE,
    cellulite_abdomen BOOLEAN DEFAULT FALSE,
    cellulite_waist BOOLEAN DEFAULT FALSE,
    cellulite_hips BOOLEAN DEFAULT FALSE,
    cellulite_thighs BOOLEAN DEFAULT FALSE,
    cellulite_arms BOOLEAN DEFAULT FALSE,
    cellulite_upper_back BOOLEAN DEFAULT FALSE,
    cellulite_lower_back BOOLEAN DEFAULT FALSE,
    cellulite_chin BOOLEAN DEFAULT FALSE,
    cellulite_texture ENUM('Flacida','Compacta','Mixta','Edematosa') NULL,
    cellulite_grade VARCHAR(50) NULL,
    stretchmarks_abdomen BOOLEAN DEFAULT FALSE,
    stretchmarks_waist BOOLEAN DEFAULT FALSE,
    stretchmarks_hips BOOLEAN DEFAULT FALSE,
    stretchmarks_thighs BOOLEAN DEFAULT FALSE,
    stretchmarks_arms BOOLEAN DEFAULT FALSE,
    stretchmarks_upper_back BOOLEAN DEFAULT FALSE,
    stretchmarks_lower_back BOOLEAN DEFAULT FALSE,
    stretchmarks_chin BOOLEAN DEFAULT FALSE,
    varices_small BOOLEAN DEFAULT FALSE,
    varices_visible BOOLEAN DEFAULT FALSE,
    varices_edema BOOLEAN DEFAULT FALSE,
    varices_ulcers BOOLEAN DEFAULT FALSE,
    varices_discoloration BOOLEAN DEFAULT FALSE,
    varices_telangiectasias BOOLEAN DEFAULT FALSE,
    body_diagnosis TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_body_eval_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

CREATE TABLE Facial_Evaluations (
    facial_eval_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    skin_age ENUM('Joven','Madura') NULL,
    affection_inflammation BOOLEAN DEFAULT FALSE,
    affection_acne BOOLEAN DEFAULT FALSE,
    affection_spots BOOLEAN DEFAULT FALSE,
    affection_rosacea BOOLEAN DEFAULT FALSE,
    affection_sensitivity BOOLEAN DEFAULT FALSE,
    affection_aging BOOLEAN DEFAULT FALSE,
    affection_flaccidity BOOLEAN DEFAULT FALSE,
    affection_photoaging BOOLEAN DEFAULT FALSE,
    secretion_type ENUM('Seca','Grasa','Mixta') NULL,
    phototype ENUM('I','II','III','IV','V') NULL,
    primary_ephelides BOOLEAN DEFAULT FALSE,
    primary_macules BOOLEAN DEFAULT FALSE,
    primary_lentigos BOOLEAN DEFAULT FALSE,
    primary_comedones BOOLEAN DEFAULT FALSE,
    primary_milliums BOOLEAN DEFAULT FALSE,
    primary_vesicles BOOLEAN DEFAULT FALSE,
    primary_papules BOOLEAN DEFAULT FALSE,
    primary_pustules BOOLEAN DEFAULT FALSE,
    primary_scales BOOLEAN DEFAULT FALSE,
    primary_cysts BOOLEAN DEFAULT FALSE,
    secondary_scars BOOLEAN DEFAULT FALSE,
    secondary_crusts BOOLEAN DEFAULT FALSE,
    secondary_nodules BOOLEAN DEFAULT FALSE,
    secondary_tubercle BOOLEAN DEFAULT FALSE,
    secondary_marks BOOLEAN DEFAULT FALSE,
    secondary_ulcers BOOLEAN DEFAULT FALSE,
    secondary_erythrosis BOOLEAN DEFAULT FALSE,
    secondary_pustules BOOLEAN DEFAULT FALSE,
    secondary_scales BOOLEAN DEFAULT FALSE,
    secondary_cysts BOOLEAN DEFAULT FALSE,
    pigmentation_melasma BOOLEAN DEFAULT FALSE,
    pigmentation_lentigos BOOLEAN DEFAULT FALSE,
    pigmentation_post_inflammatory BOOLEAN DEFAULT FALSE,
    pigmentation_achromia BOOLEAN DEFAULT FALSE,
    pigmentation_vitiligo BOOLEAN DEFAULT FALSE,
    pigmentation_other TEXT NULL,
    vascular_erythema BOOLEAN DEFAULT FALSE,
    vascular_erythrosis BOOLEAN DEFAULT FALSE,
    vascular_telangiectasias BOOLEAN DEFAULT FALSE,
    vascular_couperose BOOLEAN DEFAULT FALSE,
    vascular_angiomas BOOLEAN DEFAULT FALSE,
    vascular_other TEXT NULL,
    aging_furrows BOOLEAN DEFAULT FALSE,
    aging_wrinkles BOOLEAN DEFAULT FALSE,
    aging_expression_lines BOOLEAN DEFAULT FALSE,
    aging_flaccidity BOOLEAN DEFAULT FALSE,
    aging_angiomas BOOLEAN DEFAULT FALSE,
    aging_other TEXT NULL,
    glogau_scale ENUM('I','II','III','IV') NULL,
    glogau_observations TEXT NULL,
    facial_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_facial_eval_assessment FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE
);

-- ============================================================================
-- BLOQUE 4: OPERACIÓN Y CLÍNICA DEPILCLINIK
-- ============================================================================

CREATE TABLE Laser_Medical_Assessments (
    laser_assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    appointment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referred_media ENUM('Instagram', 'Facebook', 'TikTok', 'Recomendacion', 'Por su cuenta', 'Otro') NOT NULL,
    has_diseases BOOLEAN DEFAULT FALSE,
    diseases_notes TEXT NULL,
    has_medications BOOLEAN DEFAULT FALSE,
    medications_notes TEXT NULL,
    has_tattoos BOOLEAN DEFAULT FALSE,
    tattoos_notes TEXT NULL,
    has_allergies BOOLEAN DEFAULT FALSE,
    allergies_notes TEXT NULL,
    has_aesthetic_procedures BOOLEAN DEFAULT FALSE,
    aesthetics_procedures_notes TEXT NULL,
    has_signed_consent BOOLEAN DEFAULT FALSE,
    consent_pdf_url VARCHAR(512) NULL,
    filled_by_user_id INT NULL,
    filled_at TIMESTAMP NULL,
    locked_for_collaborator BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_laser_customer FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_laser_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE SET NULL,
    CONSTRAINT fk_laser_filled_by FOREIGN KEY (filled_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE Laser_Areas_Of_Interest (
    laser_area_interest_id INT AUTO_INCREMENT PRIMARY KEY,
    laser_assessment_id INT NOT NULL,
    area_name ENUM('Extra Chicas', 'Chicas', 'Mediana', 'Grande', 'Full Body') NOT NULL,
    CONSTRAINT fk_laser_areas_assessment FOREIGN KEY (laser_assessment_id) REFERENCES Laser_Medical_Assessments(laser_assessment_id) ON DELETE CASCADE
);

CREATE TABLE Laser_Clinical_Conditions (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    laser_assessment_id INT NOT NULL,
    has_acne BOOLEAN DEFAULT FALSE,
    has_skin_spots BOOLEAN DEFAULT FALSE,
    has_vitiligo BOOLEAN DEFAULT FALSE,
    has_varicose_veins BOOLEAN DEFAULT FALSE,
    has_rosacea BOOLEAN DEFAULT FALSE,
    has_alopecia BOOLEAN DEFAULT FALSE,
    has_hirsutism BOOLEAN DEFAULT FALSE,
    has_previous_shaving BOOLEAN DEFAULT FALSE,
    has_waxing_history BOOLEAN DEFAULT FALSE,
    takes_supplements BOOLEAN DEFAULT FALSE,
    uses_contraceptives BOOLEAN DEFAULT FALSE,
    has_pregnancies BOOLEAN DEFAULT FALSE,
    has_pcos BOOLEAN DEFAULT FALSE,
    gynecological_other_notes TEXT NULL,
    CONSTRAINT fk_laser_conditions_assessment FOREIGN KEY (laser_assessment_id) REFERENCES Laser_Medical_Assessments(laser_assessment_id) ON DELETE CASCADE
);

CREATE TABLE Laser_Evolution_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    laser_assessment_id INT NOT NULL,
    appointment_id INT NOT NULL,
    session_number INT NOT NULL,
    laser_brand_model VARCHAR(100) NULL,
    evolution_notes TEXT NULL,
    CONSTRAINT fk_evolution_laser_assessment FOREIGN KEY (laser_assessment_id) REFERENCES Laser_Medical_Assessments(laser_assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_evolution_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE RESTRICT
);

-- ============================================================================
-- BLOQUE 5: CONTENEDOR MULTIMEDIA GLOBAL (FOTOS POR SESIÓN)
-- ============================================================================

CREATE TABLE Assessment_Photos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NULL,
    laser_assessment_id INT NULL,
    photo_angle ENUM(
        'Frente',
        'Perfil Derecho',
        'Perfil Izquierdo',
        '45 Grados',
        '135 Grados'
    ) NOT NULL,
    photo_url VARCHAR(512) NULL,
    is_pending BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_photos_modelha FOREIGN KEY (assessment_id) REFERENCES Medical_Assessments(assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_laser FOREIGN KEY (laser_assessment_id) REFERENCES Laser_Medical_Assessments(laser_assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_uploaded_by FOREIGN KEY (uploaded_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_photos_one_parent CHECK (
        (assessment_id IS NOT NULL AND laser_assessment_id IS NULL)
        OR
        (assessment_id IS NULL AND laser_assessment_id IS NOT NULL)
    )
);

-- ============================================================================
-- BLOQUE 6: VENTAS E INGRESOS
-- ============================================================================

CREATE TABLE Sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(20) NOT NULL UNIQUE,
    appointment_id INT NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    user_id INT NOT NULL,
    marca ENUM('Modelha DK', 'Depilclinik') NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('Liquidada', 'Con adeudo', 'Cancelada') NOT NULL DEFAULT 'Con adeudo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT
);

CREATE TABLE Sale_Items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    service_id INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_saleitems_sale FOREIGN KEY (sale_id) REFERENCES Sales(sale_id) ON DELETE CASCADE,
    CONSTRAINT fk_saleitems_service FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE RESTRICT
);

CREATE TABLE Sale_Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Efectivo', 'Tarjeta', 'Transferencia') NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by_user_id INT NULL,
    CONSTRAINT fk_payments_sale FOREIGN KEY (sale_id) REFERENCES Sales(sale_id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_user FOREIGN KEY (registered_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- ============================================================================
-- BLOQUE 7: NOTIFICACIONES DE WHATSAPP (CONFIRMACIÓN DE CITAS)
-- ============================================================================

CREATE TABLE Whatsapp_Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    status ENUM(
        'Pendiente',
        'Enviado',
        'Entregado',
        'Leido',
        'Confirmada',
        'Cancelada_Cliente',
        'Sin_Respuesta',
        'Fallido'
    ) NOT NULL DEFAULT 'Pendiente',
    whatsapp_message_id VARCHAR(100) NULL,
    template_used VARCHAR(100) NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    responded_at TIMESTAMP NULL,
    error_message TEXT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_whatsapp_appointment FOREIGN KEY (appointment_id)
        REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    UNIQUE KEY uq_whatsapp_appointment (appointment_id)
);

CREATE TABLE Customer_Packages (
    package_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    marca ENUM('Modelha DK', 'Depilclinik') NOT NULL,
    total_sessions INT NOT NULL,
    sessions_completed INT NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status ENUM('Pagado', 'Con adeudo') NOT NULL DEFAULT 'Con adeudo',
    status ENUM('Activo', 'Completado', 'Cancelado') NOT NULL DEFAULT 'Activo',
    notes TEXT NULL,
    sold_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_packages_customer FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_packages_service FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE RESTRICT,
    CONSTRAINT fk_packages_sold_by FOREIGN KEY (sold_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE Package_Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Efectivo', 'Tarjeta', 'Transferencia') NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by_user_id INT NULL,
    CONSTRAINT fk_pkg_payments_package FOREIGN KEY (package_id) REFERENCES Customer_Packages(package_id) ON DELETE CASCADE,
    CONSTRAINT fk_pkg_payments_user FOREIGN KEY (registered_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE Package_Sessions (
    package_session_id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    session_number INT NOT NULL,
    appointment_id INT NULL,
    status ENUM('Pendiente', 'Agendada', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Pendiente',
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_pkgsessions_package FOREIGN KEY (package_id) REFERENCES Customer_Packages(package_id) ON DELETE CASCADE,
    CONSTRAINT fk_pkgsessions_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE SET NULL,
    UNIQUE KEY uq_package_session_number (package_id, session_number)
);