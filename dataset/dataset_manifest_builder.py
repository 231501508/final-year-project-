import os
import glob
import json
import re
import pymupdf
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(BASE_DIR, "pdfs-20260922T200239Z-1-001", "pdfs")
LABEL_DIR = os.path.join(BASE_DIR, "labels-20260922T200409Z-1-001", "labels")
TEXT_DIR = os.path.join(BASE_DIR, "texts-20260922T200412Z-1-001", "texts")
RENDERED_IMG_DIR = os.path.join(BASE_DIR, "dataset", "raw_images")
ANNOTATION_DIR = os.path.join(BASE_DIR, "dataset", "annotations")

os.makedirs(RENDERED_IMG_DIR, exist_ok=True)
os.makedirs(ANNOTATION_DIR, exist_ok=True)

def build_pdf_dataset_manifest():
    """
    Parses 1,000 PDF documents in pdfs-20260922T200239Z-1-001/pdfs paired with
    labels in labels-20260922T200409Z-1-001/labels and ground-truth text in
    texts-20260922T200412Z-1-001/texts.
    Renders PDF pages to PNG images and generates dataset_manifest.json.
    """

    print(f"Indexing & rendering 1,000 PDF documents from: {PDF_DIR}", flush=True)
    
    pdf_files = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))
    if not pdf_files:
        print("Warning: No PDF files found in specified directory!", flush=True)
        return None

    manifest = []
    
    for idx, pdf_path in enumerate(pdf_files, 1):
        filename = os.path.basename(pdf_path)
        sample_id = os.path.splitext(filename)[0]

        # 1. Render PDF page 1 to PNG image using PyMuPDF
        rendered_img_filename = f"{sample_id}_page_1.png"
        rendered_img_path = os.path.join(RENDERED_IMG_DIR, rendered_img_filename)
        
        pdf_text_extracted = ""
        pdf_blocks = []
        w, h = 1241, 1754

        try:
            doc = pymupdf.open(pdf_path)
            if len(doc) > 0:
                page = doc[0]
                # Render to pixmap if image does not already exist
                if not os.path.exists(rendered_img_path):
                    pix = page.get_pixmap(dpi=120)
                    pix.save(rendered_img_path)
                    w, h = pix.width, pix.height
                else:
                    w, h = 1241, 1754

                # Extract text blocks & bounding boxes directly from PDF structure
                pdf_text_extracted = page.get_text()
                text_page_blocks = page.get_text("blocks")
                for b in text_page_blocks:
                    if len(b) >= 5 and b[4].strip():
                        b_x0, b_y0, b_x1, b_y1 = int(b[0]), int(b[1]), int(b[2]), int(b[3])
                        pdf_blocks.append({
                            "bbox": [b_x0, b_y0, max(20, b_x1 - b_x0), max(15, b_y1 - b_y0)],
                            "text": b[4].strip()
                        })
            doc.close()
        except Exception as e:
            print(f"Error rendering PDF {filename}: {e}", flush=True)

        # 2. Read JSON label metadata
        label_file = os.path.join(LABEL_DIR, f"{sample_id}.json")
        label_data = {}
        if os.path.exists(label_file):
            try:
                with open(label_file, "r", encoding="utf-8") as f:
                    label_data = json.load(f)
            except Exception as e:
                print(f"Error reading label file {label_file}: {e}", flush=True)

        # 3. Read ground truth text
        text_file = os.path.join(TEXT_DIR, f"{sample_id}.txt")
        text_lines = []
        if os.path.exists(text_file):
            try:
                with open(text_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    for line in content.splitlines():
                        line_str = line.strip()
                        if line_str and not line_str.startswith("{") and not line_str.startswith("}") and not line_str.startswith('"'):
                            text_lines.append(line_str)
            except Exception as e:
                print(f"Error reading text file {text_file}: {e}", flush=True)

        # 4. Build bounding box annotations
        annotations = []
        report_id = label_data.get("report_id", f"MED-{idx:05d}")
        patient_name = label_data.get("patient_name", "Unspecified Patient")
        doctor_name = label_data.get("doctor_name", "Unspecified Doctor")
        diagnosis = label_data.get("diagnosis", "Clinical Diagnosis")

        if pdf_blocks:
            for b in pdf_blocks:
                txt = b["text"]
                category = "TEXT"
                icd_code = None

                if "Medical Report" in txt or "Report ID" in txt:
                    category = "HOSPITAL_HEADER"
                elif "Patient Name" in txt or "Doctor" in txt:
                    category = "PATIENT_INFO"
                elif "Diagnosis" in txt:
                    category = "DIAGNOSIS_ICD10"
                    icd_code = label_data.get("icd10_code")

                annotations.append({
                    "text": txt.replace("\n", " "),
                    "category": category,
                    "bbox": b["bbox"],
                    "confidence": 0.98,
                    "icd10_code": icd_code
                })
        else:
            y_cursor = 100
            annotations.append({
                "text": f"Biomedical Report {report_id}",
                "category": "HOSPITAL_HEADER",
                "bbox": [100, y_cursor, 1000, 40],
                "confidence": 0.99
            })
            y_cursor += 60
            annotations.append({
                "text": f"Patient: {patient_name} | Doctor: {doctor_name}",
                "category": "PATIENT_INFO",
                "bbox": [100, y_cursor, 1000, 35],
                "confidence": 0.98
            })
            y_cursor += 50
            annotations.append({
                "text": f"Diagnosis: {diagnosis}",
                "category": "DIAGNOSIS_ICD10",
                "bbox": [100, y_cursor, 1000, 35],
                "confidence": 0.97
            })

        doc_entry = {
            "doc_id": sample_id,
            "pdf_file": filename,
            "pdf_path": pdf_path,
            "image_file": rendered_img_filename,
            "image_path": rendered_img_path,
            "image_size": [w, h],
            "report_id": report_id,
            "patient": patient_name,
            "doctor": doctor_name,
            "diagnosis": diagnosis,
            "icd10_codes": [label_data.get("icd10_code")] if label_data.get("icd10_code") else [],
            "extracted_pdf_text": pdf_text_extracted,
            "annotations": annotations
        }

        manifest.append(doc_entry)

        if idx % 200 == 0 or idx == len(pdf_files):
            print(f"  Processed [{idx}/{len(pdf_files)}] PDF documents...", flush=True)

    manifest_path = os.path.join(ANNOTATION_DIR, "dataset_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"PDF Dataset manifest build complete! Indexed {len(manifest)} PDFs -> {manifest_path}", flush=True)
    return manifest_path

build_dataset_manifest = build_pdf_dataset_manifest

if __name__ == "__main__":
    build_pdf_dataset_manifest()
