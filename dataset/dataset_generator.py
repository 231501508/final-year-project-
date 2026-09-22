import os
import json
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_DIR = os.path.join(BASE_DIR, "raw_images")
ANNOTATION_DIR = os.path.join(BASE_DIR, "annotations")
DB_PATH = os.path.join(BASE_DIR, "icd10_database.json")

os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(ANNOTATION_DIR, exist_ok=True)

with open(DB_PATH, "r", encoding="utf-8") as f:
    DATABASE = json.load(f)

HOSPITALS = [
    "ST. JUDE BIOMEDICAL & GENERAL HOSPITAL",
    "METROCARE CLINICAL CENTER & RESEARCH INST.",
    "APEX HEALTHCARE MEDICAL CENTER",
    "CITY HEART & CHEST SPECIALTY CLINIC",
    "UNIVERSAL BIOMEDICAL CARE INSTITUTE"
]

DOCTORS = [
    "Dr. Arthur Vance, MD (Cardiology & Internal Med)",
    "Dr. Elena Rostova, MD, FACP (Endocrinology)",
    "Dr. Marcus Brody, MBBS, MD (Pulmonology)",
    "Dr. Sarah Jenkins, MD (General Practice)",
    "Dr. Rajesh Kumar, MD, DM (Gastroenterology)"
]

PATIENT_NAMES = [
    "Johnathon Miller", "Sophia Martinez", "Robert Chen", "Emma Watson",
    "David K. Williams", "Anita Patel", "Michael O'Connor", "Linda Taylor"
]

def load_system_font(size=18, bold=False):
    """Attempt to load a clean TTF font, falling back to default PIL font."""
    font_names = [
        "arial.ttf", "calibri.ttf", "segoeui.ttf", "times.ttf",
        "DejaVuSans.ttf", "FreeSans.ttf"
    ]
    if bold:
        font_names = ["arialbd.ttf", "calibrib.ttf", "segoeuib.ttf", "timesbd.ttf"] + font_names
    
    for fn in font_names:
        try:
            return ImageFont.truetype(fn, size)
        except Exception:
            continue
    return ImageFont.load_default()

def apply_paper_texture(img):
    """Add realistic paper grain, light tint, and slight noise texture."""
    width, height = img.size
    # Create subtle background color (off-white / vintage medical paper)
    bg_colors = [(252, 250, 245), (248, 249, 250), (250, 252, 248), (255, 253, 248)]
    bg_color = random.choice(bg_colors)
    
    bg = Image.new("RGB", (width, height), bg_color)
    # Blend with generated text image
    img = Image.blend(bg, img, 0.95)
    
    # Add random faint line artifacts (folded paper or scan line)
    draw = ImageDraw.Draw(img)
    if random.random() > 0.4:
        y_fold = random.randint(100, height - 100)
        draw.line([(0, y_fold), (width, y_fold)], fill=(220, 218, 210), width=1)
    
    # Slight blur / noise
    if random.random() > 0.5:
        img = img.filter(ImageFilter.GaussianBlur(radius=0.4))
        
    return img

