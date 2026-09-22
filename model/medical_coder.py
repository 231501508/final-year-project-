import os
import json
import re

class MedicalCoderEngine:
    """Automated ICD-10-CM & CPT Coding Engine from Bio-OCR Recognized Texts."""
    
    def __init__(self, db_path=None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), "..", "dataset", "icd10_database.json")
        
        self.db = {}
        if os.path.exists(db_path):
            with open(db_path, "r", encoding="utf-8") as f:
                self.db = json.load(f)
                
        self.icd_codes = self.db.get("icd10_codes", [])
        self.cpt_codes = self.db.get("cpt_codes", [])
        self.medications = self.db.get("medications_dictionary", [])

    def match_icd10_codes(self, full_text):
        """Matches clinical text against ICD-10 database keywords and descriptions."""
        text_lower = full_text.lower()
        matched_results = []

        # Check explicit ICD-10 code patterns in OCR text like [ICD-10-CM: E11.9] or E11.9
        explicit_codes = re.findall(r'\b[A-Z]\d{2}(?:\.\d{1,3})?\b', full_text)
        explicit_set = set(explicit_codes)

        for icd in self.icd_codes:
            code = icd["code"]
            desc = icd["description"]
            keywords = icd["keywords"]

            match_score = 0.0
            matched_triggers = []

            # Direct explicit code match
            if code in explicit_set:
                match_score += 0.95
                matched_triggers.append(f"Explicit code mention '{code}'")

            # Keyword matching
            for kw in keywords:
                if kw.lower() in text_lower:
                    match_score += 0.60
                    matched_triggers.append(f"Keyword match '{kw}'")

            # Medication context correlation (e.g., Metformin correlates with E11.9)
            for med in icd.get("common_medications", []):
                if med.lower() in text_lower:
                    match_score += 0.35
                    matched_triggers.append(f"Medication correlation '{med}'")

            if match_score > 0.4:
                confidence = min(0.99, round(match_score, 2))
                matched_results.append({
                    "icd10_code": code,
                    "description": desc,
                    "category": icd["category"],
                    "confidence": confidence,
                    "billing_risk": icd.get("billing_risk", "Low"),
                    "guidelines": icd.get("guidelines", ""),
                    "triggers": matched_triggers
                })

        # Sort by confidence descending
        matched_results.sort(key=lambda x: x["confidence"], reverse=True)
        return matched_results

    def match_cpt_codes(self, full_text):
        """Matches clinical text against CPT procedure codes."""
        text_lower = full_text.lower()
        matched_cpt = []

        for cpt in self.cpt_codes:
            code = cpt["code"]
            desc = cpt["description"]
            for kw in cpt["keywords"]:
                if kw.lower() in text_lower:
                    matched_cpt.append({
                        "cpt_code": code,
                        "description": desc,
                        "matched_term": kw,
                        "confidence": 0.90
                    })
                    break

        return matched_cpt

    def extract_medications(self, full_text):
        """Extracts prescribed medications, dosages, and drug categories."""
        text_lower = full_text.lower()
        extracted_meds = []

        for med in self.medications:
            name = med["name"]
            brand = med["brand"]
            
            if name.lower() in text_lower or brand.lower() in text_lower:
                # Look for dosage nearby
                dosage_match = re.search(rf'{name}\s+(\d+\s*(?:mg|mcg|ml|g))', full_text, re.IGNORECASE)
                dosage = dosage_match.group(1) if dosage_match else med["default_dosage"]

                extracted_meds.append({
                    "medication_name": name,
                    "brand_name": brand,
                    "dosage": dosage,
                    "frequency": med["default_freq"],
                    "category": med["category"]
                })

        return extracted_meds

    def process_ocr_document(self, ocr_result):
        """Full end-to-end medical coding analysis on OCR result output."""
        lines = ocr_result.get("lines", [])
        full_text = " ".join([line.get("corrected_text", line.get("raw_text", "")) for line in lines])

        icd_matches = self.match_icd10_codes(full_text)
        cpt_matches = self.match_cpt_codes(full_text)
        meds_extracted = self.extract_medications(full_text)

        primary_icd = icd_matches[0] if icd_matches else None
        secondary_icd = icd_matches[1:] if len(icd_matches) > 1 else []

        return {
            "full_text_analyzed": full_text,
            "primary_diagnosis_code": primary_icd,
            "secondary_diagnosis_codes": secondary_icd,
            "cpt_procedures": cpt_matches,
            "medications_detected": meds_extracted,
            "coding_summary": {
                "total_icd_codes": len(icd_matches),
                "total_medications": len(meds_extracted),
                "total_cpt_procedures": len(cpt_matches),
                "coding_status": "VALIDATED" if primary_icd else "NEEDS_REVIEW"
            }
        }

if __name__ == "__main__":
    coder = MedicalCoderEngine()
    test_text = "ST JUDE HOSPITAL. Patient has Type 2 diabetes mellitus and Essential hypertension. Prescribed Metformin 500mg and Amlodipine 5mg. ECG done."
    res = coder.process_ocr_document({"lines": [{"corrected_text": test_text}]})
    print("Medical Coder Test Result:")
    print("Primary Code:", res["primary_diagnosis_code"])
    print("Medications:", res["medications_detected"])