def generate_medical_prescription(doc_id):
    """Generates a single synthetic medical document image and corresponding bounding box annotations."""
    width, height = 750, 950
    img = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Pick random hospital, doctor, patient, diagnosis
    hospital = random.choice(HOSPITALS)
    doctor = random.choice(DOCTORS)
    patient = random.choice(PATIENT_NAMES)
    age = random.randint(24, 78)
    gender = random.choice(["Male", "Female"])
    bp = f"{random.randint(110, 155)}/{random.randint(70, 95)} mmHg"
    pulse = f"{random.randint(62, 98)} bpm"
    date_str = f"2026-08-{random.randint(10, 28):02d}"

    # Pick 1-2 ICD-10 diagnoses
    selected_icd = random.sample(DATABASE["icd10_codes"], k=random.choice([1, 2]))
    diagnoses = [icd["keywords"][0].title() for icd in selected_icd]
    icd_codes = [icd["code"] for icd in selected_icd]

    # Pick 2-4 medications
    med_list = random.sample(DATABASE["medications_dictionary"], k=random.randint(2, 4))

    # Fonts
    font_header = load_system_font(22, bold=True)
    font_sub = load_system_font(14, bold=False)
    font_bold = load_system_font(15, bold=True)
    font_regular = load_system_font(14, bold=False)
    font_rx = load_system_font(36, bold=True)
    font_icd = load_system_font(14, bold=True)

    annotations = []

    y = 30
    # 1. Hospital Header
    bbox_h = draw.textbbox((0, 0), hospital, font=font_header)
    w_text = bbox_h[2] - bbox_h[0]
    x_h = (width - w_text) // 2
    draw.text((x_h, y), hospital, fill=(20, 40, 80), font=font_header)
    annotations.append({
        "text": hospital,
        "category": "HOSPITAL_HEADER",
        "bbox": [x_h, y, w_text, 28],
        "confidence": 0.99
    })
    y += 35

    sub_header = "DEPARTMENT OF CLINICAL PHARMACOLOGY & INTERNAL MEDICINE"
    bbox_sub = draw.textbbox((0, 0), sub_header, font=font_sub)
    w_sub = bbox_sub[2] - bbox_sub[0]
    draw.text(((width - w_sub)//2, y), sub_header, fill=(80, 90, 110), font=font_sub)
    y += 25

    draw.text((40, y), doctor, fill=(30, 30, 30), font=font_bold)
    y += 20
    draw.text((40, y), f"Reg No: MED-{random.randint(10000, 99999)} | Date: {date_str}", fill=(100, 100, 100), font=font_sub)
    y += 30

    # Horizontal Line
    draw.line([(40, y), (width - 40, y)], fill=(180, 190, 200), width=2)
    y += 20

    # 2. Patient Info Block
    p_info = f"PATIENT: {patient.upper()}   AGE/GENDER: {age}/{gender[0]}   VITAL BP: {bp}   PULSE: {pulse}"
    draw.text((40, y), p_info, fill=(40, 40, 40), font=font_bold)
    annotations.append({
        "text": p_info,
        "category": "PATIENT_INFO",
        "bbox": [40, y, width - 80, 22],
        "confidence": 0.98
    })
    y += 35

    draw.line([(40, y), (width - 40, y)], fill=(220, 225, 230), width=1)
    y += 20

    # 3. Clinical Impression / Diagnosis & ICD-10
    draw.text((40, y), "CLINICAL DIAGNOSIS & ICD-10 CODES:", fill=(180, 30, 30), font=font_bold)
    y += 25

    for icd in selected_icd:
        diag_line = f"• {icd['description']} [ICD-10-CM: {icd['code']}]"
        draw.text((60, y), diag_line, fill=(20, 20, 20), font=font_regular)
        annotations.append({
            "text": diag_line,
            "category": "DIAGNOSIS_ICD10",
            "bbox": [60, y, 620, 20],
            "icd10_code": icd['code'],
            "confidence": 0.97
        })
        y += 24

    y += 25

    # 4. Rx Symbol & Prescriptions
    draw.text((40, y), "Rx", fill=(0, 70, 150), font=font_rx)
    y += 45

    for idx, med in enumerate(med_list, 1):
        # Inject OCR error occasionally for synthetic training (15% chance)
        med_name = med["name"]
        if random.random() < 0.15:
            # Swap or alter letter
            med_name = med_name.replace("i", "1").replace("o", "0").replace("m", "nn")
        
        rx_line = f"{idx}. {med_name} ({med['brand']}) -- {med['default_dosage']}"
        freq_line = f"    Sig: {med['default_freq']} - Take as directed."
        
        draw.text((60, y), rx_line, fill=(10, 10, 10), font=font_bold)
        annotations.append({
            "text": rx_line,
            "category": "DRUG_PRESCRIPTION",
            "bbox": [60, y, 550, 22],
            "drug_name": med["name"],
            "dosage": med["default_dosage"],
            "confidence": 0.95
        })
        y += 25

        draw.text((60, y), freq_line, fill=(70, 70, 70), font=font_regular)
        annotations.append({
            "text": freq_line,
            "category": "FREQUENCY_INSTRUCTION",
            "bbox": [60, y, 550, 18],
            "frequency": med["default_freq"],
            "confidence": 0.94
        })
        y += 35

    # 5. Doctor Stamp & Signature Box
    y_sig = height - 140
    draw.rectangle([(width - 260, y_sig), (width - 50, y_sig + 80)], outline=(180, 180, 180), width=1)
    draw.text((width - 240, y_sig + 15), "DOCTOR SIGNATURE", fill=(150, 150, 150), font=font_sub)
    draw.text((width - 240, y_sig + 40), doctor.split(',')[0], fill=(20, 60, 120), font=font_bold)

    annotations.append({
        "text": f"Signed: {doctor}",
        "category": "DOCTOR_SIGNATURE",
        "bbox": [width - 260, y_sig, 210, 80],
        "confidence": 0.99
    })

    # Footer note
    draw.text((40, height - 40), "CONFIDENTIAL MEDICAL RECORD - FOR CLINICAL & CODING USE ONLY", fill=(140, 140, 140), font=font_sub)

    # Post processing: Paper Texture & Artifacts
    final_img = apply_paper_texture(img)

    # Save image
    img_filename = f"prescription_{doc_id:04d}.png"
    img_path = os.path.join(IMAGE_DIR, img_filename)
    final_img.save(img_path)

    doc_metadata = {
        "doc_id": f"DOC-{doc_id:04d}",
        "image_file": img_filename,
        "image_size": [width, height],
        "patient": patient,
        "doctor": doctor,
        "diagnoses": diagnoses,
        "icd10_codes": icd_codes,
        "annotations": annotations
    }

    return doc_metadata

def generate_dataset(num_samples=25):
    """Generate dataset of synthetic documents and save manifest."""
    print(f"Generating {num_samples} synthetic medical OCR documents...")
    manifest = []
    for i in range(1, num_samples + 1):
        metadata = generate_medical_prescription(i)
        manifest.append(metadata)
        if i % 5 == 0 or i == num_samples:
            print(f"  Generated [{i}/{num_samples}] documents...")

    manifest_path = os.path.join(ANNOTATION_DIR, "dataset_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Dataset generation complete! Manifest saved to {manifest_path}")
    return manifest_path

if __name__ == "__main__":
    generate_dataset(30)
